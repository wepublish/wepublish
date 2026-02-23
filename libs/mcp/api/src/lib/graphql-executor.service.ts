import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import {
  AuthenticationService,
  AuthSession,
} from '@wepublish/authentication/api';
import {
  execute,
  parse,
  GraphQLField,
  GraphQLType,
  GraphQLArgument,
  ExecutionResult,
} from 'graphql';
import { buildSelectionFields } from './graphql-to-jsonschema.util';

const MAX_SELECTION_DEPTH = 3;

@Injectable()
export class GraphQLExecutorService implements OnModuleInit {
  private readonly logger = new Logger(GraphQLExecutorService.name);
  private schemaHost!: GraphQLSchemaHost;
  private authService!: AuthenticationService;

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.schemaHost = this.moduleRef.get(GraphQLSchemaHost, { strict: false });
    this.authService = this.moduleRef.get(AuthenticationService, {
      strict: false,
    });
  }

  async execute(
    queryFieldName: string,
    args: Record<string, unknown>,
    authToken?: string
  ): Promise<ExecutionResult> {
    const schema = this.schemaHost.schema;
    const queryType = schema.getQueryType();

    if (!queryType) {
      return { errors: [{ message: 'No Query type in schema' } as any] };
    }

    const field = queryType.getFields()[queryFieldName];
    if (!field) {
      return {
        errors: [{ message: `Unknown query field: ${queryFieldName}` } as any],
      };
    }

    const queryString = this.buildQueryString(queryFieldName, field);
    let document;
    try {
      document = parse(queryString);
    } catch (err) {
      this.logger.error(
        `Failed to parse generated query for "${queryFieldName}": ${err}`
      );
      return {
        errors: [
          {
            message: `Internal error building query for ${queryFieldName}`,
          } as any,
        ],
      };
    }

    const contextValue = await this.buildContext(authToken);
    const variableValues = this.buildVariables(field.args, args);

    try {
      return await execute({
        schema,
        document,
        contextValue,
        variableValues,
      });
    } catch (err) {
      this.logger.error(`Execution error for "${queryFieldName}": ${err}`);
      return {
        errors: [
          { message: `Execution error: ${(err as Error).message}` } as any,
        ],
      };
    }
  }

  private buildQueryString(
    fieldName: string,
    field: GraphQLField<unknown, unknown>
  ): string {
    const args = field.args;
    const varDefs = args
      .map(arg => `$${arg.name}: ${arg.type.toString()}`)
      .join(', ');
    const argUsage = args.map(arg => `${arg.name}: $${arg.name}`).join(', ');

    const selectionSet = this.buildFieldSelections(
      field.type,
      MAX_SELECTION_DEPTH
    );

    const varDefsStr = varDefs ? `(${varDefs})` : '';
    const argUsageStr = argUsage ? `(${argUsage})` : '';
    const selectionsStr = selectionSet ? ` { ${selectionSet} }` : '';

    return `query Mcp${capitalize(fieldName)}${varDefsStr} { ${fieldName}${argUsageStr}${selectionsStr} }`;
  }

  private buildFieldSelections(
    type: GraphQLType,
    depth: number
  ): string | null {
    const fields = buildSelectionFields(type, depth);
    if (!fields || fields.length === 0) {
      return null;
    }
    return fields.join(' ');
  }

  private buildVariables(
    argDefs: readonly GraphQLArgument[],
    args: Record<string, unknown>
  ): Record<string, unknown> {
    const variables: Record<string, unknown> = {};

    for (const argDef of argDefs) {
      if (args[argDef.name] !== undefined) {
        variables[argDef.name] = args[argDef.name];
      }
    }

    return variables;
  }

  private async buildContext(authToken?: string): Promise<object> {
    let user: AuthSession | null = null;

    if (authToken) {
      user = await this.authService.getSessionByToken(authToken);
      if (user && !this.authService.isSessionValid(user)) {
        user = null;
      }
    }

    return {
      req: {
        user,
        headers: {},
      },
    };
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
