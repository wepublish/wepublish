import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { GraphQLField, GraphQLArgument, GraphQLSchema } from 'graphql';
import {
  buildArgsJsonSchema,
  JsonSchemaProperty,
} from './graphql-to-jsonschema.util';

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaProperty;
  field: GraphQLField<unknown, unknown>;
}

const EXCLUDED_QUERIES = new Set([
  'checkInvoiceStatus', // Has side effects: updates invoice from payment provider
  'challenge', // Generates stateful cryptographic challenge
]);

@Injectable()
export class SchemaIntrospectorService implements OnModuleInit {
  private readonly logger = new Logger(SchemaIntrospectorService.name);
  private schemaHost!: GraphQLSchemaHost;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.schemaHost = this.moduleRef.get(GraphQLSchemaHost, { strict: false });
  }

  discoverQueryTools(): McpToolDefinition[] {
    const schema = this.schemaHost.schema;
    const queryType = schema.getQueryType();

    if (!queryType) {
      this.logger.warn('No Query type found in GraphQL schema');
      return [];
    }

    const fields = queryType.getFields();
    const tools: McpToolDefinition[] = [];

    for (const [fieldName, field] of Object.entries(fields)) {
      if (EXCLUDED_QUERIES.has(fieldName)) {
        this.logger.log(`Excluding query "${fieldName}" (has side effects)`);
        continue;
      }

      const args: readonly GraphQLArgument[] = field.args;
      const inputSchema = buildArgsJsonSchema(args);

      tools.push({
        name: fieldName,
        description: field.description || `GraphQL query: ${fieldName}`,
        inputSchema,
        field,
      });
    }

    this.logger.log(
      `Discovered ${tools.length} query tools from GraphQL schema`
    );
    return tools;
  }
}
