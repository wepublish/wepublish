import { render, screen } from '@testing-library/react';
import { ReactElement } from 'react';

import { conditionField, NO_CONDITION } from './condition-field';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('./merge-tags', async importOriginal => ({
  ...(await importOriginal<typeof import('./merge-tags')>()),
  loadMergeTags: vi.fn(() => new Promise(() => undefined)),
}));

describe('conditionField', () => {
  it('names the comparison and the value', () => {
    render(
      conditionField('Condition').render({
        value: NO_CONDITION,
        onChange: vi.fn(),
        id: 'condition',
      } as never) as ReactElement
    );

    expect(
      screen.getByRole('combobox', { name: 'newsletter.condition.operator' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'newsletter.condition.value' })
    ).toBeTruthy();
  });

  it('names the field picker after the field', () => {
    render(
      conditionField('Condition').render({
        value: NO_CONDITION,
        onChange: vi.fn(),
        id: 'condition',
      } as never) as ReactElement
    );

    expect(screen.getByRole('combobox', { name: 'Condition' })).toBeTruthy();
  });
});
