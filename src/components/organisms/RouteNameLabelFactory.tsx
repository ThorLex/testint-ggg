/**
 * Factory de bitmaps pour les noms de routes/allées.
 *
 * Style Google Maps : label plat ancré au milieu de la polyligne,
 * sans pin — fond sombre, texte blanc, coin bas-droit de l'écran.
 *
 * Architecture identique à BitmapLabelFactory :
 *   - Rendu À L'ÉCRAN (coin bas-droit, séparé de BitmapLabelFactory)
 *   - Label visible → captureRef → PNG → bitmapCache → retiré du DOM
 *   - Retry jusqu'à MAX_RETRIES ; avance quand même après échec total
 *   - Démarre uniquement après démontage de BitmapLabelFactory (séparation GPU)
 *
 * @module components/organisms/MapView/RouteNameLabelFactory
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { buildRouteKey, getCachedBitmap, setCachedBitmap } from './labelBitmaps';

const BATCH_SIZE = 8;
const MAX_RETRIES = 3;

// ============================================================================
// Types
// ============================================================================

export interface RouteLabelTemplate {
    kind: 'route';
    /** ID unique de la route — clé de cache */
    id: string;
    /** Nom affiché sur la route */
    name: string;
    /** Type de voie (primary, secondary, footway…) pour le style */
    roadType?: string;
}

interface Props {
    templates: RouteLabelTemplate[];
    onBitmapReady?: (key: string) => void;
}

// ============================================================================
// Composant principal
// ============================================================================

export const RouteNameLabelFactory = React.memo(function RouteNameLabelFactory({
    templates,
    onBitmapReady,
}: Props) {
    const [batchOffset, setBatchOffset] = useState(0);

    const todo = React.useMemo(() => {
        const seen = new Set<string>();
        const list: Array<{ key: string; tpl: RouteLabelTemplate }> = [];
        for (const tpl of templates) {
            const key = buildRouteKey(tpl.id);
            if (seen.has(key)) continue;
            if (getCachedBitmap(key)) continue;
            seen.add(key);
            list.push({ key, tpl });
        }
        return list;
    }, [templates]);

    const capturedInBatch = useRef(0);

    const handleBatchItemCaptured = (key: string) => {
        capturedInBatch.current += 1;
        onBitmapReady?.(key);
        if (capturedInBatch.current >= BATCH_SIZE) {
            capturedInBatch.current = 0;
            setBatchOffset((prev) => prev + BATCH_SIZE);
        }
    };

    useEffect(() => {
        setBatchOffset(0);
        capturedInBatch.current = 0;
    }, [todo.length]);

    if (todo.length === 0) return null;

    const currentBatch = todo.slice(batchOffset, batchOffset + BATCH_SIZE);

    return (
        <View style={styles.factory} pointerEvents="none" collapsable={false}>
            {currentBatch.map(({ key, tpl }) => (
                <RouteCaptureItem
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

function RouteCaptureItem({
    cacheKey,
    template,
    onCaptured,
}: {
    cacheKey: string;
    template: RouteLabelTemplate;
    onCaptured?: (key: string) => void;
}) {
    const ref = useRef<View>(null);
    // done=true → retire le label de l'écran après capture (ou après échec total)
    const [done, setDone] = useState(false);
    // incrémenté à chaque tentative échouée pour relancer useEffect
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (done) return;

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
                console.warn('RouteLabel capture failed:', cacheKey, `(tentative ${retryCount + 1}/${MAX_RETRIES})`, err);
                if (retryCount >= MAX_RETRIES - 1) {
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

    return <RouteLabelView ref={ref} name={template.name} roadType={template.roadType} />;
}

// ============================================================================
// Visuel — label plat style Google Maps
// ============================================================================

const RouteLabelView = React.forwardRef<View, { name: string; roadType?: string }>(
    function RouteLabelView({ name, roadType }, ref) {
        const isPrimary = roadType === 'primary' || roadType === 'main';
        return (
            <View
                ref={ref}
                collapsable={false}
                style={[styles.label, isPrimary && styles.labelPrimary]}
            >
                <Text
                    style={[styles.text, isPrimary && styles.textPrimary]}
                    allowFontScaling={false}
                    numberOfLines={1}
                >
                    {name}
                </Text>
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
    label: {
        alignSelf: 'flex-start',
        backgroundColor: '#3a3a3a',
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    text: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.15,
    },
    labelPrimary: {
        backgroundColor: '#2c2c2c',
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    textPrimary: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
});
