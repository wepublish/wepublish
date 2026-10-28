import { screen } from '@testing-library/react';
import {
  mockBildwurfBlock,
  renderWithProviders,
  TEST_SCRIPT_TEST_ID,
} from '@wepublish/mocks/website';
import { BildwurfAdBlock } from './bildwurf-ad-block';

describe('BildwurfAdBlock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the ad zone and loads the Bildwurf script', () => {
    const { container } = renderWithProviders(
      <BildwurfAdBlock {...mockBildwurfBlock({ zoneID: '77348' })} />
    );

    expect(
      container.querySelector('#bildwurf-injection-wrapper ins.aso-zone')
    ).toHaveAttribute('data-zone', '77348');
    expect(screen.getByTestId(TEST_SCRIPT_TEST_ID)).toHaveAttribute(
      'data-src',
      'https://media.online.bildwurf.ch/js/code.min.js'
    );
  });

  it('loads the ad into the zone when the Bildwurf script is already there', () => {
    const loadAd = vi.fn();
    vi.stubGlobal('_ASO', { loadAd });

    renderWithProviders(
      <BildwurfAdBlock {...mockBildwurfBlock({ zoneID: '77348' })} />
    );

    expect(loadAd).toHaveBeenCalledWith('bildwurf-injection-wrapper', '77348');
  });

  it('loads the new zone when the zone changes', () => {
    const loadAd = vi.fn();
    vi.stubGlobal('_ASO', { loadAd });

    const { rerender } = renderWithProviders(
      <BildwurfAdBlock {...mockBildwurfBlock({ zoneID: '1' })} />
    );
    rerender(<BildwurfAdBlock {...mockBildwurfBlock({ zoneID: '2' })} />);

    expect(loadAd).toHaveBeenLastCalledWith('bildwurf-injection-wrapper', '2');
  });

  it('renders the zone even before the Bildwurf script has loaded', () => {
    vi.stubGlobal('_ASO', undefined);

    const { container } = renderWithProviders(
      <BildwurfAdBlock {...mockBildwurfBlock()} />
    );

    expect(container.querySelector('ins.aso-zone')).not.toBeNull();
  });
});
