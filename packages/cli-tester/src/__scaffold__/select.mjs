#!/usr/bin/env node
import { select } from '@inquirer/prompts'
;(async function run() {
  const something = await select({
    message: 'select something',
    choices: ['option 1', 'option 2', 'option 3'],
  })
  console.log(something)
})()
