import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';

import { Alert, AlertProps } from './alert';

describe('Alert', () => {
  it.each<AlertProps['severity']>(['info', 'success', 'warning', 'error'])(
    'announces a %s message with the matching severity',
    severity => {
      renderWithProviders(
        <Alert severity={severity}>Something happened</Alert>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Something happened');
      expect(alert.className).toMatch(
        new RegExp(`MuiAlert-.*${severity}`, 'i')
      );
    }
  );
});
