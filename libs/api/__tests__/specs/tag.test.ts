import { CreateTag, DeleteTag, TagList, TagType } from '../api/private';

import { ApolloServer } from 'apollo-server-express';
import { UpdateTag } from '../api/private/index';
import {
  createGraphQLTestClientWithPrisma,
  generateRandomString,
} from '../utility';

let testClientPrivate: ApolloServer;

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma();
    testClientPrivate = setupClient.testServerPrivate;
  } catch (error) {
    console.log('Error', error);
    throw new Error('Error during test setup');
  }
});

describe('Tags', () => {
  test('can be created', async () => {
    const res = await testClientPrivate.executeOperation({
      query: CreateTag,
      variables: {
        tag: generateRandomString(),
        description: [],
        type: TagType.Comment,
        main: false,
        color: '#FFFFFF',
      },
    });

    expect(res).toMatchSnapshot({
      data: {
        createTag: {
          id: expect.any(String),
          tag: expect.any(String),
          description: expect.any(Array),
          type: expect.any(String),
          main: expect.any(Boolean),
          color: expect.any(String),
        },
      },
    });
  });

  test('can be updated', async () => {
    const createRes = await testClientPrivate.executeOperation({
      query: CreateTag,
      variables: {
        tag: generateRandomString(),
        type: TagType.Comment,
      },
    });

    const tag = generateRandomString();

    const res = await testClientPrivate.executeOperation({
      query: UpdateTag,
      variables: {
        id: createRes.data.createTag.id,
        tag,
        description: [],
        type: TagType.Comment,
        main: false,
        color: '#FFFFFF',
      },
    });

    expect(res.data.updateTag.tag).toEqual(tag);
  });

  describe('delete', () => {
    test('can be deleted', async () => {
      const createRes = await testClientPrivate.executeOperation({
        query: CreateTag,
        variables: {
          name: generateRandomString(),
          type: TagType.Comment,
        },
      });

      const res = await testClientPrivate.executeOperation({
        query: DeleteTag,
        variables: {
          id: createRes.data.createTag.id,
        },
      });

      expect(res.data.deleteTag.id).toEqual(createRes.data.createTag.id);
    });
  });

  describe('query', () => {
    describe('private', () => {
      test('can query a list of tags', async () => {
        await Promise.all([
          testClientPrivate.executeOperation({
            query: CreateTag,
            variables: {
              tag: generateRandomString(),
              type: TagType.Comment,
            },
          }),
          testClientPrivate.executeOperation({
            query: CreateTag,
            variables: {
              tag: generateRandomString(),
              type: TagType.Event,
            },
          }),
        ]);

        const res = await testClientPrivate.executeOperation({
          query: TagList,
        });

        expect(res.data.tags.totalCount).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
