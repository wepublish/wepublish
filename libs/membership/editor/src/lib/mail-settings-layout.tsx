import styled from '@emotion/styled';
import { InfoTooltip as SharedInfoTooltip } from '@wepublish/ui/editor';
import { PropsWithChildren, ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdExpandMore } from 'react-icons/md';

export const MailBlocks = styled('div')<{ split?: boolean }>`
  display: grid;
  grid-template-columns: ${({ split }) =>
    split ?
      'repeat(auto-fit, minmax(min(100%, 500px), 1fr))'
    : 'minmax(0, 1fr)'};
  align-items: start;
  gap: 24px;
  max-width: ${({ split }) => (split ? '1600px' : '1040px')};
  margin-top: 24px;
`;

const Block = styled('section')`
  container-type: inline-size;
  min-width: 0;
  border: 1px solid var(--rs-border-primary);
  border-radius: var(--rs-radius-lg);
  background-color: var(--rs-bg-card);
`;

const BlockHeader = styled('header', {
  shouldForwardProp: prop => prop !== 'collapsed',
})<{ collapsed: boolean }>`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 16px 20px;
  border-bottom: ${({ collapsed }) =>
    collapsed ? 'none' : '1px solid var(--rs-border-primary)'};
  border-radius: ${({ collapsed }) =>
    collapsed ?
      'var(--rs-radius-lg)'
    : 'var(--rs-radius-lg) var(--rs-radius-lg) 0 0'};

  &:has(> div > h3 > button:hover) {
    background-color: rgb(from var(--rs-text-primary) r g b / 3%);
  }
`;

const HeaderMain = styled('div')`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const Summary = styled('span')`
  padding-left: 28px;
  overflow: hidden;
  font-size: 13px;
  color: var(--rs-text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ToggleButton = styled('button')`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible::after {
    outline: 2px solid var(--rs-primary-500);
    outline-offset: -2px;
  }

  > svg {
    flex-shrink: 0;
    color: var(--rs-text-secondary);
  }
`;

const Chevron = styled(MdExpandMore, {
  shouldForwardProp: prop => prop !== 'expanded',
})<{ expanded: boolean }>`
  transform: rotate(${({ expanded }) => (expanded ? 0 : -90)}deg);
  transition: transform 150ms ease;
`;

const BlockTitle = styled('h3')`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--rs-text-heading);

  > svg {
    flex-shrink: 0;
    color: var(--rs-text-secondary);
  }
`;

const HeaderActions = styled('div')`
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const Subsection = styled('div')`
  & + & {
    border-top: 1px solid var(--rs-border-primary);
  }
`;

const SubsectionHeader = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  padding: 16px 20px 4px;
`;

const SubsectionTitle = styled('h4')`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rs-text-secondary);
`;

export const EventList = styled('ul')`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled('li')`
  display: grid;
  gap: 8px 24px;
  padding: 14px 20px;

  & + & {
    border-top: 1px solid var(--rs-border-primary);
  }

  @container (min-width: 620px) {
    grid-template-columns: minmax(0, 1fr) minmax(260px, 420px);
    align-items: center;
  }
`;

const RowLabel = styled('div')`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const RowTitle = styled('h5')`
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--rs-text-primary);
`;

const RowHint = styled('span')`
  font-size: 13px;
  line-height: 1.4;
  color: var(--rs-text-secondary);
`;

const RowControl = styled('div')`
  min-width: 0;
`;

const InfoSlot = styled('span')`
  position: relative;
  z-index: 1;
  display: inline-flex;
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

interface InfoTooltipProps {
  description: string;
  example?: string;
}

export function InfoTooltip({ description, example }: InfoTooltipProps) {
  const { t } = useTranslation();

  return (
    <InfoSlot>
      <SharedInfoTooltip
        label={description}
        text={
          <TooltipContent>
            <span>{description}</span>

            {example && (
              <TooltipExample>
                {t('automaticMails.example', { example })}
              </TooltipExample>
            )}
          </TooltipContent>
        }
      />
    </InfoSlot>
  );
}

interface HeadingProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  example?: string;
  actions?: ReactNode;
}

interface MailBlockProps extends HeadingProps {
  summary?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function MailBlock({
  title,
  icon,
  description,
  example,
  actions,
  summary,
  collapsible,
  defaultExpanded = false,
  children,
}: PropsWithChildren<MailBlockProps>) {
  const headingId = useId();
  const contentId = useId();
  const [expanded, setExpanded] = useState(!collapsible || defaultExpanded);

  return (
    <Block aria-labelledby={headingId}>
      <BlockHeader collapsed={!expanded}>
        <HeaderMain>
          <BlockTitle>
            {collapsible ?
              <ToggleButton
                type="button"
                aria-expanded={expanded}
                aria-controls={contentId}
                onClick={() => setExpanded(current => !current)}
              >
                <Chevron
                  size={20}
                  expanded={expanded}
                />
                {icon}
                <span id={headingId}>{title}</span>
              </ToggleButton>
            : <>
                {icon}
                <span id={headingId}>{title}</span>
              </>
            }

            {description && (
              <InfoTooltip
                description={description}
                example={example}
              />
            )}
          </BlockTitle>

          {summary && <Summary>{summary}</Summary>}
        </HeaderMain>

        {actions && <HeaderActions>{actions}</HeaderActions>}
      </BlockHeader>

      {expanded && <div id={contentId}>{children}</div>}
    </Block>
  );
}

export function MailSubsection({
  title,
  icon,
  description,
  example,
  actions,
  children,
}: PropsWithChildren<Partial<HeadingProps>>) {
  return (
    <Subsection>
      {title && (
        <SubsectionHeader>
          <SubsectionTitle>
            {icon}
            {title}

            {description && (
              <InfoTooltip
                description={description}
                example={example}
              />
            )}
          </SubsectionTitle>

          {actions && <HeaderActions>{actions}</HeaderActions>}
        </SubsectionHeader>
      )}

      {children}
    </Subsection>
  );
}

interface EventRowProps {
  title: string;
  hint?: string;
  description?: string;
  example?: string;
}

export function EventRow({
  title,
  hint,
  description,
  example,
  children,
}: PropsWithChildren<EventRowProps>) {
  return (
    <Row>
      <RowLabel>
        <RowTitle>
          {title}

          {description && (
            <InfoTooltip
              description={description}
              example={example}
            />
          )}
        </RowTitle>

        {hint && <RowHint>{hint}</RowHint>}
      </RowLabel>

      <RowControl>{children}</RowControl>
    </Row>
  );
}
