import {
  mockFacebookPostBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FacebookPostBlock } from './facebook-post-block';

describe('FacebookPostBlock', () => {
  it('does not embed anything from Facebook', () => {
    const { container } = renderWithProviders(
      <FacebookPostBlock
        {...mockFacebookPostBlock()}
        className="facebook-post"
      />
    );

    const wrapper = container.querySelector('.facebook-post');

    expect(wrapper).toBeEmptyDOMElement();
    expect(container.querySelector('iframe, script')).toBeNull();
  });
});
