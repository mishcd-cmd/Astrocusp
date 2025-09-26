const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper web configuration
//config.resolver.platforms = ['web', 'native'];

// Add proper web configuration
//config.web = {
 // ...config.web,
 // bundler: 'metro'
//};

module.exports = config;