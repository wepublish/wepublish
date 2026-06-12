import { Kind } from 'graphql';
import { GraphQLUpload } from './upload';

describe('GraphQLUpload', () => {
  it('returns the upload promise from multipart parser values', () => {
    const uploadPromise = Promise.resolve({
      filename: 'image.png',
      mimetype: 'image/png',
      encoding: '7bit',
      createReadStream: jest.fn(),
    });

    expect(GraphQLUpload.parseValue({ promise: uploadPromise })).toBe(
      uploadPromise
    );
  });

  it('rejects values that are not multipart upload promises', () => {
    expect(() => GraphQLUpload.parseValue({})).toThrow('Upload value invalid.');
  });

  it('does not support inline literals', () => {
    expect(() =>
      GraphQLUpload.parseLiteral({ kind: Kind.STRING, value: 'file' }, {})
    ).toThrow('Upload literal unsupported.');
  });
});
