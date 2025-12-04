import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { stderr, stdout } from 'node:process'
import { run } from '@sebspark/cli-tester'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createDatabase,
  createInstance,
  parseStatus,
  startSpanner,
} from './e2e/helpers'

const cwd = resolve(__dirname, 'cli')
const cliPath = resolve(__dirname, '../../dist/cli.js')

const instance = 'test-instance'
const database1 = 'database-1'
const database2 = 'database-2'
const projectId = 'test-project'

// const print = (txt: string) => stdout.write(`${txt}\n`)

const setup = async () => {
  await mkdir(cwd, { recursive: true })

  await startSpanner(projectId)
  await createInstance(instance)
  await createDatabase(instance, database1)
  await createDatabase(instance, database2)
}
const teardown = async () => {
  await rm(cwd, { recursive: true })
}

const injectSql = async (createResult: string, up: string, down: string) => {
  const [, path] = createResult.split(': ')

  let sql = await readFile(resolve(cwd, path), 'utf-8')

  sql = sql.replace('---- UP ----', `---- UP ----\n\n${up}`)
  sql = sql.replace('---- DOWN ----', `---- DOWN ----\n\n${down}`)

  await writeFile(resolve(cwd, path), sql)
}

describe('Spanner Migrate CLI - entire flow', () => {
  beforeAll(() => setup(), 120_000)
  afterAll(() => teardown())

  it('creates a config', async () => {
    const cli = run(cliPath, ['init'], { cwd })

    // Instance
    const instancePrompt = await cli.prompt('input')
    expect(instancePrompt.message).toMatch(/instance/)
    await cli.input(instance)

    // Database 1
    const dbPrompt1_1 = await cli.prompt('input')
    expect(dbPrompt1_1.message).toMatch(/database/)
    await cli.input(database1)
    const dbPrompt1_2 = await cli.prompt('input')
    expect(dbPrompt1_2.message).toMatch(/migrations/)
    await cli.input()

    // Database 2
    const dbPrompt2_1 = await cli.prompt('input')
    expect(dbPrompt2_1.message).toMatch(/database/)
    await cli.input(database2)
    const dbPrompt2_2 = await cli.prompt('input')
    expect(dbPrompt2_2.message).toMatch(/migrations/)
    await cli.input()

    // No additional databases
    const dbPrompt3 = await cli.prompt('input')
    expect(dbPrompt3.message).toMatch(/database/)
    await cli.input()

    // Project id
    const projectPrompt = await cli.prompt('input')
    expect(projectPrompt.message).toMatch(/project/)
    await cli.input(projectId)

    // Result
    const result = await cli.output()
    expect(result).toEqual(
      'Configuration written to ./.spanner-migrate.config.json'
    )
  })
  it('creates a migration with --database', async () => {
    const cli = run(
      cliPath,
      ['create', `--database=${database1}`, 'create users table'],
      { cwd }
    )

    const result = await cli.output()
    expect(result).toMatch(
      /Migration created: migrations\/database-1\/\d*_create_users_table.sql/
    )

    await injectSql(
      result,
      'CREATE TABLE users(id INT64 NOT NULL, username STRING(50) NOT NULL) PRIMARY KEY (id);',
      'DROP TABLE users;'
    )
  })
  it('creates a migration with --d', async () => {
    const cli = run(
      cliPath,
      ['create', `-d=${database1}`, 'create users index'],
      { cwd }
    )

    const result = await cli.output()
    expect(result).toMatch(
      /Migration created: migrations\/database-1\/\d*_create_users_index.sql/
    )

    await injectSql(
      result,
      'CREATE INDEX ix_users ON users (username);',
      'DROP INDEX ix_users;'
    )
  })
  it('creates a migration with select', async () => {
    const cli = run(cliPath, ['create', 'create addresses table'], { cwd })

    // Select database
    const databaseSelect = await cli.prompt('select')
    expect(databaseSelect.message).toMatch(/database/)
    await cli.select(1)

    const result = await cli.output()
    expect(result).toMatch(
      /Migration created: migrations\/database-2\/\d*_create_addresses_table.sql/
    )

    await injectSql(
      result,
      'CREATE TABLE addresses(id INT64 NOT NULL) PRIMARY KEY (id);',
      'DROP TABLE addresses'
    )
  })
  it('runs all migrations up', async () => {
    const cli = run(cliPath, ['up'], { cwd, env: process.env })

    const logs: string[] = []
    cli.process.stdout?.on('data', (chunk) => logs.push(chunk.toString()))
    // cli.process.stderr?.on('data', (chunk) => console.error(chunk.toString()))

    const code = await cli.exit()
    expect(code).toEqual(0)

    // console.log(logs.join('\n'))
  })
  it('gets correct status', async () => {
    const cli = run(cliPath, ['status'], { cwd, env: process.env })

    let status = ''
    cli.process.stdout?.on('data', (chunk) => {
      status += chunk.toString()
    })

    const code = await cli.exit()
    expect(code).toEqual(0)

    const migrationStatus = parseStatus(status)

    expect(migrationStatus).toHaveLength(2)

    expect(migrationStatus[0].database).toEqual(database1)
    expect(migrationStatus[0].applied).toHaveLength(2)
    expect(migrationStatus[0].applied[0]).toMatch(/create_users_table/)
    expect(migrationStatus[0].applied[1]).toMatch(/create_users_index/)
    expect(migrationStatus[0].new).toHaveLength(0)

    expect(migrationStatus[1].database).toEqual(database2)
    expect(migrationStatus[1].applied).toHaveLength(1)
    expect(migrationStatus[1].applied[0]).toMatch(/create_addresses_table/)
    expect(migrationStatus[1].new).toHaveLength(0)
  })
  it('runs migrate down', async () => {
    // Down in db1
    // stdout.write('Starting down 1\n')
    const down1 = run(cliPath, ['down', `-d=${database1}`], {
      cwd,
      env: process.env,
    })
    // down1.process.stdout?.on('data', (chunk) => stdout.write(chunk))
    // down1.process.stderr?.on('data', (chunk) => stderr.write(chunk))
    await down1.exit()

    // Down in db2
    // stdout.write('Starting down 2\n')
    const down2 = run(cliPath, ['down', `-d=${database2}`], {
      cwd,
      env: process.env,
    })
    // down2.process.stdout?.on('data', (chunk) => stdout.write(chunk))
    // down2.process.stderr?.on('data', (chunk) => stderr.write(chunk))
    await down2.exit()

    // stdout.write('Running status\n')
    const cli = run(cliPath, ['status'], { cwd, env: process.env })

    let status = ''
    cli.process.stdout?.on('data', (chunk) => {
      status += chunk.toString()
    })

    const code = await cli.exit()
    expect(code).toEqual(0)

    const migrationStatus = parseStatus(status)

    expect(migrationStatus).toHaveLength(2)

    expect(migrationStatus[0].database).toEqual(database1)
    expect(migrationStatus[0].applied).toHaveLength(1)
    expect(migrationStatus[0].applied[0]).toMatch(/create_users_table/)
    expect(migrationStatus[0].new).toHaveLength(1)
    expect(migrationStatus[0].new[0]).toMatch(/create_users_index/)

    expect(migrationStatus[1].database).toEqual(database2)
    expect(migrationStatus[1].applied).toHaveLength(0)
    expect(migrationStatus[1].new).toHaveLength(1)
    expect(migrationStatus[1].new[0]).toMatch(/create_addresses_table/)
  }, 20_000)
  it('runs migrate up on a single database', async () => {
    // Up in db2
    await run(cliPath, ['up', `-d=${database2}`], {
      cwd,
      env: process.env,
    }).exit()

    const cli = run(cliPath, ['status'], { cwd, env: process.env })

    let status = ''
    cli.process.stdout?.on('data', (chunk) => {
      status += chunk.toString()
    })

    const code = await cli.exit()
    expect(code).toEqual(0)

    const migrationStatus = parseStatus(status)

    expect(migrationStatus).toHaveLength(2)

    expect(migrationStatus[0].database).toEqual(database1)
    expect(migrationStatus[0].applied).toHaveLength(1)
    expect(migrationStatus[0].applied[0]).toMatch(/create_users_table/)
    expect(migrationStatus[0].new).toHaveLength(1)
    expect(migrationStatus[0].new[0]).toMatch(/create_users_index/)

    expect(migrationStatus[1].database).toEqual(database2)
    expect(migrationStatus[1].applied).toHaveLength(1)
    expect(migrationStatus[1].applied[0]).toMatch(/create_addresses_table/)
    expect(migrationStatus[1].new).toHaveLength(0)
  }, 20_000)
  it('runs numbered migrate up on a single database', async () => {
    // Down in db1
    await run(cliPath, ['down', `-d=${database1}`], {
      cwd,
      env: process.env,
    }).exit()
    // Up in db1 --max=1
    await run(cliPath, ['up', `-d=${database1}`, '--max=1'], {
      cwd,
      env: process.env,
    }).exit()

    const cli = run(cliPath, ['status'], { cwd, env: process.env })

    let status = ''
    cli.process.stdout?.on('data', (chunk) => {
      status += chunk.toString()
    })

    const code = await cli.exit()
    expect(code).toEqual(0)

    const migrationStatus = parseStatus(status)

    expect(migrationStatus).toHaveLength(2)

    expect(migrationStatus[0].database).toEqual(database1)
    expect(migrationStatus[0].applied).toHaveLength(1)
    expect(migrationStatus[0].applied[0]).toMatch(/create_users_table/)
    expect(migrationStatus[0].new).toHaveLength(1)
    expect(migrationStatus[0].new[0]).toMatch(/create_users_index/)

    expect(migrationStatus[1].database).toEqual(database2)
    expect(migrationStatus[1].applied).toHaveLength(1)
    expect(migrationStatus[1].applied[0]).toMatch(/create_addresses_table/)
    expect(migrationStatus[1].new).toHaveLength(0)
  }, 20_000)
})
