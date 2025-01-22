import * as apply from '../apply'
import * as db from '../db'
import * as files from '../files'
import { create, down, init, status, up } from '../index'
import type { Config } from '../types'

jest.mock('../db')
jest.mock('../files')
jest.mock('../apply')

const mockDb = db as jest.Mocked<typeof db>
const mockFiles = files as jest.Mocked<typeof files>
const mockApply = apply as jest.Mocked<typeof apply>

describe('index', () => {
  const mockConfig: Config = {
    migrationsPath: '/mock/migrations',
    instanceName: 'mock-instance',
    databaseName: 'mock-database',
    projectId: 'mock-project',
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('init', () => {
    it('writes the configuration to the specified path', async () => {
      const mockPath = '/mock/config.json'

      await init(mockConfig, mockPath)

      expect(mockFiles.writeConfig).toHaveBeenCalledWith(mockPath, mockConfig)
    })
  })

  describe('create', () => {
    it('creates a new migration file', async () => {
      const description = 'Add Users Table'

      await create(mockConfig, description)

      expect(mockFiles.createMigration).toHaveBeenCalledWith(
        mockConfig.migrationsPath,
        description
      )
    })
  })

  describe('up', () => {
    it('applies new migrations up to the maximum specified', async () => {
      const newMigrations = ['20250102T123456_add_roles']
      const migrationFiles = [
        '20250101T123456_add_users',
        '20250102T123456_add_roles',
      ]
      const appliedMigrations = [
        { id: '20250101T123456_add_users', description: '', up: '', down: '' },
      ]

      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockDb.getAppliedMigrations.mockResolvedValue(appliedMigrations)
      mockFiles.getMigrationFiles.mockResolvedValue(migrationFiles)
      mockFiles.getNewMigrations.mockReturnValue(newMigrations)
      mockFiles.getMigration.mockResolvedValue({
        id: '20250102T123456_add_roles',
        description: 'Add Roles',
        up: 'CREATE TABLE roles',
        down: 'DROP TABLE roles',
      })
      mockApply.applyUp.mockResolvedValue(undefined)

      await up(mockConfig, 1)

      expect(mockDb.ensureMigrationTable).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockDb.getAppliedMigrations).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockFiles.getMigrationFiles).toHaveBeenCalledWith(
        mockConfig.migrationsPath
      )
      expect(mockFiles.getNewMigrations).toHaveBeenCalledWith(
        appliedMigrations,
        migrationFiles
      )
      expect(mockFiles.getMigration).toHaveBeenCalledWith(
        mockConfig.migrationsPath,
        '20250102T123456_add_roles'
      )
      expect(mockApply.applyUp).toHaveBeenCalledWith(expect.anything(), {
        id: '20250102T123456_add_roles',
        description: 'Add Roles',
        up: 'CREATE TABLE roles',
        down: 'DROP TABLE roles',
      })
    })
  })

  describe('down', () => {
    it('rolls back the last applied migration', async () => {
      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockApply.applyDown.mockResolvedValue(undefined)

      await down(mockConfig)

      expect(mockDb.ensureMigrationTable).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockApply.applyDown).toHaveBeenCalledWith(expect.anything())
    })
  })

  describe('status', () => {
    it('returns a summary of applied and new migrations', async () => {
      const appliedMigrations = [
        { id: '20250101T123456_add_users', description: '', up: '', down: '' },
      ]
      const migrationFiles = [
        '20250101T123456_add_users',
        '20250102T123456_add_roles',
      ]
      const newMigrations = ['20250102T123456_add_roles']

      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockDb.getAppliedMigrations.mockResolvedValue(appliedMigrations)
      mockFiles.getMigrationFiles.mockResolvedValue(migrationFiles)
      mockFiles.getNewMigrations.mockReturnValue(newMigrations)

      const result = await status(mockConfig)

      expect(mockDb.ensureMigrationTable).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockDb.getAppliedMigrations).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockFiles.getMigrationFiles).toHaveBeenCalledWith(
        mockConfig.migrationsPath
      )
      expect(mockFiles.getNewMigrations).toHaveBeenCalledWith(
        appliedMigrations,
        migrationFiles
      )
      expect(result).toContain('Applied')
      expect(result).toContain('20250101T123456_add_users')
      expect(result).toContain('New')
      expect(result).toContain('20250102T123456_add_roles')
    })
  })
})
