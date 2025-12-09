import { ComponentConfig } from '@measured/puck';
import { BuilderRichTextBlockProps } from '@wepublish/website/builder';
import { richTextField } from '../fields/richtext';
import { RichTextBlock } from '@wepublish/block-content/website';
import { mockRichText } from '@wepublish/storybook/mocks';

export const RichTextConfig: ComponentConfig<BuilderRichTextBlockProps> = {
  fields: {
    richText: richTextField,
  },
  defaultProps: {
    richText: mockRichText(),
  },
  inline: true,
  render: RichTextBlock,
};
