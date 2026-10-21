import { ApolloClient, InMemoryCache } from '@apollo/client';
import { MockLink } from '@apollo/client/testing';
import {
  BannerDocumentType,
  ChallengeDocument,
  CheckLoginOtpDocument,
  PeerProfileDocument,
  PrimaryBannerDocument,
  SettingListDocument,
  possibleTypes,
  SettingName,
} from '@wepublish/website/api';
import {
  mockChallengeQuery,
  mockCheckLoginOtpQuery,
  mockMutationResult,
  mockOperation,
  mockPeerProfileQuery,
  mockPrimaryBannerQuery,
  mockSettingListQuery,
} from './apollo';
import { mockBanner } from './banner';
import { mockChallenge } from './challenge';
import { mockPeerProfile } from './peer';
import { mockSetting } from './setting';

const clientFor = (mocks: ReadonlyArray<MockLink.MockedResponse>) =>
  new ApolloClient({
    cache: new InMemoryCache({ possibleTypes: possibleTypes.possibleTypes }),
    link: new MockLink(mocks, {
      showWarnings: false,
      defaultOptions: { delay: 0 },
    }),
  });

const bannerVariables = (documentId: string) => ({
  documentId,
  documentType: BannerDocumentType.Article,
  loggedIn: false,
  hasSubscription: false,
  hasPaywallBypass: false,
});

describe('mockOperation', () => {
  it('answers an operation with exactly the given variables once', async () => {
    const client = clientFor([
      mockOperation(CheckLoginOtpDocument, {
        variables: { email: 'foo@bar.ch' },
        data: { __typename: 'Query', checkLoginOtp: true },
      }),
    ]);

    const { data } = await client.query({
      query: CheckLoginOtpDocument,
      variables: { email: 'foo@bar.ch' },
    });

    expect(data?.checkLoginOtp).toBe(true);
    await expect(
      client.query({
        query: CheckLoginOtpDocument,
        variables: { email: 'foo@bar.ch' },
        fetchPolicy: 'network-only',
      })
    ).rejects.toThrow('No more mocked responses');
  });

  it('does not answer an operation with other variables', async () => {
    const client = clientFor([
      mockOperation(CheckLoginOtpDocument, {
        variables: { email: 'foo@bar.ch' },
        data: { __typename: 'Query', checkLoginOtp: true },
      }),
    ]);

    await expect(
      client.query({
        query: CheckLoginOtpDocument,
        variables: { email: 'other@bar.ch' },
      })
    ).rejects.toThrow('No more mocked responses');
  });

  it('answers an operation with GraphQL errors', async () => {
    const client = clientFor([
      mockOperation(ChallengeDocument, {
        errors: [{ message: 'Something went wrong.' }],
      }),
    ]);

    await expect(client.query({ query: ChallengeDocument })).rejects.toThrow(
      'Something went wrong.'
    );
  });
});

describe('query mocks', () => {
  it('answers the settings as often as they are asked for', async () => {
    const setting = mockSetting({ name: SettingName.AllowGuestPollVoting });
    const client = clientFor([mockSettingListQuery([setting])]);

    for (let i = 0; i < 2; i++) {
      const { data } = await client.query({
        query: SettingListDocument,
        fetchPolicy: 'network-only',
      });

      expect(data?.settings).toEqual([setting]);
    }
  });

  it('answers every primary banner request, whatever the variables', async () => {
    const banner = mockBanner();
    const client = clientFor([mockPrimaryBannerQuery(banner)]);

    for (const documentId of ['', 'article-1']) {
      const { data } = await client.query({
        query: PrimaryBannerDocument,
        variables: bannerVariables(documentId),
      });

      expect(data?.primaryBanner?.id).toBe(banner.id);
    }
  });

  it('answers without a banner by default', async () => {
    const client = clientFor([mockPrimaryBannerQuery()]);

    const { data } = await client.query({
      query: PrimaryBannerDocument,
      variables: bannerVariables(''),
    });

    expect(data?.primaryBanner).toBeNull();
  });

  it('answers the challenge and the peer profile with the shared factories', async () => {
    const client = clientFor([mockChallengeQuery(), mockPeerProfileQuery()]);

    const challenge = await client.query({ query: ChallengeDocument });
    const peerProfile = await client.query({ query: PeerProfileDocument });

    expect(challenge.data?.challenge).toEqual(mockChallenge());
    expect(peerProfile.data?.peerProfile.name).toBe(mockPeerProfile().name);
  });

  it('answers every login OTP check as not required by default', async () => {
    const client = clientFor([mockCheckLoginOtpQuery()]);

    for (const email of ['foo@bar.c', 'foo@bar.ch']) {
      const { data } = await client.query({
        query: CheckLoginOtpDocument,
        variables: { email },
      });

      expect(data?.checkLoginOtp).toBe(false);
    }
  });
});

describe('mockMutationResult', () => {
  it('describes a mutation that has not been called yet', () => {
    const result = mockMutationResult();

    expect(result).toMatchObject({
      called: false,
      loading: false,
      data: undefined,
      error: undefined,
    });
    expect(result.client).toBeInstanceOf(ApolloClient);
  });

  it('takes the state a test wants to show', () => {
    const error = new Error('Something went wrong.');

    expect(mockMutationResult({ called: true, error })).toMatchObject({
      called: true,
      loading: false,
      error,
    });
  });
});
