import {
  createServer,
  type Server as HttpServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http'
import { setTimeout } from 'node:timers/promises'
import { URL } from 'node:url'
import { PubSub, type Topic } from '@google-cloud/pubsub'
import { createAvroParser } from '@sebspark/socket.io-avro/parser'
import { allSchemas as tradeinsightSchemas } from '@sebspark/tradeinsight/avro'
import {
  PubSubEmulatorContainer,
  type StartedPubSubEmulatorContainer,
} from '@testcontainers/gcloud'
import { findFreePorts } from 'find-free-ports'
import * as gax from 'google-gax'
import { Server } from 'socket.io'
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { allSchemas, type Order } from '../avro-schemas'
import { Ca3Client } from '../ca3-client'
import { AccountsOutputModel } from '../generated/ca3'
import { BrokerServer, OrderBroker } from '../order-broker'
import { OrderSubscriber } from '../order-subscriber'
import { ensureTopic } from './helper'

process.env.LOG_LEVEL = 'DEBUG'

describe('TradeInsight socket service', () => {
  let pubsubEmulator: StartedPubSubEmulatorContainer
  let pubsub: PubSub

  let secret: string

  let ca3Server: HttpServer
  let ca3Service: Mock<(req: IncomingMessage, res: ServerResponse) => void>
  let ca3Client: Ca3Client

  let topic: Topic

  let httpServer: HttpServer

  let server: BrokerServer
  let broker: OrderBroker
  let subscriber: OrderSubscriber

  beforeEach(async () => {
    //#region Pubsub
    // Start PubSub emulator
    pubsubEmulator = await new PubSubEmulatorContainer(
      'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators'
    )
      .withReuse()
      .start()
    const projectId = pubsubEmulator.getProjectId()
    pubsub = new PubSub({
      projectId,
      apiEndpoint: pubsubEmulator.getEmulatorEndpoint(),
      sslCreds: gax.grpc.credentials.createInsecure(),
      authClient: {
        getAccessToken: async () => ({ token: 'dummy', res: {} }) as any,
        getRequestHeaders: async () => ({}) as any,
      } as any,
    })

    // Topics
    topic = await ensureTopic(pubsub, 'orders')
    //#endregion

    secret = 'secret'

    const [ca3Port, brokerPort] = await findFreePorts(2)

    //#region CA3
    const ca3Host = `http://localhost:${ca3Port}`
    ca3Service = vi.fn()
    ca3Server = createServer(ca3Service)
    ca3Service.mockImplementation((req, res) => {
      const url = new URL(`${ca3Host}${req.url}`)
      if (url.pathname !== '/Private/Get') {
        res.writeHead(404, 'Not found').end()
        console.log('404', url.pathname)
        return
      }

      if (!req.headers['jwt-assertion']) {
        res.writeHead(401, 'Unauthorized').end()
        console.log('401', req.headers)
        return
      }

      const response: AccountsOutputModel = {
        accounts: [
          { account_identifier: { identifier: '123456' } },
          { account_identifier: { identifier: '789012' } },
        ],
      }

      res
        .writeHead(200, 'OK', {
          'content-type': 'application/json',
        })
        .write(JSON.stringify(response))
      res.end()
      return
    })
    await new Promise<void>((resolve) => ca3Server.listen(ca3Port, resolve))

    ca3Client = new Ca3Client({
      url: ca3Host,
    })
    //#endregion

    //#region Broker server
    // Start http server
    httpServer = await createServer()
    await new Promise<void>((resolve) => httpServer.listen(brokerPort, resolve))

    // Create parser
    const parser = createAvroParser([...tradeinsightSchemas, ...allSchemas])

    server = new Server(httpServer, { parser })
    broker = new OrderBroker({
      server,
      topic,
      ca3Client,
      secret,
    })
    //#endregion

    //#region Broker client
    const access_token = [
      Buffer.from('{}').toString('base64url'),
      Buffer.from(JSON.stringify({ customerNumber: '1234567890' })).toString(
        'base64url'
      ),
      '',
    ].join('.')
    subscriber = new OrderSubscriber(`http://localhost:${brokerPort}`, {
      extraHeaders: { Authorization: `Bearer ${access_token}` },
      parser,
    })
    //#endregion
  }, 120_000)
  afterEach(async () => {
    await broker.close()
    await server.close()
    httpServer.close()

    ca3Server.close()

    await topic.delete()
    await pubsubEmulator.stop()
  })
  it('receives order updates', async () => {
    const listener = vi.fn()
    subscriber.on('order', listener)
    await setTimeout(1000)

    const order: Order = {
      id: 'a',
      accountId: '123456',
      currency: 'SEK',
      side: 'B',
      instrument: {
        id: 'STO',
        name: 'SEB C',
      },
    }

    await topic.publishMessage({ json: order })
    await setTimeout(100)

    expect(listener).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(order)
  })
})
