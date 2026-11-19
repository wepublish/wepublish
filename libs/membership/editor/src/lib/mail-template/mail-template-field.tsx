import styled from '@emotion/styled';
import { ButtonBase, Drawer } from '@mui/material';
import {
  MailTemplateContext,
  TinyMailTemplateFragment,
} from '@wepublish/editor/api';
import { DRAWER_WIDTHS } from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdArrowDropDown, MdUnsubscribe } from 'react-icons/md';
import { formatTemplateLabel } from './mail-placeholders';
import { SelectMailTemplatePanel } from './select-mail-template-panel';

// Looks like the select it replaces, so the rows it sits in keep their shape.
const Field = styled(ButtonBase)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(1)};
  width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: ${({ theme }) => theme.spacing(0.75, 1, 0.75, 1.75)};
  border: 1px solid
    rgb(from ${({ theme }) => theme.vars.palette.text.primary} r g b / 23%);
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => theme.vars.palette.background.paper};
  color: ${({ theme }) => theme.vars.palette.text.primary};
  font: inherit;
  font-size: 1rem;
  text-align: left;

  &:hover {
    border-color: ${({ theme }) => theme.vars.palette.text.primary};
  }

  &.Mui-focusVisible {
    outline: 2px solid ${({ theme }) => theme.vars.palette.primary.main};
    outline-offset: 1px;
  }

  &.Mui-disabled {
    color: ${({ theme }) => theme.vars.palette.text.disabled};
    border-color: ${({ theme }) => theme.vars.palette.action.disabled};
  }
`;

const Value = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;

  & > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  & > svg {
    flex-shrink: 0;
  }
`;

export type MailTemplateFieldProps = {
  /** The template chosen now. */
  value?: string | null;
  /** The templates there are, to show the chosen one by name. */
  templates: Pick<TinyMailTemplateFragment, 'id' | 'name' | 'context'>[];
  /** The purpose the chooser starts narrowed to. */
  purpose?: MailTemplateContext;
  /** What the template is for, e.g. the event; names the field. */
  label: string;
  disabled?: boolean;
  onChange(mailTemplateId: string | null): void;
};

/**
 * The template an automated message sends, and the way to choose another:
 * a click opens the chooser with the whole template table.
 */
export function MailTemplateField({
  value,
  templates,
  purpose,
  label,
  disabled,
  onChange,
}: MailTemplateFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selected = templates.find(({ id }) => id === value);
  const shown =
    selected ?
      formatTemplateLabel(selected.name, selected.context, (k, f) => t(k, f))
    : t('mailTemplateSelect.noMailSentSelectNow');

  return (
    <>
      <Field
        aria-label={`${label}: ${shown}`}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Value>
          {!selected && <MdUnsubscribe size={16} />}
          <span>{shown}</span>
        </Value>

        <MdArrowDropDown
          size={24}
          aria-hidden
        />
      </Field>

      <Drawer
        anchor="right"
        slotProps={{
          paper: { sx: { width: DRAWER_WIDTHS.lg, maxWidth: '100vw' } },
        }}
        open={open}
        onClose={() => setOpen(false)}
      >
        {open && (
          <SelectMailTemplatePanel
            selectedId={value}
            purpose={purpose}
            eventLabel={label}
            onSelect={onChange}
            onClose={() => setOpen(false)}
          />
        )}
      </Drawer>
    </>
  );
}
