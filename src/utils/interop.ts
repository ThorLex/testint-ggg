/**
 * Configuration des interopérabilités pour NativeWind v4
 * 
 * Ce fichier permet de déclarer les composants tiers qui utilisent
 * des propriétés de style (comme className) pour éviter les avertissements
 * et les crashs de contexte de navigation.
 * 
 * @module utils/interop
 */

import { View, Text, TouchableOpacity, ScrollView, FlatList, TextInput } from 'react-native';
import { cssInterop } from 'react-native-css-interop';
import * as HeroiconsOutline from 'react-native-heroicons/outline';
import * as HeroiconsSolid from 'react-native-heroicons/solid';

/**
 * Enregistre les interops pour NativeWind
 */
export function registerInterops() {
    console.log('🔧 Enregistrement des interops NativeWind...');

    // Enregistrer les composants de base qui peuvent poser problème avec CSS Interop
    cssInterop(TouchableOpacity, {
        className: {
            target: 'style',
        },
    });

    cssInterop(ScrollView, {
        className: {
            target: 'style',
        },
    });

    cssInterop(FlatList, {
        className: {
            target: 'style',
        },
    });
    
    const iconsToInterop = [
        'XMarkIcon',
        'MapPinIcon',
        'BuildingOffice2Icon',
        'ArrowTopRightOnSquareIcon',
        'ChevronDownIcon',
        'ChevronUpIcon',
        'SunIcon',
        'MoonIcon',
        'ComputerDesktopIcon',
        'GlobeAltIcon',
        'InformationCircleIcon',
        'CheckIcon',
        'UserIcon',
        'PhoneIcon',
        'EnvelopeIcon',
        'MapIcon',
        'ClockIcon',
        'TruckIcon',
        'PlayIcon',
        'ArrowLeftIcon',
        'MagnifyingGlassIcon',
        'Cog6ToothIcon',
        'BellIcon'
    ];

    iconsToInterop.forEach(iconName => {
        const OutlineIcon = (HeroiconsOutline as any)[iconName];
        const SolidIcon = (HeroiconsSolid as any)[iconName];

        if (OutlineIcon) {
            cssInterop(OutlineIcon, {
                className: {
                    target: 'style',
                    nativeStyleToProp: {
                        color: true,
                        width: true,
                        height: true,
                    },
                },
            });
        }

        if (SolidIcon) {
            cssInterop(SolidIcon, {
                className: {
                    target: 'style',
                    nativeStyleToProp: {
                        color: true,
                        width: true,
                        height: true,
                    },
                },
            });
        }
    });

    console.log('✅ Interops configurés');
}
