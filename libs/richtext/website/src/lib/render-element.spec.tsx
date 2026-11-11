import '@testing-library/jest-dom/vitest';

import { render } from '@testing-library/react';
import { RichtextElements } from '@wepublish/richtext';
import {
  BuilderHeadingProps,
  BuilderParagraphProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { RenderElement } from './render-element';
import { RenderLeaf } from './render-leaf';

const Heading = ({ children, gutterBottom, ...props }: BuilderHeadingProps) => (
  <h1 {...props}>{children}</h1>
);

const Paragraph = ({
  children,
  gutterBottom,
  ...props
}: BuilderParagraphProps) => <p {...props}>{children}</p>;

const renderElement = (element: RichtextElements) =>
  render(
    <WebsiteBuilderProvider
      richtext={{ RenderElement, RenderLeaf }}
      elements={{
        H1: Heading,
        H2: Heading,
        H3: Heading,
        H4: Heading,
        H5: Heading,
        H6: Heading,
        Paragraph,
      }}
    >
      <RenderElement element={element} />
    </WebsiteBuilderProvider>
  );

const text = (value: string) =>
  ({ type: 'text', text: value }) as RichtextElements;

describe('RenderElement', () => {
  it('should render the id of a heading', () => {
    const { container } = renderElement({
      type: 'heading',
      attrs: { level: 2, id: 'my-heading' },
      content: [text('My Heading')],
    } as RichtextElements);

    expect(container.querySelector('#my-heading')).toHaveTextContent(
      'My Heading'
    );
  });

  it('should not render an id attribute when the heading has none', () => {
    const { container } = renderElement({
      type: 'heading',
      attrs: { level: 2, id: null },
      content: [text('My Heading')],
    } as RichtextElements);

    expect(container.firstElementChild).not.toHaveAttribute('id');
  });

  it('should render the text alignment of a heading', () => {
    const { container } = renderElement({
      type: 'heading',
      attrs: { level: 2, textAlign: 'center' },
      content: [text('My Heading')],
    } as RichtextElements);

    expect(container.firstElementChild).toHaveStyle({ textAlign: 'center' });
  });

  it('should render the text alignment of a paragraph', () => {
    const { container } = renderElement({
      type: 'paragraph',
      attrs: { textAlign: 'right' },
      content: [text('Some text')],
    } as RichtextElements);

    expect(container.firstElementChild).toHaveStyle({ textAlign: 'right' });
  });
});
