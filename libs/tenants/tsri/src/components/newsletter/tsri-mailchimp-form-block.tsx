import styled from '@emotion/styled';
import {
  MailchimpFormBlock,
  MailchimpFormOptionCard,
  MailchimpFormOptionCardImage,
  MailchimpFormOptionItemImage,
} from '@wepublish/block-content/website';
import { BuilderMailchimpFormBlockProps } from '@wepublish/website/builder';

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

/**
 * The block's button colours are an editor setting, applied inline, which
 * would beat the tsri button (and its yellow hover). Tsüri's newsletter CTA
 * is always the tsri blue one, so the editor colours are dropped here.
 */
export const TsriMailchimpFormBlock = (
  props: BuilderMailchimpFormBlockProps
) => (
  <StyledMailchimpFormBlock
    {...props}
    buttonColor={null}
    buttonFontColor={null}
  />
);
