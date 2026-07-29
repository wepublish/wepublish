declare module 'y-websocket/bin/utils' {
  import { IncomingMessage } from 'http';
  import { WebSocket } from 'ws';

  export interface SetupWSConnectionOptions {
    docName?: string;
    gc?: boolean;
  }

  export function setupWSConnection(
    conn: WebSocket,
    request: IncomingMessage,
    options?: SetupWSConnectionOptions
  ): void;

  export interface AwarenessChange {
    added: number[];
    updated: number[];
    removed: number[];
  }

  export interface WsSharedDoc {
    name: string;
    awareness: {
      getStates(): Map<number, Record<string, unknown>>;
      on(
        event: 'update',
        handler: (change: AwarenessChange, origin: unknown) => void
      ): void;
    };
  }

  export function getYDoc(docName: string, gc?: boolean): WsSharedDoc;
}
