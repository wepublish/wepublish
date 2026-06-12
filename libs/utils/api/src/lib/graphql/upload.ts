import { GraphQLError, GraphQLScalarType } from 'graphql';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

export type { FileUpload } from 'graphql-upload/processRequest.mjs';

interface MultipartUploadValue {
  promise: Promise<FileUpload>;
}

function hasUploadPromise(value: unknown): value is MultipartUploadValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'promise' in value &&
    typeof (value as { promise?: { then?: unknown } }).promise?.then ===
      'function'
  );
}

export const GraphQLUpload = new GraphQLScalarType<Promise<FileUpload>, never>({
  name: 'Upload',
  description: 'The `Upload` scalar type represents a file upload.',

  parseValue(value) {
    if (hasUploadPromise(value)) {
      return value.promise;
    }

    throw new GraphQLError('Upload value invalid.');
  },

  parseLiteral(node) {
    throw new GraphQLError('Upload literal unsupported.', { nodes: node });
  },

  serialize() {
    throw new GraphQLError('Upload serialization unsupported.');
  },
});
