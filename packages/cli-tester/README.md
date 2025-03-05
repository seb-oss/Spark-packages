# `@sebspark/cli-tester`

A wrapper for child_process spawn to simplify interactive cli tests using `@inquirer/prompt`

## Install

```zsh
yarn add @sebspark/cli-tester -D
```

```zsh
npm install @sebspark/cli-tester -D
```

## Usage

```typescript
import test from 'node:test'
import assert from 'node:assert'
import { run } from '@sebspark/cli-tester'

test('awaits an input prompt and provides input', async () => {
  const cli = run('./cli/input.mjs')

  const prompt = await cli.prompt('input')
  assert.strictEqual(prompt.type, 'input')
  assert.strictEqual(prompt.message, 'type something')
  assert.strictEqual(prompt.default, undefined)

  await cli.input('hello')

  const nextPrompt = await cli.prompt('input')
  assert.strictEqual(nextPrompt.type, 'input')
  assert.strictEqual(nextPrompt.message, 'type something else')
  assert.strictEqual(nextPrompt.default, undefined)
})

test('awaits an input prompt with default and provides input', async () => {
  const cli = run('./cli/input.mjs')

  const prompt = await cli.prompt('input')
  assert.strictEqual(prompt.type, 'input')
  assert.strictEqual(prompt.message, 'type something')
  assert.strictEqual(prompt.default, 'default value')

  await cli.input('custom value')

  const nextPrompt = await cli.prompt('input')
  assert.strictEqual(nextPrompt.type, 'input')
  assert.strictEqual(nextPrompt.message, 'type something else')
  assert.strictEqual(nextPrompt.default, undefined)
})

test('awaits a select prompt and chooses an option', async () => {
  const cli = run('./cli/select.mjs')

  const prompt = await cli.prompt('select')
  assert.strictEqual(prompt.type, 'select')
  assert.strictEqual(prompt.message, 'select something')
  assert.deepStrictEqual(prompt.options, ['option 1', 'option 2', 'option 3'])

  await cli.select(1) // Select second option
  const result = await cli.output()

  assert.strictEqual(result, 'option 2')
})

test('checks CLI output after selection', async () => {
  const cli = run('./cli/select.mjs')

  await cli.prompt('select')
  await cli.select(2)

  const result = await cli.output()
  assert.strictEqual(result, 'option 3')
})

test('awaits CLI exit', async () => {
  const cli = run('./cli/input.mjs')

  await cli.prompt('input')
  await cli.input('input 1')
  await cli.prompt('input')
  await cli.input('input 2')

  const exitCode = await cli.exit()
  assert.strictEqual(exitCode, 0)
})
```
## TODO

Add support for:

- Select Separator
- Checkbox
- Confirm
- Search
- Password
- Expand
- Number
- Raw List 
