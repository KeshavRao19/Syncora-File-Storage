import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color'), // For UI customization

  // Hierarchy
  parentId: uuid('parent_id').references((): any => folders.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Sharing
  isPublic: boolean('is_public').notNull().default(false),
  shareToken: text('share_token').unique(),

  // Trash
  isTrashed: boolean('is_trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
