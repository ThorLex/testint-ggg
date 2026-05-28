const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude test files from bundle
config.resolver.blockList = [
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.property\.test\.(js|jsx|ts|tsx)$/,
  /.*\.performance\.test\.(js|jsx|ts|tsx)$/,
  /.*\.integration\.test\.(js|jsx|ts|tsx)$/,
];

module.exports = withNativeWind(config, { 
  input: "./global.css",
  inlineRem: false,
});
