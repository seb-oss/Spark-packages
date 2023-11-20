// Get original avsc
const avscWrapper = require('avsc')

// Delete decodeFile because we don't want to read files in browser
// biome-ignore lint: Special handling for React Native
delete avscWrapper.decodeFile

// Delete getFileHeader because we don't want to read files in browser
// biome-ignore lint: Special handling for React Native
delete avscWrapper.getFileHeader

// Export
module.exports = avscWrapper
