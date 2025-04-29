import express from 'express'
import { type Agent, agent } from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'

import { randomUUID } from 'node:crypto'
import { getLogger } from './logger'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe.only('logging e2e verification', () => {
  describe('logger', () => {
    // it('logs info to console', async () => {
    //   const { logger } = getLogger({
    //     gcpProjectId: 'neo-99r70-dev',
    //     shouldSendToGcp: true,
    //     service: randomUUID(),
    //     showLogs: true,
    //     maskingSensitivityRules: [
    //       { key: 'kurre', pattern: /\d{14}/g, replacement: '************' },
    //       { key: 'pnr', pattern: /\d{8}-?\d{4}/g, replacement: '************' },
    //     ],
    //   })
    //   logger.info({
    //     pnr: '201202120349',
    //     kurre: '12021203490000',
    //     guid: '195F4421-D388-4BD9-9EAF-0A73BD2135EA',
    //     herp: 'derp',
    //   })
    //   await wait(3000)
    // })
    // it('logs error to console', async () => {
    //   console.log('\n ===> RUNNING TEST: Error logged <====')
    //   const { logger } = getLogger({
    //     gcpProjectId: 'neo-99r70-dev',
    //     shouldSendToGcp: true,
    //     // enableConsole: true,
    //     service: randomUUID(),
    //     showLogs: true,
    //     maskingSensitivityRules: [
    //       { key: 'kurre', pattern: /\d{14}/g, replacement: '************' },
    //       { key: 'pnr', pattern: /\d{8}-?\d{4}/g, replacement: '************' },
    //     ],
    //   })

    //   const message = `"Cannot find GIP by provided parameters: '200508062387': {"response":{"errors":[{"message":"Cannot find GIP by provided parameters: '200508062387'","locations":[],"path":[],"extensions":{"classification":"DataFetchingException"}}],"data":{"groupInvolvedPartiesByIdentifiers":[]},"status":200,"headers":{}},"request":{"query":"query getGroupInvolvedPartiesByIdentifiers($identifiers: [String!]!) {\n  groupInvolvedPartiesByIdentifiers(\n    identifierType: \"SE_PNR_NP\"\n    identifiers: $identifiers\n  ) {\n    involvedPartyId\n    individuals {\n      dateOfBirth\n      protectedIdentity\n    }\n    ipNames {\n      ipNameComponents {\n        ipNameComponentType\n        nameValue\n      }\n    }\n    ipIds {\n      ipIdType\n      ipIdValue\n    }\n    relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n      roleTo {\n        isRelatedIp\n        role\n      }\n      roleFrom {\n        isRelatedIp\n        role\n      }\n      createdAt\n      entityVersion\n      id\n      state\n      type\n      involvedParty {\n        involvedPartyId\n        ipIds {\n          ipIdType\n          ipIdValue\n        }\n        individuals {\n          dateOfBirth\n          protectedIdentity\n        }\n        ipNames {\n          ipNameComponents {\n            ipNameComponentType\n            nameValue\n          }\n        }\n        relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n          createdAt\n          entityVersion\n          id\n          roleFrom {\n            isRelatedIp\n            role\n          }\n          roleTo {\n            isRelatedIp\n            role\n          }\n          type\n          state\n          involvedParty {\n            involvedPartyId\n            ipIds {\n              ipIdType\n              ipIdValue\n            }\n            individuals {\n              dateOfBirth\n              protectedIdentity\n            }\n            ipNames {\n              ipNameComponents {\n                ipNameComponentType\n                nameValue\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}","variables":{"identifiers":["200508062387"]}}}"`
    //   const stack = `Error: Cannot find GIP by provided parameters: '200508062387': {"response":{"errors":[{"message":"Cannot find GIP by provided parameters: '200508062387'","locations":[],"path":[],"extensions":{"classification":"DataFetchingException"}}],"data":{"groupInvolvedPartiesByIdentifiers":[]},"status":200,"headers":{}},"request":{"query":"query getGroupInvolvedPartiesByIdentifiers($identifiers: [String!]!) {\n  groupInvolvedPartiesByIdentifiers(\n    identifierType: \"SE_PNR_NP\"\n    identifiers: $identifiers\n  ) {\n    involvedPartyId\n    individuals {\n      dateOfBirth\n      protectedIdentity\n    }\n    ipNames {\n      ipNameComponents {\n        ipNameComponentType\n        nameValue\n      }\n    }\n    ipIds {\n      ipIdType\n      ipIdValue\n    }\n    relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n      roleTo {\n        isRelatedIp\n        role\n      }\n      roleFrom {\n        isRelatedIp\n        role\n      }\n      createdAt\n      entityVersion\n      id\n      state\n      type\n      involvedParty {\n        involvedPartyId\n        ipIds {\n          ipIdType\n          ipIdValue\n        }\n        individuals {\n          dateOfBirth\n          protectedIdentity\n        }\n        ipNames {\n          ipNameComponents {\n            ipNameComponentType\n            nameValue\n          }\n        }\n        relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n          createdAt\n          entityVersion\n          id\n          roleFrom {\n            isRelatedIp\n            role\n          }\n          roleTo {\n            isRelatedIp\n            role\n          }\n          type\n          state\n          involvedParty {\n            involvedPartyId\n            ipIds {\n              ipIdType\n              ipIdValue\n            }\n            individuals {\n              dateOfBirth\n              protectedIdentity\n            }\n            ipNames {\n              ipNameComponents {\n                ipNameComponentType\n                nameValue\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}","variables":{"identifiers":["200508062387"]}}}
    // at makeRequest (/app/node_modules/graphql-request/build/cjs/index.js:310:15)
    // at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    // at async Object.getGroupInvolvedPartiesByIdentifiers (/app/libs/server/fetcher/src/lib/fetcher.js:43:12)
    // at async PromiseCache.wrap (/app/node_modules/@sebspark/promise-cache/dist/index.js:344:22)
    // at async wrapInPromiseCache (/app/libs/server/redis/src/lib/server-redis.js:53:10)
    // at async Object.getUserAndRelations (/app/libs/server/css-api/src/lib/api.js:70:9)
    // at async /app/libs/server/tracer/src/lib/tracer.js:74:26`
    //   const error = new Error(message)
    //   error.stack = stack

    //   const errorDetails = {
    //     error: message,
    //     stack: stack,
    //   }

    //   logger.warn('CSS getGroupInvolvedPartiesByIdentifiers - GraphQL Error', {
    //     error:
    //       'Cannot find GIP by provided parameters: \'194604123275\': {"response":{"errors":[{"message":"Cannot find GIP by provided parameters: \'194604123275\'","locations":[],"path":[],"extensions":{"classification":"DataFetchingException"}}],"data":{"groupInvolvedPartiesByIdentifiers":[]},"status":200,"headers":{}},"request":{"query":"query getGroupInvolvedPartiesByIdentifiers($identifiers: [String!]!) {\\n  groupInvolvedPartiesByIdentifiers(\\n    identifierType: \\"SE_PNR_NP\\"\\n    identifiers: $identifiers\\n  ) {\\n    involvedPartyId\\n    individuals {\\n      dateOfBirth\\n      protectedIdentity\\n    }\\n    ipNames {\\n      ipNameComponents {\\n        ipNameComponentType\\n        nameValue\\n      }\\n    }\\n    ipIds {\\n      ipIdType\\n      ipIdValue\\n    }\\n    relatedInvolvedParties(relationTypes: [\\"VARDNADSHAVARE\\"], rolesTo: [\\"MINOR\\"]) {\\n      roleTo {\\n        isRelatedIp\\n        role\\n      }\\n      roleFrom {\\n        isRelatedIp\\n        role\\n      }\\n      createdAt\\n      entityVersion\\n      id\\n      state\\n      type\\n      involvedParty {\\n        involvedPartyId\\n        ipIds {\\n          ipIdType\\n          ipIdValue\\n        }\\n        individuals {\\n          dateOfBirth\\n          protectedIdentity\\n        }\\n        ipNames {\\n          ipNameComponents {\\n            ipNameComponentType\\n            nameValue\\n          }\\n        }\\n        relatedInvolvedParties(relationTypes: [\\"VARDNADSHAVARE\\"], rolesTo: [\\"MINOR\\"]) {\\n          createdAt\\n          entityVersion\\n          id\\n          roleFrom {\\n            isRelatedIp\\n            role\\n          }\\n          roleTo {\\n            isRelatedIp\\n            role\\n          }\\n          type\\n          state\\n          involvedParty {\\n            involvedPartyId\\n            ipIds {\\n              ipIdType\\n              ipIdValue\\n            }\\n            individuals {\\n              dateOfBirth\\n              protectedIdentity\\n            }\\n            ipNames {\\n              ipNameComponents {\\n                ipNameComponentType\\n                nameValue\\n              }\\n            }\\n          }\\n        }\\n      }\\n    }\\n  }\\n}","variables":{"identifiers":["194604123275"]}}}',
    //     stack:
    //       'Error: Cannot find GIP by provided parameters: \'194604123275\': {"response":{"errors":[{"message":"Cannot find GIP by provided parameters: \'194604123275\'","locations":[],"path":[],"extensions":{"classification":"DataFetchingException"}}],"data":{"groupInvolvedPartiesByIdentifiers":[]},"status":200,"headers":{}},"request":{"query":"query getGroupInvolvedPartiesByIdentifiers($identifiers: [String!]!) {\\n  groupInvolvedPartiesByIdentifiers(\\n    identifierType: \\"SE_PNR_NP\\"\\n    identifiers: $identifiers\\n  ) {\\n    involvedPartyId\\n    individuals {\\n      dateOfBirth\\n      protectedIdentity\\n    }\\n    ipNames {\\n      ipNameComponents {\\n        ipNameComponentType\\n        nameValue\\n      }\\n    }\\n    ipIds {\\n      ipIdType\\n      ipIdValue\\n    }\\n    relatedInvolvedParties(relationTypes: [\\"VARDNADSHAVARE\\"], rolesTo: [\\"MINOR\\"]) {\\n      roleTo {\\n        isRelatedIp\\n        role\\n      }\\n      roleFrom {\\n        isRelatedIp\\n        role\\n      }\\n      createdAt\\n      entityVersion\\n      id\\n      state\\n      type\\n      involvedParty {\\n        involvedPartyId\\n        ipIds {\\n          ipIdType\\n          ipIdValue\\n        }\\n        individuals {\\n          dateOfBirth\\n          protectedIdentity\\n        }\\n        ipNames {\\n          ipNameComponents {\\n            ipNameComponentType\\n            nameValue\\n          }\\n        }\\n        relatedInvolvedParties(relationTypes: [\\"VARDNADSHAVARE\\"], rolesTo: [\\"MINOR\\"]) {\\n          createdAt\\n          entityVersion\\n          id\\n          roleFrom {\\n            isRelatedIp\\n            role\\n          }\\n          roleTo {\\n            isRelatedIp\\n            role\\n          }\\n          type\\n          state\\n          involvedParty {\\n            involvedPartyId\\n            ipIds {\\n              ipIdType\\n              ipIdValue\\n            }\\n            individuals {\\n              dateOfBirth\\n              protectedIdentity\\n            }\\n            ipNames {\\n              ipNameComponents {\\n                ipNameComponentType\\n                nameValue\\n              }\\n            }\\n          }\\n        }\\n      }\\n    }\\n  }\\n}","variables":{"identifiers":["194604123275"]}}}\n    at makeRequest (/app/node_modules/graphql-request/build/cjs/index.js:310:15)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async Object.getGroupInvolvedPartiesByIdentifiers (/app/libs/server/fetcher/src/lib/fetcher.js:43:12)\n    at async PromiseCache.wrap (/app/node_modules/@sebspark/promise-cache/dist/index.js:344:22)\n    at async wrapInPromiseCache (/app/libs/server/redis/src/lib/server-redis.js:53:10)\n    at async Object.getUserAndRelations (/app/libs/server/css-api/src/lib/api.js:70:9)\n    at async /app/libs/server/tracer/src/lib/tracer.js:74:26',
    //   })

    //   await wait(2000)
    // })
    // it('sets log level', () => {
    //   const { logger } = getLogger({
    //     level: 'debug',
    //     service: 'test1',
    //     showLogs: true,
    //   })
    //   expect(logger.level).toBe('debug')
    // })
    // it('reads LOG_LEVEL env var', () => {
    //   // process.env.LOG_LEVEL = 'warn'
    //   const { logger } = getLogger({ service: 'test2', showLogs: true })
    //   // expect(logger.level).toBe('warn')
    // })
  })

  describe('express middlewares', () => {
    let server: Agent
    beforeEach(() => {
      const { requestMiddleware, errorRequestMiddleware, logger } = getLogger({
        gcpProjectId: 'neo-99r70-dev',
        shouldSendToGcp: true,
        enableConsole: false,
        service: randomUUID(),
        showLogs: true,
        maskingSensitivityRules: [
          { key: 'kurre', pattern: /\d{14}/g, replacement: '************' },
          { key: 'pnr', pattern: /\d{8}-?\d{4}/g, replacement: '************' },
        ],
      })

      const app = express()
      app.use(requestMiddleware())
      app.get('/', (_req, res) => {
        res.send({ hello: 'world' })
      })
      app.get('/error', (_req, _res, next) => {
        next(new Error('error'))
      })
      app.get('/gone', (_req, res, next) => {
        res.status(410).send({ message: 'Gone' })
        next(new Error('gone'))
      })
      app.get('/unhandled', (_req, _res, next) => {
        throw new Error('unhandled')
      })
      app.post('/css-error', (_req, res) => {
        const message = `"Cannot find GIP by provided parameters: '200508062387': {"response":{"errors":[{"message":"Cannot find GIP by provided parameters: '200508062387'","locations":[],"path":[],"extensions":{"classification":"DataFetchingException"}}],"data":{"groupInvolvedPartiesByIdentifiers":[]},"status":200,"headers":{}},"request":{"query":"query getGroupInvolvedPartiesByIdentifiers($identifiers: [String!]!) {\n  groupInvolvedPartiesByIdentifiers(\n    identifierType: \"SE_PNR_NP\"\n    identifiers: $identifiers\n  ) {\n    involvedPartyId\n    individuals {\n      dateOfBirth\n      protectedIdentity\n    }\n    ipNames {\n      ipNameComponents {\n        ipNameComponentType\n        nameValue\n      }\n    }\n    ipIds {\n      ipIdType\n      ipIdValue\n    }\n    relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n      roleTo {\n        isRelatedIp\n        role\n      }\n      roleFrom {\n        isRelatedIp\n        role\n      }\n      createdAt\n      entityVersion\n      id\n      state\n      type\n      involvedParty {\n        involvedPartyId\n        ipIds {\n          ipIdType\n          ipIdValue\n        }\n        individuals {\n          dateOfBirth\n          protectedIdentity\n        }\n        ipNames {\n          ipNameComponents {\n            ipNameComponentType\n            nameValue\n          }\n        }\n        relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n          createdAt\n          entityVersion\n          id\n          roleFrom {\n            isRelatedIp\n            role\n          }\n          roleTo {\n            isRelatedIp\n            role\n          }\n          type\n          state\n          involvedParty {\n            involvedPartyId\n            ipIds {\n              ipIdType\n              ipIdValue\n            }\n            individuals {\n              dateOfBirth\n              protectedIdentity\n            }\n            ipNames {\n              ipNameComponents {\n                ipNameComponentType\n                nameValue\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}","variables":{"identifiers":["200508062387"]}}}"`
        const stack = `Error: Cannot find GIP by provided parameters: '200508062387': {"response":{"errors":[{"message":"Cannot find GIP by provided parameters: '200508062387'","locations":[],"path":[],"extensions":{"classification":"DataFetchingException"}}],"data":{"groupInvolvedPartiesByIdentifiers":[]},"status":200,"headers":{}},"request":{"query":"query getGroupInvolvedPartiesByIdentifiers($identifiers: [String!]!) {\n  groupInvolvedPartiesByIdentifiers(\n    identifierType: \"SE_PNR_NP\"\n    identifiers: $identifiers\n  ) {\n    involvedPartyId\n    individuals {\n      dateOfBirth\n      protectedIdentity\n    }\n    ipNames {\n      ipNameComponents {\n        ipNameComponentType\n        nameValue\n      }\n    }\n    ipIds {\n      ipIdType\n      ipIdValue\n    }\n    relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n      roleTo {\n        isRelatedIp\n        role\n      }\n      roleFrom {\n        isRelatedIp\n        role\n      }\n      createdAt\n      entityVersion\n      id\n      state\n      type\n      involvedParty {\n        involvedPartyId\n        ipIds {\n          ipIdType\n          ipIdValue\n        }\n        individuals {\n          dateOfBirth\n          protectedIdentity\n        }\n        ipNames {\n          ipNameComponents {\n            ipNameComponentType\n            nameValue\n          }\n        }\n        relatedInvolvedParties(relationTypes: [\"VARDNADSHAVARE\"], rolesTo: [\"MINOR\"]) {\n          createdAt\n          entityVersion\n          id\n          roleFrom {\n            isRelatedIp\n            role\n          }\n          roleTo {\n            isRelatedIp\n            role\n          }\n          type\n          state\n          involvedParty {\n            involvedPartyId\n            ipIds {\n              ipIdType\n              ipIdValue\n            }\n            individuals {\n              dateOfBirth\n              protectedIdentity\n            }\n            ipNames {\n              ipNameComponents {\n                ipNameComponentType\n                nameValue\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}","variables":{"identifiers":["200508062387"]}}}
    at makeRequest (/app/node_modules/graphql-request/build/cjs/index.js:310:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Object.getGroupInvolvedPartiesByIdentifiers (/app/libs/server/fetcher/src/lib/fetcher.js:43:12)
    at async PromiseCache.wrap (/app/node_modules/@sebspark/promise-cache/dist/index.js:344:22)
    at async wrapInPromiseCache (/app/libs/server/redis/src/lib/server-redis.js:53:10)
    at async Object.getUserAndRelations (/app/libs/server/css-api/src/lib/api.js:70:9)
    at async /app/libs/server/tracer/src/lib/tracer.js:74:26`
        const error = new Error(message)
        error.stack = stack
        throw error
      })

      app.use(errorRequestMiddleware())

      server = agent(app)
    })
    // it('masks sensitive data in all requests', async () => {
    //   await server.get(
    //     '/?notapersonalnumber=201202120349&notakurre=12021203490000&guid=195F4421-D388-4BD9-9EAF-0A73BD2135EA'
    //   )

    //   await wait(3000)
    // })
    it('masks sensitive data in errors', async () => {
      await server.post('/css-error')
      await wait(3000)
    })

    // it('logs all errors', async () => {
    //   await server.get('/error')
    //   await wait(3000)
    // })
    // it('logs all handled errors', async () => {
    //   await server.get('/gone')
    //   await wait(3000)
    // })
    // it('logs all unhandled errors', async () => {
    //   await server.get('/unhandled')
    //   await wait(3000)
    // })
  })
})
