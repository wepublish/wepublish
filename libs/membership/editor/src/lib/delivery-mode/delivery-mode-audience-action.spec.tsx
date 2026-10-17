import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { DeliveryModeAudienceAction } from './delivery-mode-audience-action';

const preview = vi.fn();
const mutate = vi.fn(async () => ({ data: {} }));
const mutationOptions = { current: undefined as any };

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: (_document: unknown, options?: unknown) => preview(options),
  useMutation: (_document: unknown, options?: unknown) => {
    mutationOptions.current = options;

    return [mutate, { loading: false }];
  },
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  useAuthorisation: () => true,
}));

vi.mock('./use-paper-letter-flow', () => ({
  usePaperLetterFlow: () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}));

const audience = { base: 'allUsers' } as any;

describe('DeliveryModeAudienceAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    preview.mockReturnValue({
      data: {
        deliveryModeAudiencePreview: { userCount: 12, withoutAddressCount: 3 },
      },
    });
  });

  afterEach(cleanup);

  it('previews what a switch to letters would touch', () => {
    render(<DeliveryModeAudienceAction audience={audience} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.audience.open' })
    );

    expect(preview).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: { audience, channel: 'letter' },
        skip: false,
      })
    );
    expect(
      screen.getByText(
        'deliveryMode.audience.previewLetter:{"userCount":12,"withoutAddressCount":3}'
      )
    ).toBeTruthy();
  });

  it('switches the audience once confirmed', () => {
    render(<DeliveryModeAudienceAction audience={audience} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.audience.open' })
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'deliveryMode.audience.apply' })
    );

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { audience, channel: 'letter' },
      })
    );
  });

  it('tells the caller what the switch did, so counts and lists can refresh', () => {
    const onDone = vi.fn();
    render(
      <DeliveryModeAudienceAction
        audience={audience}
        onDone={onDone}
      />
    );

    mutationOptions.current.onCompleted({
      setDeliveryModeForAudience: { changed: 3, skippedWithoutAddress: 1 },
    });

    expect(onDone).toHaveBeenCalledWith(
      { changed: 3, skippedWithoutAddress: 1 },
      'letter'
    );
  });

  it('does not ask the api while the dialog is closed', () => {
    render(<DeliveryModeAudienceAction audience={audience} />);

    expect(preview).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
  });
});
