import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import type { BrunoRequest } from '@usebruno/lang'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { flatten, readCollection } from '../collection'
import type { Folder } from '../types'
import { type FileStructure, createFileStructure } from './helpers'

// --- Test Setup ---
const TEMP_DIR = path.join(process.cwd(), '../../', '.tmp-collection-test')

// This object represents our entire directory structure and file contents
const FILE_STRUCTURE: FileStructure = {
  'bruno.json': JSON.stringify({
    name: 'My API Collection',
    version: '1',
  }),
  'get_root_info.bru': `meta {\n  name: Get Root Info\n  type: http\n  seq: 2\n}\n\nget {\n  url: /\n}`,
  'another_request.bru': `meta {\n  name: Another Request\n  type: http\n  seq: 1\n}\n\nget {\n  url: /health\n}`,
  users: {
    'folder.bru': `meta {\n  name: Users\n  seq: 1\n}\n\nauth {\n  mode: inherit\n}`,
    'get_user.bru': `meta {\n  name: Get User\n  type: http\n  seq: 1\n}\n\nget {\n  url: /users/1\n}`,
    'create_user.bru': `meta {\n  name: Create User\n  type: http\n  seq: 2\n}\n\npost {\n  url: /users\n}`,
    posts: {
      'folder.bru': `meta {\n  name: Posts\n  seq: 1\n}\n\nauth {\n  mode: inherit\n}`,
      'get_post.bru': `meta {\n  name: Get Post\n  type: http\n  seq: 1\n}\n\nget {\n  url: /posts/1\n}`,
    },
  },
  'bad-folder': {}, // This folder is missing folder.bru and should be ignored
  environments: {
    'DEV.bru': `vars {\n  host: dev.example.com\n}\n`,
    'ACC.bru': `vars {\n  host: acc.example.com\n}\n`,
  },
}

// --- Test Suite ---
describe('Collection Traverser', () => {
  // Before all tests, create the temporary directory and file structure
  beforeAll(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true }) // Clean up previous runs
    mkdirSync(TEMP_DIR, { recursive: true })
    createFileStructure(TEMP_DIR, FILE_STRUCTURE)
  })
  // After all tests, clean up the temporary directory
  afterAll(() => {
    rmSync(TEMP_DIR, { recursive: true, force: true })
  })
  it('correctly traverses the file system and builds a collection object (root input)', () => {
    const collection = readCollection(TEMP_DIR)

    // Assert root collection properties
    expect(collection.root).toBe(path.resolve(TEMP_DIR))
    expect(collection.meta.name).toBe('My API Collection')
    expect(collection.meta.type).toBe('collection')

    expect(collection.environments).toBeTruthy()
    expect(collection.environments.DEV).toEqual({
      variables: [
        {
          enabled: true,
          name: 'host',
          secret: false,
          value: 'dev.example.com',
        },
      ],
    })
    expect(collection.environments.ACC).toEqual({
      variables: [
        {
          enabled: true,
          name: 'host',
          secret: false,
          value: 'acc.example.com',
        },
      ],
    })

    // Assert root-level children (sorted by seq)
    // 'bad-folder' should be ignored
    expect(collection.children).toHaveLength(3)
    expect(collection.children[0].meta.name).toBe('Another Request') // seq: 1
    expect(collection.children[1].meta.name).toBe('Users') // seq: 1
    expect(collection.children[2].meta.name).toBe('Get Root Info') // seq: 2

    // Find the 'Users' folder to inspect its children
    const usersFolder = collection.children.find(
      (c) => c.meta.name === 'Users' && c.meta.type === 'folder'
    ) as Folder
    expect(usersFolder).toBeDefined()

    // Assert children within the 'users' folder (sorted by seq)
    expect(usersFolder.children).toHaveLength(3)
    expect(usersFolder.children[0].meta.name).toBe('Get User') // seq: 1
    expect(usersFolder.children[1].meta.name).toBe('Posts') // seq: 1
    expect(usersFolder.children[2].meta.name).toBe('Create User') // seq: 2

    // Find the nested 'Posts' folder
    const postsFolder = usersFolder.children.find(
      (c) => c.meta.name === 'Posts' && c.meta.type === 'folder'
    ) as Folder
    expect(postsFolder).toBeDefined()

    // Assert children within the nested 'posts' folder
    expect(postsFolder.children).toHaveLength(1)
    const postRequest = postsFolder.children[0]
    expect(postRequest.meta.name).toBe('Get Post')
    expect(postRequest.meta.type).toBe('http')
  })
  it('scopes to a subfolder and wraps with ancestor folders', () => {
    const subdir = path.join(TEMP_DIR, 'users', 'posts')
    const collection = readCollection(subdir)

    // root should still be the collection root
    expect(collection.root).toBe(path.resolve(TEMP_DIR))

    // environments are still loaded from <root>/environments
    expect(collection.environments).toHaveProperty('DEV')
    expect(collection.environments).toHaveProperty('ACC')

    // One top-level child: Users
    expect(collection.children).toHaveLength(1)
    const users = collection.children[0] as Folder
    expect(users.meta.type).toBe('folder')
    expect(users.meta.name).toBe('Users')

    // Under Users → one child: Posts
    expect((users.children as any[]).length).toBe(1)
    const posts = users.children[0] as Folder
    expect(posts.meta.type).toBe('folder')
    expect(posts.meta.name).toBe('Posts')

    // Under Posts → only Get Post request
    expect(posts.children).toHaveLength(1)
    const onlyReq = posts.children[0] as BrunoRequest
    expect(onlyReq.meta.type).toBe('http')
    expect(onlyReq.meta.name).toBe('Get Post')

    // Flattened paths should reflect users/posts/get-post
    const flat = flatten(collection.children)
    expect(flat).toHaveLength(1)
    expect(flat[0].path).toBe('users/posts/get-post')
    expect(flat[0].child.meta.name).toBe('Get Post')
  })
  it('scopes to a single .bru file and wraps with ancestor folders', () => {
    const file = path.join(TEMP_DIR, 'users', 'posts', 'get_post.bru')
    const collection = readCollection(file)

    // root should still be the collection root
    expect(collection.root).toBe(path.resolve(TEMP_DIR))

    // environments are still loaded from <root>/environments
    expect(collection.environments).toHaveProperty('DEV')
    expect(collection.environments).toHaveProperty('ACC')

    // One top-level child: Users
    expect(collection.children).toHaveLength(1)
    const users = collection.children[0] as Folder
    expect(users.meta.type).toBe('folder')
    expect(users.meta.name).toBe('Users')

    // Under Users → one child: Posts
    expect((users.children as any[]).length).toBe(1)
    const posts = users.children[0] as Folder
    expect(posts.meta.type).toBe('folder')
    expect(posts.meta.name).toBe('Posts')

    // Under Posts → only Get Post request (the targeted file)
    expect(posts.children).toHaveLength(1)
    const onlyReq = posts.children[0] as BrunoRequest
    expect(onlyReq.meta.type).toBe('http')
    expect(onlyReq.meta.name).toBe('Get Post')

    // Flattened paths should reflect users/posts/get-post
    const flat = flatten(collection.children)
    expect(flat).toHaveLength(1)
    expect(flat[0].path).toBe('users/posts/get-post')
    expect(flat[0].child.meta.name).toBe('Get Post')
  })
})

describe('flatten', () => {
  it('should flatten a complex nested structure of folders and requests', () => {
    const nestedChildren: (BrunoRequest | Folder)[] = [
      {
        meta: { name: 'Get Root Info', type: 'http', seq: 1 },
      } as BrunoRequest,
      {
        meta: { name: 'Users', type: 'folder', seq: 2 },
        children: [
          {
            meta: { name: 'Get User', type: 'http', seq: 1 },
          } as BrunoRequest,
          {
            meta: { name: 'Posts', type: 'folder', seq: 2 },
            children: [
              {
                meta: { name: 'Get Post', type: 'http', seq: 1 },
              } as BrunoRequest,
            ],
          } as Folder,
        ],
      } as Folder,
      {
        meta: { name: 'Empty Folder', type: 'folder', seq: 3 },
        children: [] as BrunoRequest[],
      } as Folder,
    ]

    const result = flatten(nestedChildren)

    expect(result).toHaveLength(3)

    expect(result[0].path).toBe('get-root-info')
    expect(result[0].child.meta.name).toBe('Get Root Info')

    expect(result[1].path).toBe('users/get-user')
    expect(result[1].child.meta.name).toBe('Get User')

    expect(result[2].path).toBe('users/posts/get-post')
    expect(result[2].child.meta.name).toBe('Get Post')
  })
  it('should return an empty array if the input is empty', () => {
    const result = flatten([])
    expect(result).toEqual([])
  })
  it('should handle a list with only requests and no folders', () => {
    const requestsOnly: BrunoRequest[] = [
      { meta: { name: 'Request 1', type: 'http', seq: 1 } } as BrunoRequest,
      { meta: { name: 'Request 2', type: 'http', seq: 2 } } as BrunoRequest,
    ]

    const result = flatten(requestsOnly)

    expect(result).toHaveLength(2)
    expect(result[0].path).toBe('request-1')
    expect(result[1].path).toBe('request-2')
  })
  it('should correctly handle folders that contain no requests', () => {
    const foldersWithNoRequests: Folder[] = [
      {
        meta: { name: 'Folder A', type: 'folder', seq: 1 },
        children: [] as BrunoRequest[],
      } as Folder,
      {
        meta: { name: 'Folder B', type: 'folder', seq: 2 },
        children: [
          {
            meta: { name: 'Subfolder C', type: 'folder', seq: 1 },
            children: [] as BrunoRequest[],
          } as Folder,
        ],
      } as Folder,
    ]

    const result = flatten(foldersWithNoRequests)
    expect(result).toHaveLength(0)
  })
})
