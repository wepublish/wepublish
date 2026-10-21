import { screen } from '@testing-library/react';
import {
  mockChallenge,
  mockCrowdfunding,
  mockCrowdfundingBlock,
  mockCrowdfundingGoal,
  mockEvent,
  mockEventBlock,
  mockFlexBlock,
  mockImage,
  mockImageBlock,
  mockPoll,
  mockPollBlock,
  mockQuoteBlock,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockSubscribeBlock,
  mockTitleBlock,
  mockBlockWithAlignment,
  createPollBlockContext,
  createSubscribeBlockContext,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import {
  BuilderFlexBlockProps,
  BuilderTitleBlockProps,
} from '@wepublish/website/builder';
import { t } from 'i18next';
import { Blocks } from './blocks';

const loaded = <TData,>(data: TData) => ({
  data,
  loading: false,
  error: undefined,
});

const imageBlock = (description: string) =>
  mockImageBlock({ image: mockImage({ description }) });

describe('Blocks', () => {
  it('renders every kind of block in order', () => {
    renderWithProviders(
      <Blocks
        type="Article"
        blocks={[
          mockTitleBlock({ title: 'Article title' }),
          mockRichTextBlock({ richText: mockRichTextParagraph('Body text') }),
          mockQuoteBlock({ quote: 'A quote', image: null }),
          mockPollBlock({
            poll: mockPoll({ question: 'Poll question?', closedAt: null }),
          }),
          mockEventBlock({ events: [mockEvent({ name: 'Concert' })] }),
          mockCrowdfundingBlock({
            crowdfunding: mockCrowdfunding({
              activeGoal: mockCrowdfundingGoal({ title: 'Crowdfunding goal' }),
            }),
          }),
          mockFlexBlock({
            blocks: [
              mockBlockWithAlignment({
                block: mockTitleBlock({ title: 'Nested title' }),
              }),
            ],
          }),
          mockSubscribeBlock(),
        ]}
      />,
      {
        poll: createPollBlockContext(),
        subscribeBlock: createSubscribeBlockContext({
          challenge: loaded({
            __typename: 'Query',
            challenge: mockChallenge(),
          }),
          userInvoices: loaded({ __typename: 'Query', userInvoices: [] }),
          userSubscriptions: loaded({
            __typename: 'Query',
            userSubscriptions: [],
          }),
        }),
      }
    );

    const blockHeadings = [
      'Article title',
      'Poll question?',
      'Concert',
      'Nested title',
      t('subscribe.chooseSubscription'),
    ];

    expect(
      screen
        .getAllByRole('heading')
        .map(heading => heading.textContent)
        .filter(text => blockHeadings.includes(text ?? ''))
    ).toEqual(blockHeadings);
    expect(screen.getByText('Body text')).toBeInTheDocument();
    expect(screen.getByText('A quote')).toBeInTheDocument();
    expect(screen.getByText('Crowdfunding goal')).toBeInTheDocument();
  });

  it('loads the images of the first three blocks eagerly', () => {
    renderWithProviders(
      <Blocks
        type="Article"
        blocks={[
          imageBlock('First'),
          imageBlock('Second'),
          imageBlock('Third'),
          imageBlock('Fourth'),
        ]}
      />
    );

    expect(
      screen
        .getAllByRole('img')
        .map(img => [img.getAttribute('alt'), img.getAttribute('loading')])
    ).toEqual([
      ['First', 'eager'],
      ['Second', 'eager'],
      ['Third', 'eager'],
      ['Fourth', 'lazy'],
    ]);
  });

  it('renders the blocks a tenant overrides', () => {
    const Title = ({ title }: BuilderTitleBlockProps) => (
      <h1>Tenant {title}</h1>
    );

    renderWithProviders(
      <Blocks
        type="Page"
        blocks={[mockTitleBlock({ title: 'Page title' })]}
      />,
      { builder: { blocks: { Title } } }
    );

    expect(
      screen.getByRole('heading', { name: 'Tenant Page title' })
    ).toBeInTheDocument();
  });

  it('tells a flex block which type of content it is nested in', () => {
    const FlexBlock = vi.fn((_: BuilderFlexBlockProps) => null);

    renderWithProviders(
      <Blocks
        type="Article"
        blocks={[mockFlexBlock()]}
      />,
      { builder: { blocks: { FlexBlock } } }
    );

    expect(FlexBlock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Article' }),
      undefined
    );
  });

  it('marks a missing block', () => {
    renderWithProviders(
      <Blocks
        type="Page"
        blocks={[null as unknown as FullBlockFragment]}
      />
    );

    expect(screen.getByText('empty block')).toBeInTheDocument();
  });
});
