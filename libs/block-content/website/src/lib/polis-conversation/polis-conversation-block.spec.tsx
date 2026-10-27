import {
  mockPolisConversationBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { PolisConversationBlock } from './polis-conversation-block';

describe('PolisConversationBlock', () => {
  it('does not embed the conversation', () => {
    const { container } = renderWithProviders(
      <PolisConversationBlock
        {...mockPolisConversationBlock()}
        className="polis"
      />
    );

    expect(container.querySelector('.polis')).toBeEmptyDOMElement();
    expect(container.querySelector('iframe, script')).toBeNull();
  });
});
