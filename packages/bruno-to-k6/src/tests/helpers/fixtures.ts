import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { expect } from 'vitest'

export const norm = (s: string) => s.replace(/\r\n/g, '\n').trim()

export const fixturePaths = (testDir: string, collectionName: string) => {
  const root = path.join(testDir, 'fixtures', collectionName)
  return {
    FIX: root,
    EXP: path.join(root, 'expected'),
    EXP_PR: path.join(root, 'expected', 'per-request'),
  }
}

export const matchOrCreate = async (filePath: string, result: string) => {
  const snapshot = await readFile(filePath, 'utf8').catch(() => undefined)

  if (snapshot) {
    expect(norm(result), filePath).toEqual(norm(snapshot))
  } else {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, result)
    process.stdout.write(
      `[created] ${path.relative(process.cwd(), filePath)}\n`
    )
  }
}
