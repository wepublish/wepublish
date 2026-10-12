import styled from '@emotion/styled';
import {
  BuilderBreakBlockProps,
  RenderRichtext,
} from '@wepublish/website/builder';
import { ReactNode } from 'react';
import { FaArrowRightLong, FaRegEnvelope, FaRegStar } from 'react-icons/fa6';
import { LuMailbox } from 'react-icons/lu';

import { BkaBlockStyle } from '../block-styles/bka-block-styles';
import { BkaCollapsibleCard } from '../cta/bka-collapsible-card';
import { BkaCtaBoxActions, BkaCtaBoxButton } from '../cta/bka-cta-box';

const icons: Record<string, ReactNode> = {
  [BkaBlockStyle.Mitglied]: <FaRegStar size={24} />,
  [BkaBlockStyle.Abo]: <LuMailbox size={22} />,
  [BkaBlockStyle.Newsletter]: <FaRegEnvelope size={22} />,
};

export const BkaBreakCard = styled(BkaCollapsibleCard)`
  position: relative;
  container-type: inline-size;
`;

export const BkaBreakBlockBody = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(2)};

  p {
    margin-bottom: ${({ theme }) => theme.spacing(2)};
    font-size: inherit;
    line-height: inherit;

    &:last-child {
      margin-bottom: 0;
    }
  }

  a {
    color: inherit;
    font-weight: 700;
    text-decoration: none;

    &:hover,
    &:focus {
      text-decoration: underline;
    }
  }

  // Move link next to the button if there's enough space
  @container (min-width: 420px) {
    p:has(> a:only-child) {
      position: absolute;
      left: 18px;
      bottom: 25px;
      margin: 0;
    }
  }
`;

export const BkaBreakBlock = ({
  text,
  richText,
  linkURL,
  linkText,
  linkTarget,
  hideButton,
  blockStyle,
  className,
}: BuilderBreakBlockProps) => (
  <BkaBreakCard
    className={className}
    title={text}
    icon={blockStyle ? icons[blockStyle] : undefined}
  >
    {richText && (
      <BkaBreakBlockBody>
        <RenderRichtext document={richText} />
      </BkaBreakBlockBody>
    )}

    {!hideButton && linkURL && linkText && (
      <BkaCtaBoxActions>
        <BkaCtaBoxButton
          variant="outlined"
          color="inherit"
          href={linkURL}
          target={linkTarget ?? undefined}
        >
          {linkText}
          <FaArrowRightLong size={20} />
        </BkaCtaBoxButton>
      </BkaCtaBoxActions>
    )}
  </BkaBreakCard>
);
