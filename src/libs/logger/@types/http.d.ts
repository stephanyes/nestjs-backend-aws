import '@types/http';

declare module 'http' {
  interface IncomingMessage {
    body?: object;
    startTime?: number;
    dir?: directions;
  }
  interface OutgoingMessage {
    body?: object;
    responseTime?: number;
    dir: directions;
  }
}
