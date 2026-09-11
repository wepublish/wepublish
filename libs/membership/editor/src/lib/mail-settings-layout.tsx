import styled from '@emotion/styled';
import { TableCell, Tooltip } from '@mui/material';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MdInfoOutline } from 'react-icons/md';

/** Keeps an event column readable when many columns share the table. */
const EVENT_COLUMN_MIN_WIDTH = '200px';

export const EventTableCell = styled(TableCell)`
  min-width: ${EVENT_COLUMN_MIN_WIDTH};
  vertical-align: top;
`;

export const DarkTableCell = styled(TableCell)`
  background-color: ${({ theme }) => theme.palette.common.black};
  color: ${({ theme }) => theme.palette.common.white};
  border-right: 1px solid ${({ theme }) => theme.palette.common.white};
`;

const SectionBandContent = styled('span')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 600;
`;

const InfoTrigger = styled('span')`
  display: inline-flex;
  align-items: center;
  color: inherit;
  cursor: help;
  opacity: 0.65;

  &:hover,
  &:focus-visible {
    opacity: 1;
  }
`;

const TooltipContent = styled('span')`
  display: grid;
  gap: 4px;
  text-align: left;
  line-height: 1.45;
`;

const TooltipExample = styled('em')`
  opacity: 0.85;
`;

const EventHeadContent = styled('span')`
  display: grid;
  gap: 2px;
  justify-items: center;
`;

const EventHeadTitle = styled('span')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 600;
  line-height: 1.3;
`;

const EventHeadHint = styled('span')`
  max-width: 200px;
  font-size: 11px;
  font-weight: 400;
  line-height: 1.35;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

interface InfoTooltipProps {
  description: string;
  example?: string;
}

export function InfoTooltip({ description, example }: InfoTooltipProps) {
  const { t } = useTranslation();

  return (
    <Tooltip
      arrow
      enterTouchDelay={0}
      title={
        <TooltipContent>
          <span>{description}</span>

          {example && (
            <TooltipExample>
              {t('automaticMails.example', { example })}
            </TooltipExample>
          )}
        </TooltipContent>
      }
    >
      <InfoTrigger
        tabIndex={0}
        aria-label={description}
      >
        <MdInfoOutline size={15} />
      </InfoTrigger>
    </Tooltip>
  );
}

interface SectionBandCellProps extends InfoTooltipProps {
  label: string;
  icon?: ReactNode;
  colSpan?: number;
}

/**
 * Black band spanning a group of columns. Names a section of automatic mails and
 * explains what it is good for.
 */
export function SectionBandCell({
  label,
  icon,
  description,
  example,
  colSpan,
}: SectionBandCellProps) {
  return (
    <DarkTableCell
      align="center"
      colSpan={colSpan}
    >
      <SectionBandContent>
        {icon}
        {label}

        <InfoTooltip
          description={description}
          example={example}
        />
      </SectionBandContent>
    </DarkTableCell>
  );
}

interface EventHeadCellProps {
  title: string;
  hint?: string;
  description?: string;
  example?: string;
}

/**
 * Column header naming a single event, with a one liner below and the details
 * behind an info tooltip.
 */
export function EventHeadCell({
  title,
  hint,
  description,
  example,
}: EventHeadCellProps) {
  return (
    <EventHeadContent>
      <EventHeadTitle>
        {title}

        {description && (
          <InfoTooltip
            description={description}
            example={example}
          />
        )}
      </EventHeadTitle>

      {hint && <EventHeadHint>{hint}</EventHeadHint>}
    </EventHeadContent>
  );
}
