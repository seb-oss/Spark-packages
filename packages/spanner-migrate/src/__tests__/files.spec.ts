import type { Dirent } from 'node:fs'
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createMigration,
  getMigration,
  getMigrationFiles,
  getNewMigrations,
  writeConfig,
} from '../files'
import type { Config, Migration } from '../types'

// Mock node:fs/promises methods
jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  readdir: jest.fn(),
  mkdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}))

// Declare mocks
const accessMock = access as jest.MockedFunction<typeof access>
const mkdirMock = mkdir as jest.MockedFunction<typeof mkdir>
const readdirMock = readdir as jest.MockedFunction<typeof readdir>
const readFileMock = readFile as jest.MockedFunction<typeof readFile>
const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>

describe('files', () => {
  const mockPath = './mock/migrations'
  const mockConfigPath = './mock/spanner-migrate.config.json'

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getMigrationFiles', () => {
    it('returns migration file IDs', async () => {
      const mockFiles = [
        '20250101T123456_add_users.sql',
        '20250102T123456_add_roles.sql',
      ]
      readdirMock.mockResolvedValue(
        mockFiles as unknown as Dirent<Buffer<ArrayBufferLike>>[]
      )

      const result = await getMigrationFiles(mockPath)

      expect(readdirMock).toHaveBeenCalledWith(mockPath)
      expect(result).toEqual([
        '20250101T123456_add_users',
        '20250102T123456_add_roles',
      ])
    })

    it('throws an error if readdir fails', async () => {
      readdirMock.mockRejectedValue(new Error('Directory not found'))

      await expect(getMigrationFiles(mockPath)).rejects.toThrow(
        'Failed to get migration files: Directory not found'
      )
    })
  })

  describe('getMigration', () => {
    const mockMigrationId = '20250101T123456_add_users'
    const mockMigrationPath = resolve(mockPath, `${mockMigrationId}.sql`)

    it('returns the migration object if valid', async () => {
      const migrationFile = `-- Created: 2025-01-20T14:56:38.000Z
-- Description: Create table users

---- UP ----

CREATE TABLE users (id STRING(36))

---- DOWN ----

DROP TABLE users
`
      accessMock.mockResolvedValue(undefined)
      readFileMock.mockResolvedValue(migrationFile)

      const result = await getMigration(mockPath, mockMigrationId)

      expect(accessMock).toHaveBeenCalledWith(mockMigrationPath)
      expect(result).toEqual({
        id: mockMigrationId,
        description: 'Create table users',
        up: 'CREATE TABLE users (id STRING(36))',
        down: 'DROP TABLE users',
      })
    })

    it('throws an error if migration file does not exist', async () => {
      readFileMock.mockRejectedValue(new Error('File not found'))

      await expect(getMigration(mockPath, mockMigrationId)).rejects.toThrow(
        'Failed to get migration 20250101T123456_add_users: File not found'
      )
    })

    it('throws an error if migration file is invalid', async () => {
      accessMock.mockImplementation(async () => undefined)
      readFileMock.mockResolvedValue('Herp derp')

      await expect(getMigration(mockPath, mockMigrationId)).rejects.toThrow(
        `Migration file ${mockMigrationPath} does not export required scripts (up, down).`
      )
    })
  })

  describe('getNewMigrations', () => {
    it('returns new migration IDs', () => {
      const applied: Migration[] = [
        {
          id: '20250101T123456_add_users',
          description: '',
          up: '',
          down: '',
          appliedAt: undefined,
        },
      ]
      const files = [
        '20250101T123456_add_users',
        '20250102T123456_add_roles',
        '20250103T123456_add_permissions',
      ]

      const result = getNewMigrations(applied, files)

      expect(result).toEqual([
        '20250102T123456_add_roles',
        '20250103T123456_add_permissions',
      ])
    })

    it('throws an error for interlaced or missing migrations', () => {
      const applied: Migration[] = [
        {
          id: '20250103T123456_add_users',
          description: '',
          up: '',
          down: '',
          appliedAt: undefined,
        },
      ]
      const files = [
        '20250103T123456_add_permissions',
        '20250103T123456_add_users',
      ]

      expect(() => getNewMigrations(applied, files)).toThrow(
        `Mismatch between applied migrations and files. Found '20250103T123456_add_permissions' but expected '20250103T123456_add_users' at position 0.`
      )
    })
  })

  describe('createMigration', () => {
    it('creates a new migration file', async () => {
      mkdirMock.mockResolvedValue(undefined)
      writeFileMock.mockResolvedValue(undefined)

      const description = 'Add Users Table'

      await createMigration(mockPath, description)

      expect(mkdirMock).toHaveBeenCalledWith(mockPath, { recursive: true })
      expect(writeFileMock).toHaveBeenCalledWith(
        expect.stringMatching(/^mock\/migrations\/\d+_add_users_table\.sql$/),
        expect.stringMatching(/^-- Created: /),
        'utf8'
      )
    })

    it('throws an error if migration creation fails', async () => {
      mkdirMock.mockRejectedValue(new Error('Cannot create directory'))

      await expect(
        createMigration(mockPath, 'Add Users Table')
      ).rejects.toThrow('Error creating migration: Cannot create directory')
    })
  })

  describe('writeConfig', () => {
    it('writes configuration to the specified file', async () => {
      writeFileMock.mockResolvedValue(undefined)

      const config: Config = {
        instance: {
          name: 'spanner-instance',
          databases: [
            {
              name: 'test-instance',
              migrationsPath: './migrations/test-instance',
            },
          ],
        },
        projectId: 'project-id',
      }

      await writeConfig(mockConfigPath, config)

      expect(writeFileMock).toHaveBeenCalledWith(
        mockConfigPath,
        JSON.stringify(config, null, 2),
        'utf8'
      )
    })

    it('throws an error if writing configuration fails', async () => {
      writeFileMock.mockRejectedValue(new Error('Cannot write file'))

      await expect(
        writeConfig(mockConfigPath, {
          instance: {
            name: 'spanner-instance',
            databases: [
              {
                name: 'test-instance',
                migrationsPath: './migrations/test-instance',
              },
            ],
          },
          projectId: 'project-id',
        })
      ).rejects.toThrow(
        'Error writing configuration to ./mock/spanner-migrate.config.json: Cannot write file'
      )
    })
  })
})
