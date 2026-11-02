import { isRecord } from './isRecord'
import type { Migration } from './types'

/** Validates a `migrations` table row read with `json: true`. */
export const toMigration = (row: unknown): Migration => {
  if (
    !isRecord(row) ||
    typeof row.id !== 'string' ||
    typeof row.description !== 'string' ||
    typeof row.up !== 'string' ||
    typeof row.down !== 'string' ||
    (row.appliedAt !== undefined && !(row.appliedAt instanceof Date))
  ) {
    throw new Error(`Invalid migration row: ${JSON.stringify(row)}`)
  }
  const { id, description, up, down, appliedAt } = row
  return { id, description, up, down, appliedAt }
}
