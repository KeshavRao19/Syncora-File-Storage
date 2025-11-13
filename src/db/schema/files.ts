import { pgTable, text, timestamp, bigint, boolean, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { folders } from './folders';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),

  // Storage location
  storageKey: text('storage_key').notNull().unique(), // R2 object key
  storageUrl: text('storage_url'), // Public URL if shared

  // Organization
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Metadata
  description: text('description'),
  tags: text('tags').array(),

  // Sharing
  isPublic: boolean('is_public').notNull().default(false),
  shareToken: text('share_token').unique(), // For shareable links
  shareExpiresAt: timestamp('share_expires_at'),

  // Trash
  isTrashed: boolean('is_trashed').notNull().default(false),
  trashedAt: timestamp('trashed_at'),

  // Encryption metadata (for Phase 2)
  isEncrypted: boolean('is_encrypted').notNull().default(false),
  encryptionMethod: text('encryption_method'), // 'client-side', 'server-side', 'hybrid'

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
