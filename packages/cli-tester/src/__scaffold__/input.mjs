#!/usr/bin/env node
import { input } from '@inquirer/prompts'
;(async function run() {
  const something = await input({ message: 'type something', required: false })
  const somethingElse = await input({
    message: 'type something else',
    default: 'foo',
  })
  const somethingRequired = await input({
    message: 'type something required',
    required: true,
  })
})()
