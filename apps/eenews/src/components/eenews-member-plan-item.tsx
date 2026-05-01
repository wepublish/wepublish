import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { toPlaintext } from '@wepublish/richtext';
import { BuilderMemberPlanItemProps } from '@wepublish/website/builder';
import { forwardRef } from 'react';

import { eenewsColors } from '../theme';

/**
 * EE News v2 plan card. Replaces the wepublish default `MemberPlanItem`
 * (a Radio + plain text). Renders the full v2 plan visual: eyebrow + slug
 * label + name (display H3) + plain-text description + amount block + payment
 * methods chips + bottom CTA-like style.
 *
 * Featured state: the plan whose slug includes "support" (or is the middle
 * one) is rendered in dark/featured form via the `data-featured` attribute
 * derived from the `tags` array containing 'featured' OR by index in the
 * MemberPlanPicker. Wepublish's default MemberPlanItem doesn't expose index,
 * so we lean on a `featured` tag the seed sets.
 */
const Card = styled('article')<{ featured?: boolean; checked?: boolean }>`
  background: ${({ featured }) =>
    featured ? eenewsColors.ink : eenewsColors.paper};
  color: ${({ featured }) =>
    featured ? eenewsColors.paper : eenewsColors.ink};
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  border: 1px solid ${eenewsColors.ruleStrong};
  cursor: pointer;
  outline: ${({ checked }) =>
    checked ? `3px solid ${eenewsColors.accentDeep}` : 'none'};
  outline-offset: -3px;
  transition: outline-color 0.15s ease;
`;

// styled(Typography) drops MUI's OverridableComponent generic — use styled('div')
// wrappers + plain <Typography variant component sx> inside.
const EyebrowRow = styled('div')<{ featured?: boolean }>`
  color: ${({ featured }) =>
    featured ? 'rgba(245,240,230,0.6)' : eenewsColors.inkSoft};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled('span')`
  padding: 2px 8px;
  background: ${eenewsColors.accent};
  color: ${eenewsColors.ink};
  border-radius: 999px;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family: inherit;
`;

// styled wrappers replaced by inline Typography sx — see comment above.

const Amount = styled('div')<{ featured?: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding-top: 20px;
  margin-top: 8px;
  border-top: 1px solid
    ${({ featured }) =>
      featured ? 'rgba(245,240,230,0.18)' : eenewsColors.rule};
`;

// Currency / Num / Per labels are emitted inline via Typography variant + sx
// inside the Amount block — see render below.

const PayRow = styled('div')`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const Pm = styled('span')<{ featured?: boolean }>`
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ featured }) =>
    featured ? 'rgba(245,240,230,0.6)' : eenewsColors.inkSoft};
  padding: 4px 8px;
  border: 1px solid
    ${({ featured }) =>
      featured ? 'rgba(245,240,230,0.18)' : eenewsColors.rule};
  border-radius: 4px;
  font-family: inherit;
`;

export const EenewsMemberPlanItem = forwardRef<
  HTMLDivElement,
  BuilderMemberPlanItemProps & { className?: string; name?: string }
>(function EenewsMemberPlanItem(props, ref) {
  const {
    slug,
    amountPerMonthMin,
    amountPerMonthMax,
    currency,
    shortDescription,
    tags,
    name,
    checked,
    onChange,
    className,
  } = props;
  const featured = (tags ?? []).some(t => t.toLowerCase() === 'featured');
  const minMajor = Math.round(amountPerMonthMin / 100);
  const description = toPlaintext(shortDescription) ?? '';
  const eyebrowLabel =
    slug?.toLowerCase().includes('lesen') ? 'Lesen'
    : (
      slug?.toLowerCase().includes('tragen') ||
      slug?.toLowerCase().includes('solidarit')
    ) ?
      'Solidarität'
    : featured ? 'Empfohlen'
    : 'Beitrag';

  return (
    <Card
      ref={ref}
      featured={featured}
      checked={!!checked}
      className={className}
      onClick={() =>
        onChange?.({ target: { value: props.value } } as never, true)
      }
    >
      <EyebrowRow featured={featured}>
        <Typography
          variant="metaEyebrow"
          component="span"
        >
          {eyebrowLabel}
        </Typography>
        {featured ?
          <Badge>Crowdfunding</Badge>
        : null}
      </EyebrowRow>
      <Typography
        variant="displayTeaserLg"
        component="h3"
        sx={{
          margin: 0,
          color: featured ? eenewsColors.paper : eenewsColors.ink,
        }}
      >
        {name ?? slug}
      </Typography>
      {description ?
        <Typography
          variant="bodyTeaserStandard"
          component="p"
          sx={{
            margin: 0,
            maxWidth: '36ch',
            color: featured ? 'rgba(245,240,230,0.6)' : eenewsColors.inkSoft,
          }}
        >
          {description}
        </Typography>
      : null}
      <Amount featured={featured}>
        <Typography
          variant="metaInline"
          component="span"
          sx={{
            color: featured ? 'rgba(245,240,230,0.6)' : eenewsColors.inkSoft,
          }}
        >
          {currency}
        </Typography>
        <Typography
          variant="displayTeaserLg"
          component="span"
          sx={{
            margin: 0,
            fontSize: 72,
            lineHeight: 0.9,
            letterSpacing: '-0.025em',
            fontWeight: 350,
            color: featured ? eenewsColors.paper : eenewsColors.ink,
          }}
        >
          {minMajor}
        </Typography>
        <Typography
          variant="metaInline"
          component="span"
          sx={{
            alignSelf: 'end',
            paddingBottom: '6px',
            color: featured ? 'rgba(245,240,230,0.6)' : eenewsColors.inkSoft,
          }}
        >
          {amountPerMonthMax && amountPerMonthMax > amountPerMonthMin ?
            '/ Monat oder mehr'
          : '/ Monat'}
        </Typography>
      </Amount>
      <PayRow>
        {/* Payment-method chips would come from MemberPlan.availablePaymentMethods —
            wepublish currently doesn't pass that into BuilderMemberPlanItemProps,
            so we display a static set as a v2 placeholder. */}
        {['Twint', 'Karte', 'SEPA'].map(pm => (
          <Pm
            key={pm}
            featured={featured}
          >
            {pm}
          </Pm>
        ))}
      </PayRow>
    </Card>
  );
});
