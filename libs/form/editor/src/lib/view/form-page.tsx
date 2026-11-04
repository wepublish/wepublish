import { Chip } from '@mui/material';
import { useFormStatus, type AnyFormSchema } from '@wepublish/form/core';
import {
  IconButtonTooltip,
  PageTitle,
  useMeasuredHeight,
} from '@wepublish/ui/editor';
import {
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdChevronLeft } from 'react-icons/md';

import { DiscardChangesDialog } from './discard-changes-dialog';
import { FormBody, FormRoot } from './form-root';
import { FormSaveActions } from './form-save-actions';
import { useFormViewContext } from './form-view-context';
import {
  Actions,
  BackAnchor,
  PageForm,
  PageRoot,
  StickyHeader,
  Subtitle,
  TitleGroup,
  TitleText,
} from './form-view-layout';
import type { FormController } from './use-form-controller';

export type FormPageProps<S extends AnyFormSchema> = {
  readonly controller: FormController<S>;
};

type TitleParams = (values: Record<string, unknown>) => Record<string, unknown>;

type RenderTitle = (text: string) => ReactNode;

const renderText: RenderTitle = text => text;

function LiveTitle({
  title,
  titleParams,
  render,
}: {
  title: string;
  titleParams: TitleParams;
  render: RenderTitle;
}) {
  const { t } = useTranslation();
  const values: Record<string, unknown> | undefined = useWatch();

  return <>{render(t(title, titleParams(values ?? {})))}</>;
}

export function FormTitle({ render = renderText }: { render?: RenderTitle }) {
  const { controller } = useFormViewContext();
  const { t } = useTranslation();
  const titleParams = controller.titleParams as TitleParams | undefined;

  return titleParams === undefined ?
      <>{render(t(controller.title))}</>
    : <LiveTitle
        title={controller.title}
        titleParams={titleParams}
        render={render}
      />;
}

function pageHeading(text: string) {
  return (
    <PageTitle
      noWrap
      title={text}
    >
      {text}
    </PageTitle>
  );
}

export function ReadOnlyChip() {
  const { t } = useTranslation();

  return (
    <Chip
      size="small"
      variant="outlined"
      label={t('form.view.readOnly')}
    />
  );
}

function BackLink({ to }: { to: string }) {
  const { t } = useTranslation();
  const { leave } = useFormViewContext();
  const { isDirty } = useFormStatus();
  const [asking, setAsking] = useState(false);

  return (
    <>
      <IconButtonTooltip caption={t('back')}>
        <BackAnchor
          to={to}
          aria-label={t('back')}
          onClick={event => {
            if (isDirty) {
              event.preventDefault();
              setAsking(true);
            }
          }}
        >
          <MdChevronLeft />
        </BackAnchor>
      </IconButtonTooltip>
      <DiscardChangesDialog
        open={asking}
        onKeep={() => setAsking(false)}
        onDiscard={() => {
          setAsking(false);
          leave(to);
        }}
      />
    </>
  );
}

export function FormPageHeader({
  ref,
}: {
  readonly ref?: Ref<HTMLDivElement>;
}) {
  const { controller } = useFormViewContext();
  const { t } = useTranslation();
  const subtitle = controller.subtitle;

  return (
    <StickyHeader
      ref={ref}
      data-testid="formHeader"
    >
      <TitleGroup>
        {controller.closePath === undefined ? null : (
          <BackLink to={controller.closePath} />
        )}
        <TitleText>
          <FormTitle render={pageHeading} />
          {subtitle === undefined || subtitle === null ? null : (
            <Subtitle variant="body2">
              {typeof subtitle === 'string' ? t(subtitle) : subtitle}
            </Subtitle>
          )}
        </TitleText>
        {controller.readOnly ?
          <ReadOnlyChip />
        : null}
      </TitleGroup>
      <Actions>
        {controller.headerActions}
        <FormSaveActions />
      </Actions>
    </StickyHeader>
  );
}

const HIDDEN_WHEN_STUCK =
  'var(--wep-page-padding-y, 0px) - max(var(--wep-page-padding-y, 0px) - 16px, 0px)';

export function FormPage<S extends AnyFormSchema>({
  controller,
}: FormPageProps<S>) {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerHeight = useMeasuredHeight(headerRef);

  return (
    <PageRoot
      style={
        {
          '--wep-sticky-top': `calc(${headerHeight}px - ${HIDDEN_WHEN_STUCK})`,
        } as CSSProperties
      }
    >
      <FormRoot
        controller={controller}
        as={PageForm}
      >
        <FormPageHeader ref={headerRef} />
        <FormBody />
      </FormRoot>
    </PageRoot>
  );
}
