/**
 * BuildingCustomLabel
 *
 * Label de bâtiment attaché directement au <Marker> react-native-maps.
 * Suit le mouvement de la carte en temps réel (natif).
 *
 * - tracksViewChanges={true} permanent → bitmap recréé à chaque frame
 *   via ViewChangesTracker → le texte est toujours à jour
 * - createDrawable() dans MapMarker.java mesure en UNSPECIFIED →
 *   les enfants déclarent leur taille réelle → zéro troncature
 * - Pas de numberOfLines, pas de width fixe → texte complet garanti
 *
 * Utilisé sur iOS et Android.
 *
 * @module components/molecules/BuildingCustomLabel
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Marker } from 'react-native-maps';

// ============================================================================
// Types
// ============================================================================

export type BuildingLabelData = {
    id: string;
    amodiatairId: string;
    nom: string;
    amodiataireName: string;
    center: { latitude: number; longitude: number };
    visible: boolean;
};

type Props = {
    building: BuildingLabelData;
    onPress: (amodiatairId: string) => void;
};

// ============================================================================
// Composant
// ============================================================================

export function BuildingCustomLabel({ building, onPress }: Props) {
    // Commence à true pour que le premier bitmap soit créé avec les bonnes dimensions.
    // Passe à false après 800ms — le label est stable, on arrête de recréer le bitmap
    // à chaque frame pour préserver les performances.
    const [tracksViewChanges, setTracksViewChanges] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setTracksViewChanges(false), 800);
        return () => clearTimeout(timer);
    }, [building.nom, building.amodiataireName]); // reset si le nom change
    const displayName = building.nom;
    const subName =
        building.amodiataireName && building.amodiataireName !== building.nom
            ? building.amodiataireName
            : null;

    if (!building.visible) return null;

    return (
        <Marker
            coordinate={building.center}
            tracksViewChanges={tracksViewChanges}
            anchor={{ x: 0.5, y: 1 }}
            onPress={() => onPress(building.amodiatairId)}
        >
            {/*
             * Pas de width/height fixe sur le conteneur.
             * createDrawable() dans MapMarker.java mesure chaque enfant
             * en UNSPECIFIED → taille réelle → bitmap exact → zéro troncature.
             */}
            <View style={styles.container} pointerEvents="none">

                {/* ── Label blanc ── */}
                <View style={styles.label}>
                    {/* Pas de numberOfLines — texte complet */}
                    <Text style={styles.name}>{displayName}</Text>
                    {subName ? (
                        <Text style={styles.subName}>{subName}</Text>
                    ) : null}
                </View>

                {/* ── Petite flèche vers le pin ── */}
                <View style={styles.arrow} />

            </View>
        </Marker>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        // Pas de width/height fixe — mesure libre par createDrawable()
    },
    label: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: moderateScale(6),
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
        alignItems: 'center',
        // Ombre pour lisibilité sur fond de carte
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: moderateScale(1) },
        shadowOpacity: 0.25,
        shadowRadius: moderateScale(3),
        elevation: 4,
        // minWidth pour les noms très courts
        minWidth: moderateScale(50),
        // Pas de maxWidth — la bulle s'adapte au texte
    },
    name: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        // Pas de numberOfLines — texte complet garanti
    },
    subName: {
        fontSize: moderateScale(9),
        color: '#444444',
        textAlign: 'center',
        marginTop: moderateScale(1),
    },
    arrow: {
        width: 0,
        height: 0,
        borderLeftWidth: moderateScale(5),
        borderRightWidth: moderateScale(5),
        borderTopWidth: moderateScale(6),
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'rgba(255, 255, 255, 0.95)',
    },
});
