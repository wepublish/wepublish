import {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
  isInterfaceType,
} from 'graphql';

export interface JsonSchemaProperty {
  type?: string;
  description?: string;
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  enum?: string[];
  format?: string;
  default?: unknown;
}

const SCALAR_MAP: Record<string, JsonSchemaProperty> = {
  String: { type: 'string' },
  Int: { type: 'integer' },
  Float: { type: 'number' },
  Boolean: { type: 'boolean' },
  ID: { type: 'string' },
  DateTime: { type: 'string', format: 'date-time' },
  Date: { type: 'string', format: 'date' },
  Slug: { type: 'string', description: 'URL slug' },
  Color: { type: 'string', description: 'Hex color (e.g. #FF0000)' },
  RichText: {
    type: 'array',
    description: 'Rich text content as Slate.js JSON blocks',
  },
  Upload: {
    type: 'string',
    description: 'File upload (not supported via MCP)',
  },
  VoteValue: { type: 'string' },
  GraphQLSettingValueType: {},
};

function scalarToJsonSchema(type: GraphQLScalarType): JsonSchemaProperty {
  return (
    SCALAR_MAP[type.name] ?? {
      type: 'string',
      description: `Scalar: ${type.name}`,
    }
  );
}

function graphqlTypeToJsonSchema(
  type: GraphQLType,
  visited: Set<string> = new Set()
): JsonSchemaProperty {
  if (isNonNullType(type)) {
    return graphqlTypeToJsonSchema(
      (type as GraphQLNonNull<GraphQLType>).ofType,
      visited
    );
  }

  if (isListType(type)) {
    return {
      type: 'array',
      items: graphqlTypeToJsonSchema(
        (type as GraphQLList<GraphQLType>).ofType,
        new Set(visited)
      ),
    };
  }

  if (isScalarType(type)) {
    return scalarToJsonSchema(type);
  }

  if (isEnumType(type)) {
    const enumType = type as GraphQLEnumType;
    return {
      type: 'string',
      enum: enumType.getValues().map(v => v.value),
      description: enumType.description || undefined,
    };
  }

  if (isInputObjectType(type)) {
    const inputType = type as GraphQLInputObjectType;
    if (visited.has(inputType.name)) {
      return {
        type: 'object',
        description: `Circular reference: ${inputType.name}`,
      };
    }

    const nextVisited = new Set(visited);
    nextVisited.add(inputType.name);

    const fields = inputType.getFields();
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const [name, field] of Object.entries(fields)) {
      if (isNonNullType(field.type)) {
        required.push(name);
      }
      const prop = graphqlTypeToJsonSchema(field.type, new Set(nextVisited));
      if (field.description) {
        prop.description = field.description;
      }
      if (field.defaultValue !== undefined) {
        prop.default = field.defaultValue;
      }
      properties[name] = prop;
    }

    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
      ...(inputType.description ? { description: inputType.description } : {}),
    };
  }

  return {};
}

export function buildArgsJsonSchema(
  args: readonly GraphQLArgument[]
): JsonSchemaProperty {
  if (args.length === 0) {
    return { type: 'object', properties: {} };
  }

  const properties: Record<string, JsonSchemaProperty> = {};
  const required: string[] = [];

  for (const arg of args) {
    if (isNonNullType(arg.type)) {
      required.push(arg.name);
    }
    const prop = graphqlTypeToJsonSchema(arg.type);
    if (arg.description) {
      prop.description = arg.description;
    }
    if (arg.defaultValue !== undefined) {
      prop.default = arg.defaultValue;
    }
    properties[arg.name] = prop;
  }

  return {
    type: 'object',
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

export function buildSelectionFields(
  type: GraphQLType,
  depth: number,
  visited: Set<string> = new Set()
): string[] | null {
  // Unwrap NonNull/List wrappers
  if (isNonNullType(type)) {
    return buildSelectionFields(
      (type as GraphQLNonNull<GraphQLType>).ofType,
      depth,
      visited
    );
  }
  if (isListType(type)) {
    return buildSelectionFields(
      (type as GraphQLList<GraphQLType>).ofType,
      depth,
      visited
    );
  }

  if (isScalarType(type) || isEnumType(type)) {
    return null; // Leaf type, no sub-selection needed
  }

  // Object types and interface types
  if (isObjectType(type) || isInterfaceType(type)) {
    if (visited.has(type.name) || depth <= 0) {
      return null;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(type.name);

    const fields = type.getFields();
    const selections: string[] = [];

    for (const [name, field] of Object.entries(fields)) {
      const fieldType = field.type;
      const unwrapped = unwrapType(fieldType);

      if (isScalarType(unwrapped) || isEnumType(unwrapped)) {
        selections.push(name);
      } else if (depth > 1) {
        const subFields = buildSelectionFields(
          fieldType,
          depth - 1,
          new Set(nextVisited)
        );
        if (subFields && subFields.length > 0) {
          selections.push(`${name} { ${subFields.join(' ')} }`);
        }
      }
    }

    return selections;
  }

  // Union types
  if (isUnionType(type)) {
    if (visited.has(type.name) || depth <= 0) {
      return null;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(type.name);

    const possibleTypes = type.getTypes();
    const fragments: string[] = [];

    for (const possibleType of possibleTypes) {
      const subFields = buildSelectionFields(
        possibleType,
        depth - 1,
        new Set(nextVisited)
      );
      if (subFields && subFields.length > 0) {
        fragments.push(
          `... on ${possibleType.name} { ${subFields.join(' ')} }`
        );
      }
    }

    return fragments;
  }

  return null;
}

function unwrapType(type: GraphQLType): GraphQLType {
  if (isNonNullType(type)) {
    return unwrapType((type as GraphQLNonNull<GraphQLType>).ofType);
  }
  if (isListType(type)) {
    return unwrapType((type as GraphQLList<GraphQLType>).ofType);
  }
  return type;
}
