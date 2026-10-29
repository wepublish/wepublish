import { act, fireEvent, render, screen } from '@testing-library/react';
import { UpdateMailProviderSettingDocument } from '@wepublish/editor/api';
import { z } from 'zod';

import { SingleGenericIntegrationForm } from './genericIntegrationForm';

const { updateSettings } = vi.hoisted(() => ({ updateSettings: vi.fn() }));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [updateSettings, { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const saveWithPort = async (typed: string) => {
  const { container } = render(
    <SingleGenericIntegrationForm
      setting={{ id: 'smtp', type: 'SMTP', smtp_port: 25 } as never}
      schema={z.object({ smtp_port: z.number().int().min(1).nullish() })}
      mutation={UpdateMailProviderSettingDocument}
      fields={[{ type: 'number', name: 'smtp_port', label: 'Port' }]}
    />
  );
  const input = container.querySelector(
    'input[name="smtp_port"]'
  ) as HTMLInputElement;

  await act(() => fireEvent.change(input, { target: { value: typed } }));
  await act(() =>
    fireEvent.click(screen.getByRole('button', { name: 'save' }))
  );
};

describe('SingleGenericIntegrationForm number fields', () => {
  beforeEach(() => updateSettings.mockReset().mockResolvedValue({}));

  it('saves a typed number as a number', async () => {
    await saveWithPort('587');

    expect(updateSettings).toHaveBeenCalledWith({
      variables: { id: 'smtp', smtp_port: 587 },
    });
  });

  it('saves an emptied number field as unset, not as 0', async () => {
    await saveWithPort('');

    expect(updateSettings).toHaveBeenCalledWith({
      variables: { id: 'smtp', smtp_port: null },
    });
  });
});
