import { Injectable, Logger } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';
import {
  SchemaIntrospectorService,
  McpToolDefinition,
} from './schema-introspector.service';
import { GraphQLExecutorService } from './graphql-executor.service';

// Use require() for @modelcontextprotocol/sdk because the project uses
// moduleResolution: "node" which doesn't support package.json "exports" maps.
// At runtime, Node/Webpack resolves the subpath exports correctly.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  StreamableHTTPServerTransport,
} = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} = require('@modelcontextprotocol/sdk/types.js');

// Transport instance type (used for the session map)
type McpTransport = InstanceType<typeof StreamableHTTPServerTransport> & {
  sessionId?: string;
  onclose?: (() => void) | undefined;
  handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
    body?: unknown
  ): Promise<void>;
};

@Injectable()
export class McpServerService {
  private readonly logger = new Logger(McpServerService.name);
  private tools: McpToolDefinition[] | null = null;
  private transports = new Map<string, McpTransport>();

  constructor(
    private readonly introspector: SchemaIntrospectorService,
    private readonly executor: GraphQLExecutorService
  ) {}

  private getTools(): McpToolDefinition[] {
    if (!this.tools) {
      this.tools = this.introspector.discoverQueryTools();
      this.logger.log(
        `MCP server initialized with ${this.tools.length} read-only tools`
      );
    }
    return this.tools;
  }

  private createServer(authToken?: string) {
    const server = new Server(
      { name: 'wepublish-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown>,
        annotations: { readOnlyHint: true, openWorldHint: false },
      })),
    }));

    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: {
        params: { name: string; arguments?: Record<string, unknown> };
      }) => {
        const { name, arguments: args } = request.params;
        const tool = this.getTools().find(t => t.name === name);

        if (!tool) {
          return {
            content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            isError: true,
          };
        }

        const result = await this.executor.execute(name, args || {}, authToken);

        if (result.errors && result.errors.length > 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    errors: result.errors.map(e => ({
                      message: e.message,
                      path: e.path,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.data, null, 2),
            },
          ],
        };
      }
    );

    return server;
  }

  private createTransport(authToken?: string): McpTransport {
    const transport: McpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (newSessionId: string) => {
        this.transports.set(newSessionId, transport);
        this.logger.log(`MCP session created: ${newSessionId}`);
      },
    });

    transport.onclose = () => {
      const sid = transport.sessionId;
      if (sid) {
        this.transports.delete(sid);
        this.logger.log(`MCP session closed: ${sid}`);
      }
    };

    const server = this.createServer(authToken);
    server.connect(transport);

    return transport;
  }

  async handlePost(
    req: IncomingMessage & { body?: unknown },
    res: ServerResponse,
    authToken?: string
  ): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && this.transports.has(sessionId)) {
      const transport = this.transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Check if this is an initialization request (single or batched)
    const body = req.body;
    const isInit =
      (body &&
        typeof body === 'object' &&
        !Array.isArray(body) &&
        isInitializeRequest(body)) ||
      (Array.isArray(body) && body.some(isInitializeRequest));

    if (isInit) {
      const transport = this.createTransport(authToken);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // No valid session and not an init request
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message:
            'Bad Request: No valid session ID and not an initialization request',
        },
        id: null,
      })
    );
  }

  async handleGet(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.transports.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Invalid or missing session ID',
          },
          id: null,
        })
      );
      return;
    }

    const transport = this.transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  }

  async handleDelete(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (!sessionId || !this.transports.has(sessionId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: Invalid or missing session ID',
          },
          id: null,
        })
      );
      return;
    }

    const transport = this.transports.get(sessionId)!;
    await transport.handleRequest(req, res);
  }
}
