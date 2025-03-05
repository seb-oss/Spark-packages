# @sebspark/spanner-migrate

`spanner-migrate` is a CLI tool for managing schema migrations for Google Cloud Spanner. It simplifies schema evolution by allowing you to create, apply, rollback, and track migrations.

---

## Installation

Install `@sebspark/spanner-migrate` as a global package:

```zsh
yarn add -D @sebspark/spanner-migrate
```

---

## CLI Commands

`spanner-migrate` provides several commands for managing database migrations in Google Spanner.

### Initialize Configuration

```sh
spanner-migrate init
```

Initializes a `.spanner-migrate.config.json` file by prompting for:
- Spanner instance name
- One or more database configurations
- Optional Google Cloud project name

### Create a Migration

```sh
spanner-migrate create <description ...> [--database <name>]
spanner-migrate create add users table
spanner-migrate create --database=mydb add users table
```

Creates a new migration file with the specified description.

- If `--database` (`-d`) is provided, it uses the specified database.
- If multiple databases exist and none is specified, the user is prompted to select one.
- The filename is generated from the description (`<timestamp>_add_users_table.sql`).

### Apply Migrations

```sh
spanner-migrate up
spanner-migrate up --database <name>
spanner-migrate up --database <name> --max <n>
```

Applies pending migrations.

- If **no** `--database` and `--max` are provided, applies all migrations to all databases.
- If `--database` (`-d`) is provided, applies migrations only to that database.
- If `--max` (`-m`) is provided, limits the number of migrations applied (requires `--database`).
- `--max` must be an integer greater than 0.

### Roll Back Last Migration

```sh
spanner-migrate down
spanner-migrate down --database <name>
```

Rolls back the last applied migration.

- If a **single** database exists, it is automatically selected.
- If multiple databases exist, `--database` is **required**.
- The specified `--database` must exist.

### Show Migration Status

```sh
spanner-migrate status
spanner-migrate status --database <name>
```

Displays migration status.

- If `--database` is specified, shows status for that database.
- If no `--database` is provided, shows status for all configured databases.

### Help

```sh
spanner-migrate --help
spanner-migrate <command> --help
```

Displays help for the CLI or a specific command.

---

## Programmatic Usage

In addition to the CLI, `spanner-migrate` can be used as a Node.js module to manage migrations programmatically.

### Importing

```typescript
import { init, create, up, down, status } from '@sebspark/spanner-migrate'
```

### Initializing Configuration

```typescript
import { init, type Config } from '@sebspark/spanner-migrate'

const config: Config = {
  instance: {
    name: 'my-instance',
    databases: [
      { name: 'mydb', migrationsPath: './migrations' },
    ],
  },
  projectId: 'my-gcp-project',
}

await init(config, '.spanner-migrate.config.json')
```

Writes the given configuration to a `.spanner-migrate.config.json` file.

### Creating a Migration

```typescript
import { create, type DatabaseConfig } from '@sebspark/spanner-migrate'

const databaseConfig: DatabaseConfig = {
  name: 'mydb',
  migrationsPath: './migrations',
}

await create(databaseConfig, 'add users table')
```

Creates a new migration file for the specified database.

### Applying Migrations

```typescript
import { up, type Config, type DatabaseConfig } from '@sebspark/spanner-migrate'

// Load configuration
const config: Config = /* Load from file or define inline */

// Apply all migrations to all databases
await up(config)

// Apply all migrations to a specific database
const databaseConfig: DatabaseConfig = config.instance.databases[0]
await up(config, databaseConfig)

// Apply up to 5 migrations to a specific database
await up(config, databaseConfig, 5)
```

- Applies pending migrations.
- If a database is specified, only applies migrations to that database.
- If `max` is specified, applies at most `max` migrations.

### Rolling Back Migrations

```typescript
import { up, type Config, type DatabaseConfig } from '@sebspark/spanner-migrate'

const config: Config = /* Load from file */
const databaseConfig: DatabaseConfig = config.instance.databases[0]

// Roll back the last applied migration
await down(config, databaseConfig)
```

- Rolls back the last applied migration for the specified database.
- Requires a database to be specified.

### Checking Migration Status

```typescript
import { up, type Config, type DatabaseConfig } from '@sebspark/spanner-migrate'

const config: Config = /* Load from file */

// Check status for all databases
const migrationStatus = await status(config)
console.log(migrationStatus)

// Check status for a specific database
const databaseConfig = config.instance.databases[0]
const migrationStatusSingle = await status(config, [databaseConfig])
console.log(migrationStatusSingle)
```

- Displays applied and pending migrations for one or more databases.
- If a specific database is provided, only its status is shown.

## Running on Spanner Emulator

If you want to test your migrations against a Spanner Emulator, you will need to set:

```typescript
process.env.SPANNER_EMULATOR_HOST = 'localhost:<port>'
```

## License

[Apache-2.0](LICENSE)
