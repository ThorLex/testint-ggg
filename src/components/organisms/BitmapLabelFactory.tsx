/**
 * Factory de bitmaps de labels pour les bâtiments (amodiataires).
 *
 * Rend chaque label À L'ÉCRAN (coin bas-gauche), le capture en PNG via
 * react-native-view-shot, met le résultat en cache, puis retire le label
 * de l'écran. Le rendu on-screen garantit que le GPU composite réellement
 * la vue avant capture (évite les captures blanches sur certains drivers).
 *
 * Architecture :
 *   - Un <CaptureItem> par label (batch de BATCH_SIZE)
 *   - Visible sur écran → captureRef → setCachedBitmap → retire du DOM
 *   - Retry jusqu'à MAX_RETRIES ; après échec total, avance quand même
 *   - Tous les bitmaps déjà en cache sont skip automatiquement
 *
 * Note : ce composant gère UNIQUEMENT les labels de bâtiments (kind: 'building').
 * Les labels de routes sont gérés séparément par RouteNameLabelFactory,
 * qui ne démarre qu'une fois ce composant terminé ET démonté (via onAllDone).
 *
 * @module components/organisms/MapView/BitmapLabelFactory
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import {
    buildLabelKeyById,
    getCachedBitmap,
    setCachedBitmap,
} from './labelBitmaps';

/** Bitmaps traités simultanément. Réduit la pression GPU tout en gardant
 *  un pipeline fluide. Chaque item est affiché sur écran, capturé, puis retiré. */
const BATCH_SIZE = 8;
const MAX_RETRIES = 3;

export interface BuildingLabelTemplate {
    kind: 'building';
    /** ID de l'amodiataire — utilisé pour la clé de cache (évite les collisions de noms) */
    id: string;
    name: string;
    isPriority: boolean;
}

export type LabelTemplate = BuildingLabelTemplate;

interface Props {
    /** Liste de tous les labels à générer (déduplication faite en interne) */
    templates: LabelTemplate[];
    /** Callback appelé après chaque bitmap généré (pour trigger un re-render) */
    onBitmapReady?: (key: string) => void;
    /** Callback appelé une seule fois quand tous les bitmaps sont générés */
    onAllDone?: () => void;
}

// ============================================================================
// Constantes de rendu (doivent matcher le rendu visuel des markers)
// ============================================================================

const LABEL_MAX_W = 250;   // 30 chars × ~8px + 2×8px padding
const LABEL_FONT  = 12;
const LABEL_LINE  = 17;
const LABEL_PAD_V = 4;
const PIN_R       = 11;
const PIN_TIP     = 7;

// ============================================================================
// Composant principal
// ============================================================================

export const BitmapLabelFactory = React.memo(function BitmapLabelFactory({
    templates,
    onBitmapReady,
    onAllDone,
}: Props) {
    // Index du premier item du batch courant
    const [batchOffset, setBatchOffset] = useState(0);
    const allDoneFired = useRef(false);

    // Déduplique + filtre ceux pas encore en cache
    const todo = React.useMemo(() => {
        const seen = new Set<string>();
        const list: Array<{ key: string; tpl: LabelTemplate }> = [];
        for (const tpl of templates) {
            const key = buildLabelKeyById(tpl.id, tpl.isPriority);
            if (seen.has(key)) continue;
            if (getCachedBitmap(key)) continue;
            seen.add(key);
            list.push({ key, tpl });
        }
        return list;
    }, [templates]);

    // Passe au batch suivant quand tous les items du batch courant sont capturés
    const capturedInBatch = useRef(0);
    const totalCaptured = useRef(0);

    const handleBatchItemCaptured = (key: string) => {
        capturedInBatch.current += 1;
        totalCaptured.current += 1;
        onBitmapReady?.(key);

        // Tous les bitmaps de la liste sont générés
        if (totalCaptured.current >= todo.length && !allDoneFired.current) {
            allDoneFired.current = true;
            onAllDone?.();
        }

        if (capturedInBatch.current >= BATCH_SIZE) {
            capturedInBatch.current = 0;
            setBatchOffset((prev) => prev + BATCH_SIZE);
        }
    };

    // Réinitialise l'offset quand la liste change
    useEffect(() => {
        setBatchOffset(0);
        capturedInBatch.current = 0;
        totalCaptured.current = 0;
        allDoneFired.current = false;
    }, [todo.length]);

    // Si rien à générer, signaler immédiatement que c'est terminé
    useEffect(() => {
        if (todo.length === 0 && !allDoneFired.current) {
            allDoneFired.current = true;
            onAllDone?.();
        }
    }, [todo.length, onAllDone]);

    if (todo.length === 0) return null;

    // Rendre uniquement le batch courant
    const currentBatch = todo.slice(batchOffset, batchOffset + BATCH_SIZE);

    return (
        <View style={styles.factory} pointerEvents="none" collapsable={false}>
            {currentBatch.map(({ key, tpl }) => (
                <CaptureItem
                    key={key}
                    cacheKey={key}
                    template={tpl}
                    onCaptured={handleBatchItemCaptured}
                />
            ))}
        </View>
    );
});

// ============================================================================
// CaptureItem — label affiché à l'écran, capturé, puis retiré du DOM
// ============================================================================

function CaptureItem({
    cacheKey,
    template,
    onCaptured,
}: {
    cacheKey: string;
    template: BuildingLabelTemplate;
    onCaptured?: (key: string) => void;
}) {
    const ref = useRef<View>(null);
    // done=true → retire le label de l'écran après capture (ou après échec total)
    const [done, setDone] = useState(false);
    // incrémenté à chaque tentative échouée pour relancer useEffect
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (done) return;

        // Délai croissant entre tentatives pour laisser le layout se stabiliser
        const delay = 80 + retryCount * 60;
        const timer = setTimeout(async () => {
            if (!ref.current) return;
            try {
                const dataUri = await captureRef(ref, {
                    format: 'png',
                    quality: 1,
                    result: 'tmpfile',
                });
                await setCachedBitmap(cacheKey, dataUri);
                setDone(true);
                onCaptured?.(cacheKey);
            } catch (err) {
                console.warn('Bitmap capture failed:', cacheKey, `(tentative ${retryCount + 1}/${MAX_RETRIES})`, err);
                if (retryCount >= MAX_RETRIES - 1) {
                    // Épuisé les tentatives — avancer quand même pour ne pas bloquer la chaîne
                    setDone(true);
                    onCaptured?.(cacheKey);
                } else {
                    setRetryCount(v => v + 1);
                }
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [cacheKey, retryCount, done]);

    // Label affiché à l'écran jusqu'à la capture ; retiré ensuite
    if (done) return null;

    return <BuildingLabelView ref={ref} name={template.name} isPriority={template.isPriority} />;
}

// ============================================================================
// Visuels — exactement ce que produira le bitmap final
// ============================================================================

const BuildingLabelView = React.forwardRef<View, { name: string; isPriority: boolean }>(
    function BuildingLabelView({ name, isPriority }, ref) {
        const pinColor = isPriority ? '#F59E0B' : '#8a9bb0';
        return (
            <View ref={ref} collapsable={false} style={styles.composite}>
                <View style={styles.bubble}>
                    <Text style={styles.labelText} allowFontScaling={false}>
                        {name}
                    </Text>
                </View>
                <View style={{ height: 3 }} />
                <View style={[styles.pinCircle, { backgroundColor: pinColor }]}>
                    <View style={styles.pinDot} />
                </View>
                <View style={[styles.pinTip, { borderTopColor: pinColor }]} />
            </View>
        );
    }
);

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    factory: {
        position: 'absolute',
        top: -10000,
        left: -10000,
        opacity: 0,
    },
    composite: {
        width: LABEL_MAX_W,
        alignItems: 'center',
        marginBottom: 6,
    },
    bubble: {
        width: LABEL_MAX_W,
        paddingHorizontal: 8,
        paddingVertical: LABEL_PAD_V,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderRadius: 6,
        alignItems: 'center',
    },
    labelText: {
        color: '#ffffff',
        fontSize: LABEL_FONT,
        fontWeight: '700',
        textAlign: 'right',
        lineHeight: LABEL_LINE,
        includeFontPadding: true,
    },
    pinCircle: {
        width: PIN_R * 2,
        height: PIN_R * 2,
        borderRadius: PIN_R,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    pinDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ffffff',
    },
    pinTip: {
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: PIN_TIP,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -1,
    },
});