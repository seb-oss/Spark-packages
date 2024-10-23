import type { ClientConfig, PublishOptions, PubSub, Topic } from "@google-cloud/pubsub";
import { vi } from "vitest";

export class PubSubMock implements Partial<PubSub> {
    static mockInstances: { [key: string]: PubSubMock } = {};
    static mockTopicsInstances: { [key: string]: Topic } = {};
    projectId: string;

    constructor(clientOptions?: ClientConfig | undefined) {
      this.projectId = clientOptions?.projectId ?? 'unknown';
      if(clientOptions?.projectId) {
        PubSubMock.mockInstances[clientOptions.projectId] = this;
      } 
    }
    topic(name: string, options?: PublishOptions): Topic {
      const subscription = {
        get: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
      }
      const mockTopic = {
        name,
        get: vi.fn().mockImplementation(async () => [mockTopic]),
        publishMessage: vi.fn().mockImplementation(async () => 'ok'),
        subscription: vi.fn().mockImplementation(async () => [subscription]),
        createSubscription: vi.fn().mockImplementation(() => subscription),
      }
      PubSubMock.mockTopicsInstances[this.projectId] = mockTopic as unknown as Topic;
      return PubSubMock.mockTopicsInstances[this.projectId] ;
    }
  }