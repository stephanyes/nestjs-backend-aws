import { BookEventSource, BookEventType } from "../constants/event-types.constants";

export interface BookEventPayload {
  bookId?: string;
  bookIds?: string[];  // Para operaciones batch
  title?: string;
  author?: string;
  publicationYear?: number;
  views?: number;
  previousData?: any;  // Para updates, guardar estado anterior
  changes?: Record<string, any>;  // Campos que cambiaron
  userId?: string;  // Para cuando agregues autenticación
}

export interface BookEventMetadata {
  source: BookEventSource;
  version: string;
  correlationId?: string;  // Para tracking de requests
  ip?: string;
  userAgent?: string;
}

export interface BookEvent {
  id: string;  // UUID único del evento
  type: BookEventType;
  timestamp: Date;
  payload: BookEventPayload;
  metadata: BookEventMetadata;
}