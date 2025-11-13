import { pgTable, text, timestamp, boolean, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  hashedPassword: text('hashed_password'),
  name: text('name'),
  avatar: text('avatar'),
  role: text('role').notNull().default('user'), // 'user', 'admin'

  // OAuth fields
  googleId: text('google_id').unique(),

  // Storage quota (in bytes)
  storageQuota: bigint('storage_quota', { mode: 'number' }).notNull().default(5368709120), // 5GB default
  storageUsed: bigint('storage_used', { mode: 'number' }).notNull().default(0),

  // Subscription
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  subscriptionStatus: text('subscription_status'), // 'active', 'canceled', 'past_due', etc.

  // 2FA
  twoFactorSecret: text('two_factor_secret'),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
