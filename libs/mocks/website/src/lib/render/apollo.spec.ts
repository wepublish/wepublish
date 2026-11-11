import { gql, InMemoryCache } from '@apollo/client';
import { mockOperation } from '../apollo';
import {
  ChallengeDocument,
  RequestEmailChangeDocument,
} from '@wepublish/website/api';
import { FragmentDefinitionNode, Kind } from 'graphql';
import { createTestApolloClient } from './apollo';

const query = gql`
  query TestingProbe($id: String!) {
    probe(id: $id) {
      id
    }
  }
`;

const result = {
  data: { probe: { __typename: 'Probe', id: '1' } },
};

describe('createTestApolloClient', () => {
  it('answers a matching operation', async () => {
    const { client, assertAllOperationsMocked } = createTestApolloClient({
      mocks: [{ request: { query, variables: { id: '1' } }, result }],
    });

    const response = await client.query({ query, variables: { id: '1' } });

    expect(response.data).toEqual(result.data);
    await expect(assertAllOperationsMocked()).resolves.toBeUndefined();
  });

  it('reports every operation that had no mock', async () => {
    const { client, assertAllOperationsMocked } = createTestApolloClient({
      mocks: [{ request: { query, variables: { id: '1' } }, result }],
    });

    await client.query({ query, variables: { id: '2' } }).catch(() => null);

    await expect(assertAllOperationsMocked()).rejects.toThrow(
      /TestingProbe[\s\S]*No more mocked responses[\s\S]*"id":"2"/
    );
  });

  it('delivers query errors alongside the data like the website client', async () => {
    const { client } = createTestApolloClient({
      mocks: [
        mockOperation(ChallengeDocument, {
          errors: [{ message: 'Something went wrong.' }],
        }),
      ],
    });

    const response = await client.query({ query: ChallengeDocument });

    expect(response.error?.message).toBe('Something went wrong.');
  });

  it('rejects mutations that answer with errors like the website client', async () => {
    const { client } = createTestApolloClient({
      mocks: [
        mockOperation(RequestEmailChangeDocument, {
          variables: { newEmail: 'foo@bar.ch' },
          errors: [{ message: 'Something went wrong.' }],
        }),
      ],
    });

    await expect(
      client.mutate({
        mutation: RequestEmailChangeDocument,
        variables: { newEmail: 'foo@bar.ch' },
      })
    ).rejects.toThrow('Something went wrong.');
  });

  it('matches union and interface fragments', () => {
    const { client } = createTestApolloClient();
    const [fragment] = gql`
      fragment Probe on BlockContent {
        __typename
      }
    `.definitions;

    expect(fragment.kind).toBe(Kind.FRAGMENT_DEFINITION);
    expect(
      (client.cache as InMemoryCache).policies.fragmentMatches(
        fragment as FragmentDefinitionNode,
        'RichTextBlock'
      )
    ).toBe(true);
  });
});
