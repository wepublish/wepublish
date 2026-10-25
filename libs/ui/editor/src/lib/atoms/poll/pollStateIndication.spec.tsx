import { render, screen } from '@testing-library/react';

import { PollStateIndication } from './pollStateIndication';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PollStateIndication', () => {
  it.each([
    ['closed', '2000-01-01T00:00:00.000Z', '1999-01-01T00:00:00.000Z'],
    ['open', null, '2000-01-01T00:00:00.000Z'],
    ['waiting', null, '2999-01-01T00:00:00.000Z'],
  ])(
    'can be focused so the %s tooltip opens from the keyboard',
    (state, closedAt, opensAt) => {
      render(
        <PollStateIndication
          closedAt={closedAt}
          opensAt={opensAt}
        />
      );

      expect(
        screen.getByRole('img', { name: `pollStateIndication.${state}` })
          .tabIndex
      ).toBe(0);
    }
  );
});
