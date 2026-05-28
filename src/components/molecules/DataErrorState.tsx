import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, ExclamationTriangleIcon } from 'react-native-heroicons/outline';

interface DataErrorStateProps {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is pressed */
  onRetry: () => void;
  /** Optional title for the error state */
  title?: string;
  /** Optional secondary message/description */
  description?: string;
}

/**
 * Reusable component to handle data fetching error states with a retry button.
 */
export const DataErrorState: React.FC<DataErrorStateProps> = ({
  message,
  onRetry,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const spinValue = new Animated.Value(0);

  // Animation for the refresh icon (subtle rotation when appearing or on hover/tap)
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleRetry = () => {
    // Start spin animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
    
    // Call the retry callback
    onRetry();
  };

  return (
    <View className="flex-1 items-center justify-center py-10 px-6">
      {/* Icon Container */}
      <View className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full items-center justify-center mb-6">
        <ExclamationTriangleIcon size={40} color="#EF4444" />
      </View>

      {/* Text Content */}
      <Text className="text-gray-900 dark:text-white text-xl font-bold text-center mb-2">
        {title || t('common.errorTitle', 'Oups !')}
      </Text>
      
      <Text className="text-red-500 dark:text-red-400 text-center font-medium mb-3">
        {message || t('common.errorLoading', 'Erreur lors du chargement des données')}
      </Text>

      {description && (
        <Text className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 px-4 leading-5">
          {description}
        </Text>
      )}

      {!description && (
        <Text className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 px-4 leading-5">
          {t('common.errorRetryDescription', 'Veuillez vérifier votre connexion internet ou réessayer ultérieurement.')}
        </Text>
      )}

      {/* Retry Button */}
      <TouchableOpacity
        onPress={handleRetry}
        activeOpacity={0.8}
        className="flex-row items-center bg-emerald-500 dark:bg-emerald-600 px-8 py-4 rounded-2xl shadow-md active:bg-emerald-600"
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <ArrowPathIcon size={20} color="white" />
        </Animated.View>
        <Text className="text-white font-bold text-lg ml-3">
          {t('common.retry', 'Réessayer')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
