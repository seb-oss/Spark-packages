import type { SetOptions } from 'redis'
import type { Expiry } from './types'

/**
 * Converts an Expiry value into Redis SetOptions.
 * @param {Expiry | undefined} expiry - The expiration time, either as a TTL in milliseconds or an exact Date.
 * @returns {SetOptions | undefined} Redis-compatible options, or undefined if no expiry.
 */
export const toSetOptions = (
  expiry: Expiry | undefined
): SetOptions | undefined => {
  const options: SetOptions = {}

  // Expiry has a value
  if (expiry !== undefined) {
    if (typeof expiry === 'number') {
      options.PX = expiry // Store TTL in milliseconds
    } else if (expiry instanceof Date && !Number.isNaN(expiry.getTime())) {
      const timestamp = expiry.getTime()
      if (timestamp > Date.now()) {
        options.PXAT = timestamp // Use exact expiration time in milliseconds
      } else {
        options.PX = 1 // Past timestamps are invalid - expire immediately
      }
    }
  }

  // If expiry does not have a value, fall back to 1 sec
  if (!options.PX && !options.PXAT) {
    options.EX = 1
  }

  return options
}
