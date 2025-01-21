import type { Dirent } from 'node:fs'
import { access, mkdir, readdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  createMigration,
  getMigration,
  getMigrationFiles,
  getNewMigrations,
  writeConfig,
} from '../files'
import type { Migration } from '../types'

// Mock node:fs/promises methods
jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  readdir: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}))

// Declare mocks
const accessMock = access as jest.MockedFunction<typeof access>
const mkdirMock = mkdir as jest.MockedFunction<typeof mkdir>
const readdirMock = readdir as jest.MockedFunction<typeof readdir>
const writeFileMock = writeFile as jest.MockedFunction<typeof writeFile>

describe('files.ts', () => {
  const mockPath = './mock/migrations'
  const mockConfigPath = './mock/spanner-migrate.config.json'

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getMigrationFiles', () => {
    it('returns migration file IDs', async () => {
      const mockFiles = [
        '20250101T123456_add_users.ts',
        '20250102T123456_add_roles.ts',
      ]
      readdirMock.mockResolvedValue(mockFiles as unknown as Dirent[])

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
    const mockMigrationPath = resolve(mockPath, `${mockMigrationId}.ts`)

    beforeEach(() => {
      jest.resetModules()
    })

    it('returns the migration object if valid', async () => {
      const mockModule = {
        up: 'CREATE TABLE users (id STRING(36))',
        down: 'DROP TABLE users',
      }
      jest.mock(mockMigrationPath, () => mockModule, { virtual: true })
      accessMock.mockResolvedValue(undefined)

      const result = await getMigration(mockPath, mockMigrationId)

      expect(accessMock).toHaveBeenCalledWith(mockMigrationPath)
      expect(result).toEqual({
        id: mockMigrationId,
        description: 'Add Users',
        up: mockModule.up,
        down: mockModule.down,
      })
    })

    it('throws an error if migration file does not exist', async () => {
      accessMock.mockImplementation(async () => {
        throw new Error('File not found')
      })

      await expect(getMigration(mockPath, mockMigrationId)).rejects.toThrow(
        `Migration file not found: ${mockMigrationPath}`
      )
    })

    it('throws an error if migration file is invalid', async () => {
      const invalidModule = { up: 'CREATE TABLE users (id STRING(36))' } // Missing down
      jest.mock(mockMigrationPath, () => invalidModule, { virtual: true })
      accessMock.mockImplementation(async () => undefined)

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
        expect.stringMatching(/^mock\/migrations\/\d+_add_users_table\.ts$/),
        expect.stringMatching(/-- SQL for migrate up/),
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

      const config = {
        migrationsPath: './migrations',
        instanceName: 'spanner-instance',
        databaseName: 'spanner-db',
        projectName: 'project-id',
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
          migrationsPath: './migrations',
          instanceName: 'spanner-instance',
          databaseName: 'spanner-db',
        })
      ).rejects.toThrow(
        'Error writing configuration to ./mock/spanner-migrate.config.json: Cannot write file'
      )
    })
  })
})
