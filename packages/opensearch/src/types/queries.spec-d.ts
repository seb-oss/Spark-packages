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
        active: { type: 'boolean' },
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

test('term query accepts a boolean value (OpenSearch wire format)', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        term: {
          active: true,
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

const articleIndex = {
  index: 'article',
  body: {
    mappings: {
      properties: {
        title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        published: { type: 'date' },
      },
    },
  },
} as const satisfies IndexDefinition

type ArticleIndex = typeof articleIndex

test('term query accepts a multi-field sub-field', () => {
  const search: SearchRequest<ArticleIndex> = {
    index: 'article',
    body: {
      query: { term: { 'title.keyword': 'John Wick' } },
    },
  }

  void search
})

test('script_score query requires a query', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        // @ts-expect-error - OpenSearch rejects script_score without query
        script_score: { script: { source: "doc['age'].value" } },
      },
    },
  }

  void search
})

test('knn query accepts a single filter query', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        knn: {
          name: { vector: [1, 1], k: 1, filter: { term: { active: true } } },
        },
      },
    },
  }

  void search
})

test('knn query rejects an array of filter queries', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        knn: {
          name: {
            vector: [1, 1],
            k: 1,
            // @ts-expect-error - OpenSearch rejects an array as knn filter
            filter: [{ term: { active: true } }],
          },
        },
      },
    },
  }

  void search
})

test('knn query combines several filters in one bool query', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        knn: {
          name: {
            vector: [1, 1],
            k: 1,
            filter: {
              bool: {
                filter: [
                  { term: { active: true } },
                  { range: { age: { gte: 18 } } },
                ],
              },
            },
          },
        },
      },
    },
  }

  void search
})

test('script_score with match_all scores every document', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        script_score: {
          query: { match_all: {} },
          script: { source: "doc['age'].value" },
        },
      },
    },
  }

  void search
})

test('terms_set query takes numbers as strings', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: {
      query: {
        terms_set: {
          age: { terms: ['30', '40'], minimum_should_match_field: 'age' },
        },
      },
    },
  }

  void search
})

test('sort accepts the direction shorthand', () => {
  const search: SearchRequest<PersonIndex> = {
    index: 'person',
    body: { sort: [{ age: 'desc' }, { name: { order: 'asc' } }] },
  }

  void search
})
