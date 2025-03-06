import nock from 'nock';
import { describe, it, beforeEach, afterEach, vi, expect } from 'vitest';
import { TypedClient } from '../client';
import { ApiClient } from './api';
import { AxiosError } from 'axios';
import { HttpError } from '@sebspark/openapi-core';

describe('Auth Retry Tests', () => {
  const url = 'https://api.example.com';

  let server = nock(url)

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
    vi.clearAllMocks();
  });

  const authorizationTokenGeneratorMock = vi.fn();
  const authorizationTokenGenerator = () => authorizationTokenGeneratorMock

  const authorizationTokenRefreshMock = vi.fn();
  const authorizationTokenRefresh = () => authorizationTokenRefreshMock

  
  const apiClient = TypedClient<ApiClient>(url, {
    authorizationTokenGenerator,
    authorizationTokenRefresh
  });

  it('should refresh token and retry on auth failure', async () => {
    authorizationTokenGeneratorMock.mockResolvedValue({
      'Proxy-auth': 'Bearer 123'
     })

    server
      .get('/health')
      .reply(401, { message: 'Unauthorized' })
      .get('/health')
      .reply(200, { });

    // Your test logic here
    await apiClient.get('/health');
    expect(authorizationTokenRefreshMock).toHaveBeenCalledOnce();
    expect(authorizationTokenGeneratorMock).toBeCalledTimes(2);

    expect(server.isDone()).to.be.true;
  });

  it('should only retry once', async () => {
    authorizationTokenGeneratorMock.mockResolvedValue({
      'Proxy-auth': 'Bearer 123'
     })

    server
      .get('/health')
      .reply(401, { message: 'Unauthorized' })
      .get('/health')
      .reply(401, { message: 'Unauthorized' })

    // Your test logic here
    try {
      await apiClient.get('/health');
      expect(false).toBe(true);
    } catch (error) {
      expect((((error as HttpError).cause) as AxiosError).cause?.message).toBe('Unauthorized');

      expect(authorizationTokenRefreshMock).toHaveBeenCalledOnce();
      expect(authorizationTokenGeneratorMock).toBeCalledTimes(2);
    }
    
    expect(server.isDone()).to.be.true;
  });
});