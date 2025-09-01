// src/generate.spec.ts
import { describe, it, expect } from 'vitest'
import { generateK6Main, generateK6RequestFiles, type EmittedRequestFile } from '../generate'
import type { RunPlan } from '../plan'
import type { IRRequest } from '../ir'

const mkReq = (over: Partial<IRRequest>): IRRequest => ({
  name: 'request',
  path: '/abs/request.bru',
  method: 'GET',
  url: 'https://example.test',
  params: {},
  headers: [],
  tests: [],
  ...over,
})

const mkPlan = (reqs: IRRequest[], env?: Record<string, string>): RunPlan => ({
  root: '/abs/root',
  requests: reqs,
  env,
})

describe('generateK6Main', () => {
  it('returns a string containing k6 http import and a default function', () => {
    const plan = mkPlan([mkReq({})])
    const out = generateK6Main(plan, {})
    expect(typeof out).toBe('string')
    expect(out).toMatch(/from\s+'k6\/http'/)
    expect(out).toMatch(/export\s+default\s+function/)
  })
  it('includes each request method and url somewhere in the output', () => {
    const r1 = mkReq({ name: 'get-users', method: 'GET',  url: 'https://api/users' })
    const r2 = mkReq({ name: 'create-user', method: 'POST', url: 'https://api/users' })
    const plan = mkPlan([r1, r2])

    const out = generateK6Main(plan, {})

    expect(out).toMatch(/\bGET\b/)
    expect(out).toMatch(/\bPOST\b/)
    expect(out).toMatch(/https:\/\/api\/users/)
  })
  it('embeds env as a JSON literal when provided', () => {
    const plan = mkPlan([mkReq({})], { API_URL: 'https://env' })
    const out = generateK6Main(plan, { env: { API_URL: 'https://env' } })
    expect(out).toMatch(/const\s+ENV\s*=\s*{[\s\S]*"API_URL"\s*:\s*"https:\/\/env"[\s\S]*}/)
  })
  it('emits `export const options` when k6Options is provided (object)', () => {
    const plan = mkPlan([mkReq({})])
    const out = generateK6Main(plan, { k6Options: { vus: 2, duration: '3s' } })
    expect(out).toMatch(/export\s+const\s+options\s*=\s*{[\s\S]*"vus"\s*:\s*2[\s\S]*"duration"\s*:\s*"3s"[\s\S]*}/)
  })
  it('handles an empty plan gracefully', () => {
    const plan = mkPlan([])
    const out = generateK6Main(plan, {})
    expect(out).toMatch(/from\s+'k6\/http'/)
    expect(out).toMatch(/export\s+default\s+function/)
  })
})

describe('generateK6RequestFiles', () => {
  it('returns one file per request; filename from name (kebab-cased) with .js', () => {
    const r1 = mkReq({ name: 'Get Users', path: '/abs/coll/get-users.bru', method: 'GET',  url: 'https://api/users' })
    const r2 = mkReq({ name: 'create_user', path: '/abs/coll/n/create_user.bru', method: 'POST', url: 'https://api/users' })
    const plan = mkPlan([r1, r2])

    const files: EmittedRequestFile[] = generateK6RequestFiles(plan)
    expect(files.length).toBe(2)

    const names = files.map(f => f.filename).sort()
    expect(names).toEqual(['create-user.js', 'get-users.js'])

    const f1 = files.find(f => f.filename === 'get-users.js')!
    const f2 = files.find(f => f.filename === 'create-user.js')!
    expect(f1.contents).toMatch(/\bGET\b/)
    expect(f1.contents).toMatch(/https:\/\/api\/users/)
    expect(f2.contents).toMatch(/\bPOST\b/)
    expect(f2.contents).toMatch(/https:\/\/api\/users/)
  })

  it('falls back to basename of path when name is empty', () => {
    const r = mkReq({ name: '', path: '/abs/coll/special.bru', method: 'DELETE', url: 'https://api/x' })
    const files = generateK6RequestFiles(mkPlan([r]))
    expect(files[0].filename).toBe('special.js')
    expect(files[0].contents).toMatch(/\bDELETE\b/)
    expect(files[0].contents).toMatch(/https:\/\/api\/x/)
  })

  it('normalizes weird names to safe kebab-case', () => {
    const r = mkReq({ name: '  $$$ Crazy Name (v2)!  ', method: 'PATCH', url: 'https://api/patch' })
    const files = generateK6RequestFiles(mkPlan([r]))
    expect(files[0].filename).toBe('crazy-name-v2.js')
  })
})
