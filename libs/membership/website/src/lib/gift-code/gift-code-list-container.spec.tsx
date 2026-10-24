import { MockedProvider } from '@apollo/client/testing/react';
import { composeStories, composeStory } from '@storybook/react';
import { act, render, waitFor } from '@testing-library/react';
import { WithRouterDecorator } from '@wepublish/storybook';
import { actWait } from '@wepublish/testing';
import { mockGiftCode, mockInvoice } from '@wepublish/storybook/mocks';
import {
  CheckInvoiceStatusDocument,
  GiftCodeStatus,
  MyGiftCodesDocument,
} from '@wepublish/website/api';
import * as stories from './gift-code-list-container.stories';

const storiesCmp = composeStories(stories);

const orderedGiftCode = mockGiftCode({
  id: 'gift-ordered',
  status: GiftCodeStatus.Ordered,
  invoiceId: 'invoice-ordered',
});

const issuedGiftCode = mockGiftCode({
  id: 'gift-issued',
  status: GiftCodeStatus.Issued,
  invoiceId: 'invoice-issued',
});

describe('GiftCodeList Container', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      );

      await actWait();

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });

  it('checks the invoice of unpaid codes once and refetches the codes', async () => {
    const checkInvoiceStatus = vi.fn(() => ({
      data: {
        checkInvoiceStatus: mockInvoice({
          id: 'invoice-ordered',
          subscription: null,
          paidAt: new Date().toISOString(),
          canceledAt: null,
        }),
      },
    }));
    const myGiftCodes = vi
      .fn()
      .mockReturnValueOnce({
        data: { myGiftCodes: [orderedGiftCode, issuedGiftCode] },
      })
      .mockReturnValue({
        data: {
          myGiftCodes: [
            {
              ...orderedGiftCode,
              paid: true,
              status: GiftCodeStatus.Issued,
              code: 'ABCD-EFGH-JKMN',
            },
            issuedGiftCode,
          ],
        },
      });
    const Default = composeStory(
      {
        ...stories.Default,
        parameters: {
          apolloClient: {
            mocks: [
              {
                request: { query: MyGiftCodesDocument },
                result: myGiftCodes,
                maxUsageCount: 3,
              },
              {
                request: {
                  query: CheckInvoiceStatusDocument,
                  variables: { id: orderedGiftCode.invoiceId },
                },
                result: checkInvoiceStatus,
                maxUsageCount: 3,
              },
            ],
          },
        },
      },
      stories.default
    );

    const { findAllByText } = render(<Default />);

    await waitFor(() => expect(myGiftCodes).toHaveBeenCalledTimes(2));
    await findAllByText('ABCD-EFGH-JKMN');
    expect((await findAllByText('ABCD-EFGH-JKMN')).length).toBe(2);
    expect(checkInvoiceStatus).toHaveBeenCalledTimes(1);
  });

  it('tells the buyer that the gift code payment did not go through', async () => {
    const Empty = composeStory(
      {
        ...stories.Empty,
        decorators: [
          WithRouterDecorator({
            query: { giftCodePurchase: 'failure', error: 'Card declined' },
          }),
        ],
      },
      stories.default
    );

    const { findByRole } = render(<Empty />);
    const alert = await findByRole('alert');

    expect(alert.textContent).toContain(
      'Die Zahlung konnte nicht abgeschlossen werden.'
    );
    expect(alert.textContent).not.toContain('Card declined');
  });

  it('shows no payment failure without the failure flag', async () => {
    const Empty = composeStory(
      {
        ...stories.Empty,
        decorators: [
          WithRouterDecorator({ query: { giftCodePurchase: 'success' } }),
        ],
      },
      stories.default
    );

    const { queryByRole } = render(<Empty />);

    await actWait();

    expect(queryByRole('alert')).toBeNull();
  });
});
