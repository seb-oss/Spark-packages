import { test } from 'vitest'
import type { IndexDefinition } from './common'
import type { SearchRequest } from './search'

const personIndex = {
  index: 'person',
  body: {
    mappings: {
      properties: {
        name: { type: 'keyword' },
        age: { type: 'integer' },
      },
    },
  },
} as const satisfies IndexDefinition

type PersonIndex = typeof personIndex

test('term query accepts { [fieldName]: value } format (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        term: {
          age: 30,
        },
      },
    },
  }

  void search
})

test('prefix query accepts { [fieldName]: value } format (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        prefix: {
          name: 'Jo',
        },
      },
    },
  }

  void search
})

test('regexp query accepts { [fieldName]: { value } } format (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        regexp: {
          name: { value: '[Jj]ohn' },
        },
      },
    },
  }

  void search
})

test('wildcard query accepts { [fieldName]: { value } } format (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        wildcard: {
          name: { value: 'Jo*' },
        },
      },
    },
  }

  void search
})

test('span_term query accepts { [fieldName]: { value } } format (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        span_term: {
          name: { value: 'John' },
        },
      },
    },
  }

  void search
})

test('terms_set query accepts { [fieldName]: { terms, minimum_should_match_field } } format (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        terms_set: {
          name: {
            terms: ['John', 'Jane'],
            minimum_should_match_field: 'age',
          },
        },
      },
    },
  }

  void search
})
