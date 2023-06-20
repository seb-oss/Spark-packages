import { Request, Router } from 'express'
import { subscriptions } from './subscriber'

type PushMessage = {
  subscription: string
  message: {
    data: string
    messageId: string
  }
}

export const pushRouter = () => {
  const r = Router()

  r.post(
    '/pubsub/push',
    // eslint-disable-next-line max-statements
    (req: Request<any, any, PushMessage>, res) => {
      console.log(
        `new PubSub push message received on subscription: ${req.body.subscription}`
      )
      if (!req.body) {
        const msg = 'no Pub/Sub message received'
        console.error(`error: ${msg}`)
        return res.status(400).send(`Bad Request: ${msg}`)
      }
      if (!req.body.message) {
        const msg = 'invalid Pub/Sub message format'
        console.error(`error: ${msg}`)
        return res.status(400).send(`Bad Request: ${msg}`)
      }

      const pubSubMessage = req.body.message
      const decodedMessage = Buffer.from(pubSubMessage.data, 'base64')
        .toString()
        .trim()

      const subscriptionName = req.body.subscription
      if (subscriptions[subscriptionName]) {
        const message = {
          data: Buffer.from(decodedMessage),
          id: pubSubMessage.messageId,
          ack: () => res.status(204).send(),
          nack: () => res.status(500).send(),
        }
        subscriptions[subscriptionName].emit('push-message', message)
      } else {
        res.status(404).send(`No listener for: ${req.body.subscription}`)
      }
    }
  )

  return r
}
