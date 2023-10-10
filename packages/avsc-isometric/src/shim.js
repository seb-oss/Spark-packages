/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
if (typeof __dirname === 'undefined') global.__dirname = '/'
if (typeof __filename === 'undefined') global.__filename = ''
const bProcess = require('process')
if (typeof process === 'undefined') {
  global.process = bProcess
} else {
  for (const p in bProcess) {
    if (!(p in process)) {
      (process as any)[p] = bProcess[p]
    }
  }
}

(process as any).browser = false
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer
