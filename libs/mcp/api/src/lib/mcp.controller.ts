import { Controller, Delete, Get, Post, Req, Res } from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import type { Request, Response } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { McpServerService } from './mcp-server.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpServerService) {}

  @Public()
  @Post()
  async handlePost(@Req() req: Request, @Res() res: Response): Promise<void> {
    const authToken = this.extractBearerToken(req);
    await this.mcpService.handlePost(
      req as unknown as IncomingMessage & { body?: unknown },
      res as unknown as ServerResponse,
      authToken
    );
  }

  @Public()
  @Get()
  async handleGet(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mcpService.handleGet(
      req as unknown as IncomingMessage,
      res as unknown as ServerResponse
    );
  }

  @Public()
  @Delete()
  async handleDelete(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.mcpService.handleDelete(
      req as unknown as IncomingMessage,
      res as unknown as ServerResponse
    );
  }

  private extractBearerToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader) return undefined;

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      return parts[1];
    }

    return undefined;
  }
}
