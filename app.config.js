const { expo: baseConfig } = require("./app.json");

const googleMapsApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  baseConfig.ios?.config?.googleMapsApiKey ||
  baseConfig.android?.config?.googleMaps?.apiKey ||
  "";

module.exports = {
  expo: {
    ...baseConfig,
    ios: {
      ...baseConfig.ios,
      infoPlist: {
        ...(baseConfig.ios?.infoPlist ?? {}),
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        ...baseConfig.ios?.config,
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    android: {
      ...baseConfig.android,
      config: {
        ...(baseConfig.android?.config ?? {}),
        googleMaps: {
          ...(baseConfig.android?.config?.googleMaps ?? {}),
          ...(googleMapsApiKey ? { apiKey: googleMapsApiKey } : {}),
        },
      },
    },
    extra: {
      ...(baseConfig.extra ?? {}),
      eas: {
        projectId: baseConfig.extra?.eas?.projectId || "cb23acec-f2a0-4d92-a27b-0c56975749f6",
      },
    },
  },
};
