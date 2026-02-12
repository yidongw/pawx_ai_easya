import { integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

export const counterSchema = pgTable('counter', {
  id: serial('id').primaryKey(),
  count: integer('count').default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const userWallets = pgTable('user_wallets', {
  id: serial('id').primaryKey(),
  telegramUserId: text('telegram_user_id').notNull(),
  evmAddress: text('evm_address').notNull(),
  solAddress: text('sol_address').notNull(),
  evmPrivateKey: text('evm_private_key').notNull(),
  solPrivateKey: text('sol_private_key').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, table => ({
  telegramUserIdIdx: uniqueIndex('user_wallets_telegram_user_id_idx').on(table.telegramUserId),
}));
