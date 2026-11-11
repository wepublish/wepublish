import styled from '@emotion/styled';
import {
  MailchimpFormBlock,
  MailchimpFormOptionCard,
  MailchimpFormOptionCardImage,
  MailchimpFormOptionItemImage,
} from '@wepublish/block-content/website';
import { BuilderMailchimpFormBlockProps } from '@wepublish/website/builder';

export enum TsriMailchimpFormBlockType {
  Minimal = 'NewsletterMinimal',
}

const radius = '0.75rem';

const StyledMailchimpFormBlock = styled(MailchimpFormBlock)`
  .MuiButton-root {
    padding: ${({ theme }) => theme.spacing(1, 4)};
    font-size: 16px;
    font-weight: 700;
    transition: none;
  }

  .MuiButton-contained {
    background-color: ${({ theme }) => theme.palette.primary.main};
    color: ${({ theme }) => theme.palette.common.white};

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
      color: ${({ theme }) => theme.palette.common.black};
    }
  }

  .MuiButton-outlined {
    border-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.black};

    &:hover {
      background-color: ${({ theme }) => theme.palette.primary.light};
    }
  }

  .MuiTypography-subtitle2 {
    font-weight: 700;
  }

  ${MailchimpFormOptionCard} {
    border-radius: ${radius};
  }

  ${MailchimpFormOptionCardImage} {
    border-radius: 0;
  }

  ${MailchimpFormOptionItemImage} {
    border-radius: ${radius};
  }
`;

const pill = '999px';

/**
 * Sidebar variant (Figma, TSRI-222): only a white e-mail pill and a black,
 * full width "subscribe" pill, sitting on whatever background the sidebar has.
 * The field label stays the accessible name and visually acts as placeholder.
 */
const MinimalMailchimpFormBlock = styled(StyledMailchimpFormBlock)`
  form {
    gap: ${({ theme }) => theme.spacing(1)};
  }

  .MuiInputBase-root {
    background-color: ${({ theme }) => theme.palette.common.white};
    border-radius: ${pill};
  }

  .MuiInputBase-input {
    padding: ${({ theme }) => theme.spacing(0.75, 2.5)};
    font-size: 16px;
  }

  .MuiOutlinedInput-notchedOutline {
    border: 0;
  }

  .MuiInputLabel-root:not(.MuiInputLabel-shrink) {
    transform: translate(${({ theme }) => theme.spacing(2.5)}, 6px);
    font-size: 16px;
  }

  .MuiInputLabel-shrink {
    clip-path: inset(50%);
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .MuiFormHelperText-root {
    margin-left: ${({ theme }) => theme.spacing(2.5)};
  }

  .MuiButton-root {
    border-radius: ${pill};
    padding: ${({ theme }) => theme.spacing(0.75, 2.5)};
  }

  .MuiButton-contained {
    width: 100%;
    justify-content: flex-start;
    background-color: ${({ theme }) => theme.palette.common.black};
    color: ${({ theme }) => theme.palette.common.white};
  }
`;

/**
 * The block's button colours are an editor setting, applied inline, which
 * would beat the tsri button (and its yellow hover). Tsüri's newsletter CTA
 * always follows the tsri styles, so the editor colours are dropped here.
 */
export const TsriMailchimpFormBlock = (
  props: BuilderMailchimpFormBlockProps
) => {
  const Component =
    props.blockStyle === TsriMailchimpFormBlockType.Minimal ?
      MinimalMailchimpFormBlock
    : StyledMailchimpFormBlock;

  return (
    <Component
      {...props}
      buttonColor={null}
      buttonFontColor={null}
    />
  );
};
