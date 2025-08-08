export enum BookEventType {
  CREATED = 'book.created',
  UPDATED = 'book.updated',
  DELETED = 'book.deleted',
  VIEWED = 'book.viewed',
  BATCH_CREATED = 'book.batch_created',
  SYNC_STARTED = 'book.sync.started',
  SYNC_COMPLETED = 'book.sync.completed',
  VIEWS_UPDATED = 'book.views.updated',
  LISTED = 'book.listed',
  BATCH_VIEWED = 'book.batch_viewed',
  AUTHOR_SEARCHED = 'book.author_searched'
}

export enum BookEventSource {
  API = 'api',
  SYNC = 'sync',
  ADMIN = 'admin',
  SYSTEM = 'system',
  CRON = 'cron',
}