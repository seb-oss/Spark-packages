// Get original avsc
var avscWrapper = require('avsc')

// Delete decodeFile because we don't want to read files in browser
delete avscWrapper.decodeFile

// Delete getFileHeader because we don't want to read files in browser
delete avscWrapper.getFileHeader

// Export
module.exports = avscWrapper
