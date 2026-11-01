import {
  selectTeaserAuthorsWithRole,
  selectTeaserLead,
  selectTeaserTarget,
  selectTeaserTitle,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import {
  TeaserSlotValue,
  useTeaserSlot,
} from '../../../contexts/teaser-slot.context';
import { TeaserCardLink, TeaserCardWrapper } from './teaser.styles';

export type TeaserConfigProps = {
  linkToRecord?: boolean;
  content: PuckSlotValue;
};

export type TeaserCardProps = PropsWithChildren<{
  className?: string;
  href?: string | null;
  target?: string;
  label?: string | null;
}>;

export const TeaserCard = ({
  className,
  href,
  target,
  label,
  children,
}: TeaserCardProps) => (
  <TeaserCardWrapper className={className}>
    {href && (
      <TeaserCardLink
        href={href}
        target={target}
        aria-label={label || href}
      />
    )}

    {children}
  </TeaserCardWrapper>
);

const useTeaserLabel = (teaser: TeaserSlotValue) => {
  const { t } = useTranslation();

  if (!teaser) {
    return '';
  }

  const title = selectTeaserTitle(teaser);
  const lead = selectTeaserLead(teaser);
  const authors = selectTeaserAuthorsWithRole(teaser);

  return t('teaser.ariaLabel', {
    hasTitle: !!title,
    title: title ?? '',
    hasLead: !!lead,
    lead: lead ?? '',
    hasAuthors: !!authors?.length,
    authors: authors?.join(', ') ?? '',
  }).trim();
};

export const TeaserRender: PuckBlockComponent<TeaserConfigProps> = ({
  props: { linkToRecord = true },
  slots,
  className,
}) => {
  const teaser = useTeaserSlot();
  const label = useTeaserLabel(teaser);

  if (!teaser) {
    return null;
  }

  return (
    <TeaserCard
      className={className}
      href={linkToRecord ? selectTeaserUrl(teaser) : undefined}
      target={selectTeaserTarget(teaser)}
      label={label}
    >
      {getSlot(slots, 'content')()}
    </TeaserCard>
  );
};
