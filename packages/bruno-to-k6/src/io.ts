import fs from "node:fs/promises"
import path from "node:path"

/** Read a UTF-8 text file. */
export async function readText(file: string): Promise<string> {
  return fs.readFile(file, "utf8")
}

/** Ensure a directory exists (create recursively if missing). */
export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true })
}

/** Write a UTF-8 text file, creating parent directories if necessary. */
export async function writeText(file: string, data: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, data, "utf8")
}