/**
 * AndroidBuildingLabel
 *
 * Label overlay positionné via MapView.pointForCoordinate().
 * View React Native pure (zéro bitmap natif → zéro troncature).
 *
 * Améliorations :
 * - Encoche triangulaire vers le bas pour indiquer la position exacte
 * - Clamping sur les bords d'écran pour éviter que le label soit coupé
 *
 * @module components/molecules/AndroidBuildingLabel
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    LayoutChangeEvent,
    Dimensions,
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

// ============================================================================
// Types
// ============================================================================

export type AndroidLabelData = {
    id: string;
    amodiatairId: string;
    nom: string;
    amodiataireName: string;
    /** Position écran X (centre de l'ancre géographique) */
    screenX: number;
    /** Position écran Y (ancre géographique du bâtiment) */
    screenY: number;
};

type Props = {
    label: AndroidLabelData;
    onPress: (amodiatairId: string) => void;
};

// ============================================================================
// Constantes
// ============================================================================

/** Décalage vertical entre l'ancre géo et le bas du label (espace visuel) */
const ANCHOR_OFFSET  = moderateScale(12);

/** Hauteur de l'encoche triangulaire pointant vers le bas */
const ARROW_HEIGHT   = moderateScale(6);

/** Demi-largeur de la base de l'encoche */
const ARROW_HALF_W   = moderateScale(5);

/** Marge minimale par rapport aux bords de l'écran */
const SCREEN_MARGIN  = 8;

// ============================================================================
// Composant
// ============================================================================

export function AndroidBuildingLabel({ label, onPress }: Props) {
    const [labelW, setLabelW] = useState(0);
    const [labelH, setLabelH] = useState(0);

    const handleLayout = useCallback((e: LayoutChangeEvent) => {
        setLabelW(e.nativeEvent.layout.width);
        setLabelH(e.nativeEvent.layout.height);
    }, []);

    const displayName = label.nom;
    const subName =
        label.amodiataireName && label.amodiataireName !== label.nom
            ? label.amodiataireName
            : null;

    const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

    // Position brute : le bas du label est à ANCHOR_OFFSET au-dessus de l'ancre
    // (encoche comprise : ANCHOR_OFFSET = GAP + ARROW_HEIGHT)
    const rawLeft = label.screenX - labelW / 2;
    const rawTop  = label.screenY - ANCHOR_OFFSET - ARROW_HEIGHT - labelH;

    // Clamping : garantit que le label reste entièrement visible à l'écran
    const left = Math.max(
        SCREEN_MARGIN,
        Math.min(rawLeft, SCREEN_W - labelW - SCREEN_MARGIN)
    );
    const top = Math.max(
        SCREEN_MARGIN,
        Math.min(rawTop, SCREEN_H - labelH - ARROW_HEIGHT - SCREEN_MARGIN)
    );

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPress(label.amodiatairId)}
            style={[styles.wrapper, { left, top }]}
        >
            {/* Bulle blanche avec le nom du bâtiment */}
            <View style={styles.label} onLayout={handleLayout}>
                <Text style={styles.name}>{displayName}</Text>
                {subName ? (
                    <Text style={styles.subName}>{subName}</Text>
                ) : null}
            </View>

            {/* Encoche triangulaire pointant vers le bas → indique la position du bâtiment */}
            <View style={styles.arrow} />
        </TouchableOpacity>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        alignItems: 'center',
        zIndex: 999,
        elevation: 10,
    },
    label: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: moderateScale(6),
        paddingHorizontal: moderateScale(10),
        paddingVertical: moderateScale(5),
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: moderateScale(2) },
        shadowOpacity: 0.22,
        shadowRadius: moderateScale(3),
        elevation: 5,
        minWidth: moderateScale(50),
    },
    name: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    subName: {
        fontSize: moderateScale(9),
        color: '#555555',
        textAlign: 'center',
        marginTop: moderateScale(1),
    },
    // Triangle CSS — pointe vers le bas, couleur identique à la bulle
    arrow: {
        width: 0,
        height: 0,
        borderLeftWidth: ARROW_HALF_W,
        borderRightWidth: ARROW_HALF_W,
        borderTopWidth: ARROW_HEIGHT,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'rgba(255, 255, 255, 0.95)',
    },
});
