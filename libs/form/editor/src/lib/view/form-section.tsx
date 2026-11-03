import { Chip } from '@mui/material';
import { useFieldErrors } from '@wepublish/form/core';
import { useContext, useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { FormViewContext } from './form-view-context';
import {
  CardFields,
  CardTitle,
  CardTitleGroup,
  Chevron,
  Row,
  SectionCard,
  SectionCardContent,
  SectionDescription,
  SectionFields,
  SectionHeader,
  SectionRoot,
  SectionTitle,
  SectionToggle,
  ToggleEnd,
  ToggleGroup,
  ToggleGroupTitle,
} from './form-view-layout';

export type FormSectionProps = {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly collapsible?: 'open' | 'closed';
  readonly errorPaths?: readonly string[];
  readonly variant?: 'section' | 'card';
  readonly span?: 'full';
  readonly children: ReactNode;
};

type SectionShellProps = {
  readonly card: boolean;
  readonly span?: 'full';
  readonly labelledBy?: string;
  readonly children: ReactNode;
};

const NO_PATHS: readonly string[] = [];

const isShown = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

function SectionShell({ card, span, labelledBy, children }: SectionShellProps) {
  if (card) {
    return (
      <SectionCard
        variant="outlined"
        component={labelledBy === undefined ? 'div' : 'section'}
        aria-labelledby={labelledBy}
        data-span={span}
      >
        <SectionCardContent>{children}</SectionCardContent>
      </SectionCard>
    );
  }

  return labelledBy === undefined ?
      <SectionRoot>{children}</SectionRoot>
    : <SectionRoot
        as="section"
        aria-labelledby={labelledBy}
      >
        {children}
      </SectionRoot>;
}

export function FormSection({
  title,
  description,
  collapsible,
  errorPaths,
  variant = 'section',
  span,
  children,
}: FormSectionProps) {
  const { t } = useTranslation();
  const context = useContext(FormViewContext);
  const headingLevel = context === null ? 'h2' : context.headingLevel;
  const titleId = useId();
  const bodyId = useId();
  const [open, setOpen] = useState(collapsible !== 'closed');
  const errors = useFieldErrors(
    collapsible === undefined ? NO_PATHS : (errorPaths ?? NO_PATHS)
  );
  const expanded = collapsible === undefined || open || errors.length > 0;
  const card = variant === 'card';
  const Fields = card ? CardFields : SectionFields;
  const Header = card ? CardTitleGroup : SectionHeader;
  const Title = card ? CardTitle : SectionTitle;
  const titleText = typeof title === 'string' ? t(title) : title;
  const descriptionNode =
    isShown(description) ?
      <SectionDescription variant="body2">
        {typeof description === 'string' ? t(description) : description}
      </SectionDescription>
    : null;

  if (!isShown(title)) {
    return (
      <SectionShell
        card={card}
        span={span}
      >
        {descriptionNode}
        <Fields>{children}</Fields>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      card={card}
      span={span}
      labelledBy={titleId}
    >
      <Header>
        <Title
          id={titleId}
          variant={card ? 'h4' : 'subtitle1'}
          component={headingLevel}
        >
          {collapsible === undefined ?
            titleText
          : <SectionToggle
              type="button"
              aria-expanded={expanded}
              aria-controls={bodyId}
              onClick={() => setOpen(!expanded)}
            >
              <span>{titleText}</span>
              <ToggleEnd>
                {errors.length === 0 ? null : (
                  <Chip
                    size="small"
                    color="error"
                    variant="outlined"
                    label={t('form.view.sectionErrors', {
                      count: errors.length,
                    })}
                  />
                )}
                <Chevron
                  aria-hidden
                  data-open={expanded}
                />
              </ToggleEnd>
            </SectionToggle>
          }
        </Title>
        {descriptionNode}
      </Header>
      <div
        id={bodyId}
        hidden={!expanded}
      >
        {expanded ?
          <Fields>{children}</Fields>
        : null}
      </div>
    </SectionShell>
  );
}

export function FormRow({ children }: { readonly children: ReactNode }) {
  return <Row>{children}</Row>;
}

export function FormToggleGroup({
  title,
  children,
}: {
  readonly title?: ReactNode;
  readonly children: ReactNode;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const hasTitle = isShown(title);

  return (
    <ToggleGroup
      role="group"
      aria-labelledby={hasTitle ? titleId : undefined}
    >
      {hasTitle ?
        <ToggleGroupTitle
          id={titleId}
          component="div"
        >
          {typeof title === 'string' ? t(title) : title}
        </ToggleGroupTitle>
      : null}
      {children}
    </ToggleGroup>
  );
}
