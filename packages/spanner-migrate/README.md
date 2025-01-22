# @sebspark/spanner-migrate

`spanner-migrate` is a CLI tool for managing schema migrations for Google Cloud Spanner. It simplifies schema evolution by allowing you to create, apply, rollback, and track migrations.

---

## Installation

Install `@sebspark/spanner-migrate` as a global package:

```zsh
yarn add -D @sebspark/spanner-migrate
```

---

## CLI Usage

Run `spanner-migrate` from your project root. If no command is provided, the help message is displayed.

```zsh
spanner-migrate [command] [options]
```

### Commands

#### `init`
Initialize a Spanner migration configuration file (`.spanner-migrate.config.json`).

**Usage:**

```zsh
spanner-migrate init
```

**Prompts:**
- `Enter the path for your migrations`: Directory for migration files (default: `./migrations`).
- `Enter Spanner instance name`: The name of the Spanner instance.
- `Enter Spanner database name`: The name of the Spanner database.
- `Enter Google Cloud project name`: (Optional) The Google Cloud project name.

---

#### `create <description>`
Create a new migration file.

**Usage:**

```zsh
spanner-migrate create add users table
```

**Result:**

Example:

`./migrations/20250120145638000_create_table_users.sql`

```sql
-- Created: 2025-01-20T14:56:38.000Z
-- Description: create table users

---- UP ----



---- DOWN ----



```

#### `up`
Apply pending migrations

**Usage:**

```zsh
spanner-migrate up
```

If you don't want to apply all pending migrations, use the `--max` or `-m` flag

```zsh
spanner migrate up --max 1
```

#### `down`
Rollback one migration

**Usage:**

```zsh
spanner-migrate down
```

#### `status`
Check migration status

**Usage:**

```zsh
spanner-migrate status
```
Displays an overview of applied and peding migrations

```text
Migrations

Applied
--------------------------------------------------------------------------------
20250122080434866_add_users_table
20250122080444982_add_index_on_users

New
--------------------------------------------------------------------------------
20250122080444982_add_index_on_users
```

---

## License

[Apache-2.0](LICENSE)
