const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add platform-specific resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Create platform-specific alias for react-native-maps
config.resolver.alias = {
  ...(config.resolver.alias || {}),
};

// Override the resolveRequest to handle react-native-maps on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-maps to web stub on web platform
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      type: 'sourceFile',
      filePath: require.resolve('./web-maps-stub.js'),
    };
  }
  
  // Use original resolver for all other cases
  return originalResolveRequest 
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
