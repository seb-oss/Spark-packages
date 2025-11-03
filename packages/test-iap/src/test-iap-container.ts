import assert from 'node:assert'
import fs from 'node:fs'
// src/test-iap-container.ts
import path from 'node:path'
import {
  AbstractStartedContainer,
  GenericContainer,
  type StartedNetwork,
  type StartedTestContainer,
} from 'testcontainers'
import { getThisDir, tryResolveNearSelf } from './build-helpers'
import type { Mode } from './types'

export class TestIapContainer {
  private baseImage = 'node:22-alpine'
  private port = 3000
  private target?: string
  private mode?: Mode
  private downstream?: string
  private network?: StartedNetwork

  public withBaseImage(image: string) {
    this.baseImage = image
    return this
  }
  public withPort(port: number) {
    this.port = port
    return this
  }

  public withTarget(url: string) {
    const u = new URL(url)
    assert(
      ['http:', 'https:', 'ws:', 'wss:'].includes(u.protocol),
      'target must be absolute http(s):// or ws(s)://'
    )
    this.target = u.toString()
    return this
  }

  public withMode(mode: Mode) {
    this.mode = mode
    return this
  }

  public withDownstream(url: string) {
    const u = new URL(url)
    assert(
      ['http:', 'https:'].includes(u.protocol),
      'downstream must be absolute http(s)://'
    )
    this.downstream = u.toString()
    return this
  }

  public withNetwork(network: StartedNetwork) {
    this.network = network
    return this
  }

  public async start(): Promise<StartedTestIapContainer> {
    assert(this.target, 'withTarget(...) is required')

    const resolvedMode: Mode =
      this.mode ?? (this.downstream ? 'downstream' : 'local')
    if (resolvedMode === 'downstream') {
      assert(
        this.downstream,
        'withDownstream(...) is required when mode=downstream'
      )
    }

    // directory of the installed package's compiled files (dist)
    const distDir = path.join(getThisDir(), '../dist')
    assert(fs.existsSync(distDir), `dist directory not found: ${distDir}`)

    // prefer start.mjs, then start.js
    const startMjs = path.join(distDir, 'start.mjs')
    const startJs = path.join(distDir, 'start.js')

    const hasStartMjs = fs.existsSync(startMjs)
    const hasStartJs = fs.existsSync(startJs)

    if (!hasStartMjs && !hasStartJs) {
      throw new Error(`Could not find ${startMjs} or ${startJs}`)
    }

    const entry = hasStartMjs ? '/app/dist/start.mjs' : '/app/dist/start.js'

    // mount dist + the installed 'jose' module so imports work inside the container
    const josePkgPath = tryResolveNearSelf('jose/package.json')
    if (!josePkgPath) {
      throw new Error(
        'Could not resolve "jose" next to @sebspark/test-iap. ' +
          'Ensure "jose" is installed as a dependency in the same project that installs @sebspark/test-iap.'
      )
    }
    const joseDir = path.dirname(josePkgPath)

    const binds = [
      { source: distDir, target: '/app/dist' },
      { source: joseDir, target: '/app/node_modules/jose' },
    ]

    const env: Record<string, string> = {
      TARGET: this.target as string,
      MODE: resolvedMode,
      PORT: String(this.port),
    }
    if (resolvedMode === 'downstream' && this.downstream) {
      env.DOWNSTREAM = this.downstream
    }

    const gc = new GenericContainer(this.baseImage)
      .withWorkingDir('/app')
      .withBindMounts(binds)
      .withExposedPorts(this.port)
      .withEnvironment(env)
      .withCommand(['node', entry])

    if (this.network) gc.withNetwork(this.network)

    const started = await gc.start()
    return new StartedTestIapContainer(started, this.port)
  }
}

export class StartedTestIapContainer extends AbstractStartedContainer {
  constructor(
    started: StartedTestContainer,
    private readonly internalPort: number
  ) {
    super(started)
  }
  public getEndpoint() {
    return `${this.getHost()}:${this.getMappedPort(this.internalPort)}`
  }
}
