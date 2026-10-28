import { screen, waitFor } from '@testing-library/react';
import {
  mockAnnouncementPrompt,
  mockEngagementPrompt,
  mockOperation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BYPASS_COOKIE_KEY } from '@wepublish/paywall/website';
import {
  BannerDocumentType,
  EngagementDocumentType,
  EngagementPromptsDocument,
  EngagementPromptsQueryVariables,
  FullEngagementPromptFragment,
} from '@wepublish/website/api';
import { BannerContainer } from './banner-container';

let requested: EngagementPromptsQueryVariables[];

/** The prompts of the page, recording what the container asked for. */
const engagementPrompts = (prompts: FullEngagementPromptFragment[]) =>
  mockOperation(EngagementPromptsDocument, {
    variables: (variables: EngagementPromptsQueryVariables) => {
      requested.push(variables);

      return true;
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', engagementPrompts: prompts },
  });

const renderContainer = (options: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <BannerContainer
      documentType={BannerDocumentType.Article}
      documentId="1"
    />,
    options
  );

describe('BannerContainer', () => {
  beforeEach(() => {
    requested = [];
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = `${BYPASS_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });

  it('shows the banner prompt of an article', async () => {
    renderContainer({ mocks: [engagementPrompts([mockAnnouncementPrompt()])] });

    expect(
      await screen.findByText('Our annual crowdfunding')
    ).toBeInTheDocument();
    expect(requested[0]).toMatchObject({
      documentId: '1',
      documentType: EngagementDocumentType.Article,
    });
  });

  it('shows a pop-up prompt as modal', async () => {
    renderContainer({ mocks: [engagementPrompts([mockEngagementPrompt()])] });

    expect(
      await screen.findByText('Enjoying our journalism?')
    ).toBeInTheDocument();
  });

  it('tells the API about a paywall bypass', async () => {
    document.cookie = `${BYPASS_COOKIE_KEY}=token; path=/`;

    renderContainer({ mocks: [engagementPrompts([])] });

    await waitFor(() =>
      expect(requested).toContainEqual(
        expect.objectContaining({ paywallBypassToken: 'token' })
      )
    );
  });

  it('asks for nothing on pages without a document id', async () => {
    renderWithProviders(
      <BannerContainer documentType={BannerDocumentType.Page} />,
      { mocks: [engagementPrompts([mockAnnouncementPrompt()])] }
    );

    await waitFor(() => expect(requested).toEqual([]));
    expect(screen.queryByText('Our annual crowdfunding')).toBeNull();
  });
});
