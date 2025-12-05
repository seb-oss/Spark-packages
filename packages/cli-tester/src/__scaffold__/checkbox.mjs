#!/usr/bin/env node
import { checkbox } from '@inquirer/prompts'

const somethings = await checkbox({
  message: 'select somethings',
  choices: ['option 1', 'option 2', 'option 3'],
})
const requiredSomethings = await checkbox({
  message: 'select somethings',
  choices: ['option 4', 'option 5', 'option 6'],
  required: true,
})
console.log(somethings, requiredSomethings)
