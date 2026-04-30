import { afterEach, describe, expect, it, type Mocked, vi } from 'vitest'
import * as apply from '../apply'
import * as db from '../db'
import * as files from '../files'
import { create, down, init, status, up } from '../index'
import type { Config } from '../types'

vi.mock('../db')
vi.mock('../files')
vi.mock('../apply')

vi.mock('@google-cloud/spanner', () => {
  const db = {}
  const database = vi.fn().mockReturnValue(db)
  const instance = vi.fn().mockReturnValue({ database })
  class Spanner {
    instance = instance
  }
  return { Spanner }
})

const mockDb = db as Mocked<typeof db>
const mockFiles = files as Mocked<typeof files>
const mockApply = apply as Mocked<typeof apply>

describe('index', () => {
  const mockConfig: Config = {
    instance: {
      name: 'mock-instance',
      databases: [
        {
          name: 'mock-database',
          migrationsPath: '/mock/migrations',
        },
      ],
    },
    projectId: 'mock-project',
  }

  afterEach(() => {
    vi.clearAllMocks()
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

      await create(mockConfig.instance.databases[0], description)

      expect(mockFiles.createMigration).toHaveBeenCalledWith(
        mockConfig.instance.databases[0].migrationsPath,
        description
      )
    })
  })

  describe('up', () => {
    it('throws when max is specified without a database', async () => {
      await expect(up(mockConfig, undefined, 1)).rejects.toThrow(
        'Max number of migrations requires specifying a database'
      )
    })

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

      await up(mockConfig, mockConfig.instance.databases[0], 1)

      expect(mockDb.ensureMigrationTable).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockDb.getAppliedMigrations).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockFiles.getMigrationFiles).toHaveBeenCalledWith(
        mockConfig.instance.databases[0].migrationsPath
      )
      expect(mockFiles.getNewMigrations).toHaveBeenCalledWith(
        appliedMigrations,
        migrationFiles
      )
      expect(mockFiles.getMigration).toHaveBeenCalledWith(
        mockConfig.instance.databases[0].migrationsPath,
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

      await down(mockConfig, mockConfig.instance.databases[0])

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

      const result = await status(mockConfig, mockConfig.instance.databases)

      expect(mockDb.ensureMigrationTable).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockDb.getAppliedMigrations).toHaveBeenCalledWith(
        expect.anything()
      )
      expect(mockFiles.getMigrationFiles).toHaveBeenCalledWith(
        mockConfig.instance.databases[0].migrationsPath
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

    it('uses config databases when none specified', async () => {
      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockDb.getAppliedMigrations.mockResolvedValue([])
      mockFiles.getMigrationFiles.mockResolvedValue([])
      mockFiles.getNewMigrations.mockReturnValue([])

      const result = await status(mockConfig)

      expect(result).toContain('Migrations [mock-database]')
    })
  })

  describe('up without max (all migrations)', () => {
    it('applies all new migrations when no max is specified', async () => {
      const newMigrations = ['20250102T123456_add_roles']

      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockDb.getAppliedMigrations.mockResolvedValue([])
      mockFiles.getMigrationFiles.mockResolvedValue(newMigrations)
      mockFiles.getNewMigrations.mockReturnValue(newMigrations)
      mockFiles.getMigration.mockResolvedValue({
        id: '20250102T123456_add_roles',
        description: 'Add Roles',
        up: 'CREATE TABLE roles',
        down: 'DROP TABLE roles',
      })
      mockApply.applyUp.mockResolvedValue(undefined)

      await up(mockConfig, mockConfig.instance.databases[0])

      expect(mockApply.applyUp).toHaveBeenCalledOnce()
    })

    it('uses config databases when no database is specified', async () => {
      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockDb.getAppliedMigrations.mockResolvedValue([])
      mockFiles.getMigrationFiles.mockResolvedValue([])
      mockFiles.getNewMigrations.mockReturnValue([])

      await up(mockConfig)

      expect(mockDb.ensureMigrationTable).toHaveBeenCalledOnce()
    })
  })

  describe('getDb without projectId', () => {
    it('creates Spanner without projectId when config has none', async () => {
      const configWithoutProject: Config = {
        instance: mockConfig.instance,
      }

      mockDb.ensureMigrationTable.mockResolvedValue(undefined)
      mockApply.applyDown.mockResolvedValue(undefined)

      await down(
        configWithoutProject,
        configWithoutProject.instance.databases[0]
      )

      expect(mockApply.applyDown).toHaveBeenCalledOnce()
    })
  })
})
