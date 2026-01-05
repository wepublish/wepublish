import { GraphQLScalarType, valueFromASTUntyped } from 'graphql';
import { is } from 'ramda';

import { Node } from 'prosemirror-model';
import { Extensions, getSchema, JSONContent } from '@tiptap/core';

const validateSchema = (doc: JSONContent, extensions: Extensions): boolean => {
  try {
    const schema = getSchema(extensions);
    const contentNode = Node.fromJSON(schema, doc);
    contentNode.check();

    return true;
  } catch (e) {
    return false;
  }
};

export const GraphQLRichText = new GraphQLScalarType({
  name: 'RichText',
  serialize(value) {
    return value;
  },

  parseValue(value) {
    return parseRichTextNode(value);
  },

  parseLiteral(literal) {
    return parseRichTextNode(valueFromASTUntyped(literal));
  },
});

export function createRichTextError(message: string, path: string[]) {
  return new Error(
    path.length > 0 ? `Error at path "${path.join('.')}": ${message}` : message
  );
}

export function parseRichTextNode(value: unknown, path: string[] = []) {
  if (!is(Object, value)) {
    throw createRichTextError(`Expected object, found ${value}.`, path);
  }

  // const valid = validateSchema(value, editorConfig.extensions ?? []);

  // if (!valid) {
  //   throw new Error();
  // }

  return value;
}
