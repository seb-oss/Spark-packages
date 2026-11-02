import { test } from 'vitest'
import type { AggregationContainer } from '../index'
import type { IndexDefinition } from './common'
import type { SearchRequest } from './search'

const newsIndex = {
  index: 'news',
  body: {
    mappings: {
      properties: {
        time: { type: 'date' },
        headline: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      },
    },
  },
} as const satisfies IndexDefinition

type NewsIndex = typeof newsIndex

const tradesIndex = {
  index: 'trades',
  body: {
    mappings: {
      properties: {
        assetId: { type: 'keyword' },
        date: { type: 'date' },
        last: { type: 'double' },
        bid: { type: 'double' },
        ask: { type: 'double' },
        nav: { type: 'double' },
        high: { type: 'double' },
        low: { type: 'double' },
        volume: { type: 'long' },
      },
    },
  },
} as const satisfies IndexDefinition

type TradesIndex = typeof tradesIndex

test('max aggregation accepts a mapped field', () => {
  const search: SearchRequest<NewsIndex> = {
    index: 'news',
    body: { aggs: { latest: { max: { field: 'time' } } } },
  }

  void search
})

test('min aggregation accepts a mapped field', () => {
  const search: SearchRequest<NewsIndex> = {
    index: 'news',
    body: { aggs: { latest: { min: { field: 'time' } } } },
  }

  void search
})

test('sum aggregation accepts a mapped field', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: { aggs: { volume: { sum: { field: 'volume' } } } },
  }

  void search
})

test('avg aggregation accepts a mapped field', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: { aggs: { averageNav: { avg: { field: 'nav' } } } },
  }

  void search
})

test('value_count aggregation accepts a mapped field', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: { aggs: { count: { value_count: { field: 'assetId' } } } },
  }

  void search
})

test('cardinality aggregation accepts a mapped field', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: { aggs: { assets: { cardinality: { field: 'assetId' } } } },
  }

  void search
})

test('metric aggregation accepts a script instead of a field', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        spread: {
          max: { script: { source: "doc['ask'].value - doc['bid'].value" } },
        },
      },
    },
  }

  void search
})

test('the aggregations key is typed the same way as aggs', () => {
  const search: SearchRequest<NewsIndex> = {
    index: 'news',
    body: { aggregations: { latest: { max: { field: 'time' } } } },
  }

  void search
})

test('terms aggregation accepts a multi-field sub-field', () => {
  const search: SearchRequest<NewsIndex> = {
    index: 'news',
    body: {
      aggs: { headlines: { terms: { field: 'headline.keyword', size: 10 } } },
    },
  }

  void search
})

test('date_histogram with top_hits and metric sub-aggregations', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        buckets: {
          date_histogram: {
            field: 'date',
            calendar_interval: 'month',
            order: { _key: 'asc' },
          },
          aggs: {
            newest: {
              top_hits: {
                sort: [{ date: { order: 'desc' } }],
                _source: ['last', 'bid', 'ask', 'date', 'nav'],
                size: 1,
              },
            },
            high: { max: { field: 'high' } },
            low: { min: { field: 'low' } },
            volume: { sum: { field: 'volume' } },
          },
        },
      },
    },
  }

  void search
})

test('terms with nested date_range, max and top_hits sub-aggregations', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        perAsset: {
          terms: { field: 'assetId', size: 100 },
          aggs: {
            periods: {
              date_range: {
                field: 'date',
                ranges: [{ key: '1y', from: '2025-11-02' }, { key: 'max' }],
              },
              aggs: {
                high: { max: { field: 'nav' } },
                open: {
                  top_hits: {
                    sort: [{ date: { order: 'asc' } }],
                    _source: ['date', 'nav'],
                    size: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  }

  void search
})

test('range aggregation accepts a mapped field', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        navBands: {
          range: { field: 'nav', ranges: [{ to: 100 }, { from: 100 }] },
          aggs: { volume: { sum: { field: 'volume' } } },
        },
      },
    },
  }

  void search
})

test('filter aggregation accepts an index-aware query', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        recent: {
          filter: { range: { date: { gte: '2025-11-02' } } },
          aggs: { high: { max: { field: 'high' } } },
        },
      },
    },
  }

  void search
})

test('sub-aggregations of a bucket aggregation that is not overridden are index-aware', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        byNav: {
          histogram: { field: 'nav', interval: 10 },
          aggs: { high: { max: { field: 'high' } } },
        },
      },
    },
  }

  void search
})

test('AggregationContainer is exported and typed against the index', () => {
  const latest: AggregationContainer<NewsIndex> = { max: { field: 'time' } }

  void latest
})

test('derivative, which is not overridden, keeps its upstream type as a sub-aggregation', () => {
  const search: SearchRequest<TradesIndex> = {
    index: 'trades',
    body: {
      aggs: {
        dailyHigh: {
          date_histogram: { field: 'date', calendar_interval: 'day' },
          aggs: {
            high: { max: { field: 'high' } },
            change: { derivative: { buckets_path: 'high' } },
          },
        },
      },
    },
  }

  void search
})
