import styled from '@emotion/styled';
import { Radio, Typography } from '@mui/material';
import { BuilderMemberPlanItemProps } from '@wepublish/website/builder';

const PlanCard = styled('label', {
  shouldForwardProp: p => p !== 'selected',
})<{ selected?: boolean }>`
  position: relative;
  background: ${({ theme, selected }) =>
    selected ? theme.palette.primary.main : theme.palette.background.paper};
  color: ${({ theme, selected }) =>
    selected ? theme.palette.background.paper : theme.palette.primary.main};
  border: ${({ theme, selected }) =>
    selected ?
      `2px solid ${theme.palette.primary.main}`
    : `1.5px solid ${theme.palette.primary.main}`};
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition:
    background 160ms ease,
    color 160ms ease;
`;

const CardFooter = styled('div')`
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid currentColor;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Amount = styled('div')`
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

const Currency = styled(Typography)``;

const Num = styled(Typography)`
  display: block;
`;

const HiddenRadio = styled(Radio)`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
  pointer-events: none;
`;

const SelectButton = styled('span', {
  shouldForwardProp: p => p !== 'selected',
})<{ selected: boolean }>`
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  padding: 0 22px;
  border-radius: 6px;
  border: 1px solid
    ${({ theme, selected }) =>
      selected ? theme.palette.background.paper : theme.palette.primary.main};
  background: ${({ theme, selected }) =>
    selected ? theme.palette.background.paper : 'transparent'};
  color: ${({ theme }) => theme.palette.primary.main};
  font-family: inherit;
  font-weight: 700;
  font-size: 15px;
  user-select: none;
  transition:
    background 160ms ease,
    color 160ms ease,
    border-color 160ms ease;

  ${PlanCard}:hover & {
    background: ${({ theme, selected }) =>
      selected ? theme.palette.background.paper : theme.palette.primary.main};
    color: ${({ theme, selected }) =>
      selected ? theme.palette.primary.main : theme.palette.background.paper};
  }
`;

const richTextToString = (rich: unknown): string => {
  if (!Array.isArray(rich)) {
    return '';
  }
  return rich
    .map(node => {
      if (typeof node !== 'object' || node === null) {
        return '';
      }
      const children = (node as { children?: Array<{ text?: string }> })
        .children;
      if (!Array.isArray(children)) {
        return '';
      }
      return children.map(c => c.text ?? '').join('');
    })
    .join(' ')
    .trim();
};

export const EenewsMemberPlanItem = ({
  className,
  amountPerMonthMin,
  amountPerMonthMax,
  currency,
  shortDescription,
  slug,
  checked,
  ...radioProps
}: BuilderMemberPlanItemProps) => {
  const desc = richTextToString(shortDescription);
  const min = amountPerMonthMin / 100;
  const max = amountPerMonthMax ? amountPerMonthMax / 100 : undefined;
  const amountText =
    max && max !== min ? `${min}–${max}` : String(Math.round(min));

  return (
    <PlanCard
      className={className}
      selected={!!checked}
    >
      <HiddenRadio
        {...radioProps}
        checked={checked}
        size="small"
        color="default"
      />
      <Typography variant="articleH2">{slug}</Typography>
      {desc && <Typography variant="teaserExcerpt">{desc}</Typography>}
      <CardFooter>
        <Amount>
          <Currency variant="teaserMeta">{currency}</Currency>
          <Num variant="pageH1XL">{amountText}</Num>
          <Typography variant="teaserMeta">/ Monat</Typography>
        </Amount>
        <SelectButton
          selected={!!checked}
          aria-hidden
        >
          {checked ? 'Ausgewählt ✓' : 'Wählen'}
        </SelectButton>
      </CardFooter>
    </PlanCard>
  );
};
