import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { SchemaIntrospectorService } from './schema-introspector.service';
import { GraphQLExecutorService } from './graphql-executor.service';

@Module({
  controllers: [McpController],
  providers: [
    McpServerService,
    SchemaIntrospectorService,
    GraphQLExecutorService,
  ],
})
export class McpModule {}
