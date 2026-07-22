import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PrismaClient } from '@prisma/client';
import { IncomingMessage } from 'http';
import { Server, WebSocket } from 'ws';
import { getYDoc, setupWSConnection } from 'y-websocket/bin/utils';
import { z } from 'zod';

export const COLLABORATION_WS_PORT = Number.parseInt(
  process.env['COLLABORATION_WS_PORT'] ?? '4100',
  10
);

// Reject oversized frames so a client can't push arbitrary amounts of data.
const gatewayOptions = { maxPayload: 1024 * 1024 };

const WS_CLOSE_UNKNOWN_ARTICLE = 4404;
const WS_CLOSE_INVALID_PRESENCE = 4422;

// The presence payload a client is allowed to broadcast via awareness. Strict,
// so a client can't attach arbitrary fields — only a bounded id and name.
const presenceUserSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().max(256).optional(),
  })
  .strict();

@WebSocketGateway(COLLABORATION_WS_PORT, gatewayOptions)
export class CollaborationGateway implements OnGatewayConnection {
  private readonly guardedDocs = new WeakSet<object>();

  constructor(private prisma: PrismaClient) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(
    connection: WebSocket,
    request: IncomingMessage
  ): Promise<void> {
    const url = new URL(request.url ?? '', 'ws://localhost');
    const connectionParams = {
      id: url.pathname.slice(1),
    };

    const { id } = connectionParams;

    // Attach the y-websocket handlers synchronously so early client messages
    // (notably the initial awareness state) are not lost, then guard the
    // article's presence and confirm the article exists.
    setupWSConnection(connection, request, { docName: id });
    this.guardPresence(id);

    const exists = await this.prisma.article.findUnique({
      where: { id: id },
    });

    if (!exists) {
      connection.close(WS_CLOSE_UNKNOWN_ARTICLE, 'Unknown article');
    }
  }

  /**
   * Validate the presence (awareness) payload each client publishes so a
   * client can't broadcast an arbitrary user to its peers. Attached once per
   * document; a client that publishes an invalid user is disconnected.
   */
  private guardPresence(id: string): void {
    const doc = getYDoc(id);

    if (this.guardedDocs.has(doc)) {
      return;
    }

    this.guardedDocs.add(doc);

    doc.awareness.on('update', ({ added, updated }, origin) => {
      const connection = origin as Pick<WebSocket, 'close'> | null;

      if (!connection || typeof connection.close !== 'function') {
        return;
      }

      const states = doc.awareness.getStates();
      for (const clientId of [...added, ...updated]) {
        const state = states.get(clientId);

        if (
          state &&
          'user' in state &&
          !presenceUserSchema.safeParse(state['user']).success
        ) {
          connection.close(
            WS_CLOSE_INVALID_PRESENCE,
            'Invalid presence payload'
          );

          return;
        }
      }
    });
  }
}
