import { performance } from 'node:perf_hooks'
import { PubSub, type Message } from '@google-cloud/pubsub'
import { PubSubEmulatorContainer, type StartedPubSubEmulatorContainer } from '@testcontainers/gcloud'

export const startPubSub = async () => {
  const emulator = await new PubSubEmulatorContainer('gcr.io/google.com/cloudsdktool/google-cloud-cli:532.0.0-emulators').start()

  // Ensure topics and subscriptions
  const { sendSubscription, receiveTopic } = await ensureTopicsAndSubscriptions(emulator)

  // Set up ping/pong
  sendSubscription.on('message', (msg) => {
    const message = msg.data.toString()
    msg.ack()
    if (message === 'PING') {
      receiveTopic.publishMessage({
        data: Buffer.from('PONG')
      })
    }
  })

  return emulator
}

export const pingPubSub = async (emulator: StartedPubSubEmulatorContainer, callback: (message: string) => void) => {
  const pubsub = new PubSub({ projectId: emulator.getProjectId() })

  const { sendTopic, receiveSubscription } = await ensureTopicsAndSubscriptions(emulator)

  const handler = (msg: Message) => {
    const message = msg.data.toString()
    msg.ack()

    if (message === 'PONG') {
      receiveSubscription.off('message', handler)
      callback(message)
    }
  }
  receiveSubscription.on('message', handler)
  sendTopic.publishMessage({ data: Buffer.from('PING') })
}

const ensureTopicsAndSubscriptions = async (emulator: StartedPubSubEmulatorContainer) => {
  const pubsub = new PubSub({
    projectId: emulator.getProjectId(),
    apiEndpoint: emulator.getEmulatorEndpoint(),
    credentials: {},
  })

  // Create outgoing topic
  const sendTopic = pubsub.topic('send')
  const [sendTopicExists] = await sendTopic.exists()
  if (!sendTopicExists) {
    await sendTopic.create()
  }

  // Create outgoing subscription
  const sendSubscription = pubsub.topic('send').subscription('send_subscription')
  const [sendSubscriptionExists] = await sendSubscription.exists()
  if (!sendSubscriptionExists) {
    await sendSubscription.create()
  }

  // Create incoming topic
  const receiveTopic = pubsub.topic('receive')
  const [receiveTopicExists] = await receiveTopic.exists()
  if (!receiveTopicExists) {
    await receiveTopic.create()
  }

  // Create incoming subscription
  const receiveSubscription = pubsub.topic('receive').subscription('receive_subscription')
  const [receiveSubscriptionExists] = await receiveSubscription.exists()
  if (!receiveSubscriptionExists) {
    await receiveSubscription.create()
  }

  return {
    sendTopic,
    sendSubscription,
    receiveTopic,
    receiveSubscription,
  }
}
