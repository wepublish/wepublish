import { screen } from '@testing-library/react';
import { mockIFrameBlock, renderWithProviders } from '@wepublish/mocks/website';
import { IFrameBlock } from './iframe-block';

describe('IFrameBlock', () => {
  it('embeds the url with its title and size', () => {
    renderWithProviders(
      <IFrameBlock
        {...mockIFrameBlock({
          url: 'https://www.example.com/embed',
          title: 'Wahlkarte',
          width: 560,
          height: 314,
        })}
      />
    );

    const iframe = screen.getByTitle('Wahlkarte');

    expect(iframe).toHaveAttribute('src', 'https://www.example.com/embed');
    expect(iframe).toHaveAttribute('width', '560');
    expect(iframe).toHaveAttribute('height', '314');
    expect(iframe).toHaveAttribute('allowfullscreen');
  });

  it('sandboxes the iframe when a sandbox is configured', () => {
    renderWithProviders(
      <IFrameBlock {...mockIFrameBlock({ sandbox: 'allow-scripts' })} />
    );

    expect(screen.getByTitle('Title')).toHaveAttribute(
      'sandbox',
      'allow-scripts'
    );
  });

  it('does not sandbox the iframe when the sandbox is empty', () => {
    renderWithProviders(<IFrameBlock {...mockIFrameBlock({ sandbox: '' })} />);

    expect(screen.getByTitle('Title')).not.toHaveAttribute('sandbox');
  });

  it('applies the custom style to the iframe', () => {
    renderWithProviders(
      <IFrameBlock
        {...mockIFrameBlock({ styleCustom: 'background: rgb(170, 170, 170);' })}
      />
    );

    expect(screen.getByTitle('Title')).toHaveStyle({
      background: 'rgb(170, 170, 170)',
    });
  });

  it('renders no iframe without a url', () => {
    const { container } = renderWithProviders(
      <IFrameBlock {...mockIFrameBlock({ url: null })} />
    );

    expect(container.querySelector('iframe')).toBeNull();
  });
});
