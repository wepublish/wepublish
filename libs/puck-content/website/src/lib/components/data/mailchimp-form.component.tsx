import { useTheme } from '@mui/material';
import { PuckComponent } from '@puckeditor/core';
import { MailchimpFormBlock } from '@wepublish/block-content/website';
import { BuilderMailchimpFormBlockProps } from '@wepublish/website/builder';

import { ColorValue, resolveColor } from '@wepublish/puck-content/editor';

export type MailchimpFormConfigProps = Omit<
  BuilderMailchimpFormBlockProps,
  'buttonColor' | 'buttonFontColor'
> & {
  buttonColor?: ColorValue;
  buttonFontColor?: ColorValue;
};

export const MailchimpFormRender: PuckComponent<MailchimpFormConfigProps> = ({
  buttonColor,
  buttonFontColor,
  ...props
}) => {
  const theme = useTheme();

  return (
    <MailchimpFormBlock
      {...props}
      buttonColor={resolveColor(theme, buttonColor)}
      buttonFontColor={resolveColor(theme, buttonFontColor)}
    />
  );
};
