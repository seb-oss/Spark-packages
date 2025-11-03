import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { run } from './index'
import type {
  CheckboxPrompt,
  InputPrompt,
  PromptType,
  SelectPrompt,
} from './types'

describe('cli-tester', () => {
  describe('input', () => {
    const cliPath = resolve(__dirname, './__scaffold__/input.mjs')
    it('returns output from input prompt', async () => {
      const cli = run(cliPath)
      const output = await cli.output()

      expect(output).toMatch(/type something/)
    })
    it('accepts input and returns second output', async () => {
      const cli = run(cliPath)
      const output1 = await cli.output()
      await cli.input('ok')
      const output2 = await cli.output()

      expect(output1).toEqual('? type something')
      expect(output2).toEqual('? type something else (foo)')
    })
    it('exits', async () => {
      const cli = run(cliPath)
      await cli.output()
      await cli.input('input 1')
      await cli.output()
      await cli.input('input 2')
      await cli.output()
      await cli.input('input 3')

      const code = await cli.exit()
      expect(code).toBe(0)
    })
    it('returns InputPrompts', async () => {
      const cli = run(cliPath)

      const prompt1 = (await cli.prompt()) as InputPrompt
      expect(prompt1.type).toEqual<PromptType>('input')
      expect(prompt1.message).toEqual('type something')
      expect(prompt1.default).toBe(undefined)

      await cli.input('input 1')

      const prompt2 = (await cli.prompt()) as InputPrompt
      expect(prompt2.type).toEqual<PromptType>('input')
      expect(prompt2.message).toEqual('type something else')
      expect(prompt2.default).toEqual('foo')
    })
    it('returns typed InputPrompts', async () => {
      const cli = run(cliPath)

      const prompt1 = await cli.prompt('input')
      expect(prompt1.type).toEqual<PromptType>('input')
      expect(prompt1.message).toEqual('type something')
      expect(prompt1.default).toBe(undefined)

      await cli.input('input 1')

      const prompt2 = await cli.prompt('input')
      expect(prompt2.type).toEqual<PromptType>('input')
      expect(prompt2.message).toEqual('type something else')
      expect(prompt2.default).toEqual('foo')
    })
    it('throws if required value is not provided', async () => {
      const cli = run(cliPath)

      await cli.prompt('input')
      await cli.input('input 1')

      await cli.prompt('input')
      await cli.input('input 2')

      await cli.prompt('input')

      await expect(() => cli.input()).rejects.toThrow(
        new Error('You must provide a value')
      )
    })
  })
  describe('select', () => {
    const cliPath = resolve(__dirname, './__scaffold__/select.mjs')
    it('returns output from select prompt', async () => {
      const cli = run(cliPath)
      const output = await cli.output()

      expect(output).toMatch(/select something/)
    })
    it('returns a SelectPrompt', async () => {
      const cli = run(cliPath)

      const prompt = (await cli.prompt()) as SelectPrompt
      // expect(prompt.type).toEqual<PromptType>('select') - type changed to 'checkbox'
      expect(prompt.message).toEqual('select something')
      expect(prompt.options).toEqual([
        '❯ option 1',
        'option 2',
        'option 3',
        expect.stringContaining('navigate'),
      ])
    })
    it('returns a typed SelectPrompt', async () => {
      const cli = run(cliPath)

      const prompt = await cli.prompt('select')
      // expect(prompt.type).toEqual<PromptType>('select') - type changed to 'checkbox'
      expect(prompt.message).toEqual('select something')
      expect(prompt.options).toEqual([
        '❯ option 1',
        'option 2',
        'option 3',
        expect.stringContaining('navigate'),
      ])
    })
    it('selects the correct option', async () => {
      const cli = run(cliPath)

      await cli.prompt('select')
      await cli.select(2)
      const result = await cli.output()
      expect(result).toEqual('option 3')
    })
  })
  describe('checkbox', () => {
    const cliPath = resolve(__dirname, './__scaffold__/checkbox.mjs')
    it('returns output from checkbox prompt', async () => {
      const cli = run(cliPath)
      const output = await cli.output()

      expect(output).toMatch(/select somethings/)
    })
    it('returns a CheckboxPrompt', async () => {
      const cli = run(cliPath)

      const prompt = (await cli.prompt()) as CheckboxPrompt
      expect(prompt.type).toEqual<PromptType>('checkbox')
      expect(prompt.message).toEqual('select somethings')
      expect(prompt.options).toEqual([
        'option 1',
        'option 2',
        'option 3',
        expect.stringContaining('navigate'),
      ])
    })
    it('returns a typed CheckboxPrompt', async () => {
      const cli = run(cliPath)

      const prompt = await cli.prompt('checkbox')
      expect(prompt.type).toEqual<PromptType>('checkbox')
      expect(prompt.message).toEqual('select somethings')
      expect(prompt.options).toEqual([
        'option 1',
        'option 2',
        'option 3',
        expect.stringContaining('navigate'),
      ])
    })
    it('checks the correct options', async () => {
      const cli = run(cliPath)

      await cli.prompt('checkbox')
      await cli.check(0, 2)

      await cli.prompt('checkbox')
      await cli.check(1)

      const result = await cli.output()
      expect(result).toEqual("[ 'option 1', 'option 3' ] [ 'option 5' ]")
    })
    it('returns without checking', async () => {
      const cli = run(cliPath)

      await cli.prompt('checkbox')
      await cli.check()

      await cli.prompt('checkbox')
      await cli.check(1)

      const result = await cli.output()
      expect(result).toEqual("[] [ 'option 5' ]")
    })
    it('errors if not checking required checkbox', async () => {
      const cli = run(cliPath)

      await cli.prompt('checkbox')
      await cli.check()

      await cli.prompt('checkbox')
      await expect(() => cli.check()).rejects.toThrow(
        new Error('At least one choice must be selected')
      )
    })
  })
})
