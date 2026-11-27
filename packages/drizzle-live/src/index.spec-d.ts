import type { drizzle } from 'drizzle-orm/node-postgres'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { describe, expectTypeOf, it } from 'vitest'
import { defineLiveTable, type Listener, live, writeAndNotify } from './index'

// Type tests are only type-checked, never run, so the database and listener
// only need to be declared.
declare const db: ReturnType<typeof drizzle>
declare const listener: Listener

const orders = pgTable('orders', {
  id: integer().primaryKey(),
  reference: text().notNull(),
  status: text().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull(),
})

type Order = typeof orders.$inferSelect

describe('defineLiveTable', () => {
  it('keys rows by the primary key, typed as that column', async () => {
    const liveOrders = await live(db, defineLiveTable(orders), { listener })

    expectTypeOf(liveOrders.get(42)).toEqualTypeOf<Order | undefined>()
    // @ts-expect-error an id from a URL is a string, not the key's number
    liveOrders.get('42')
    // @ts-expect-error another column's value is not a key
    liveOrders.get(new Date())
  })

  it('keys rows by the given column, typed as that column', async () => {
    const liveOrders = await live(
      db,
      defineLiveTable(orders, { key: orders.reference }),
      { listener }
    )

    expectTypeOf(liveOrders.get('ORD-1')).toEqualTypeOf<Order | undefined>()
    // @ts-expect-error the key is the reference, not the id
    liveOrders.get(42)
  })

  it('emits rows typed like the table, and keys typed like the key column', async () => {
    const liveOrders = await live(db, defineLiveTable(orders), { listener })

    liveOrders.on('update', (order) =>
      expectTypeOf(order).toEqualTypeOf<Order>()
    )
    liveOrders.on('delete', (id) => expectTypeOf(id).toEqualTypeOf<number>())
  })

  it('only accepts keys of the key column from writeAndNotify', () => {
    const ordersTable = defineLiveTable(orders)

    writeAndNotify(db, ordersTable, async () => [42])
    // @ts-expect-error '42' instead of 42 would report order 42 as deleted
    writeAndNotify(db, ordersTable, async () => ['42'])
  })
})
