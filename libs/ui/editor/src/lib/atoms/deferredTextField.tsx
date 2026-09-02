import styled from '@emotion/styled';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, InputGroup as RInputGroup } from 'rsuite';

import { Textarea } from './textarea';

const COMMIT_DELAY = 500;

const InputGroup = styled(RInputGroup)`
  width: 100%;
`;

const CharCount = styled.label`
  float: right;
`;

const CharCountWarning = styled.label`
  color: gold;
`;

export interface DeferredTextFieldProps {
  readonly label: ReactNode;
  readonly value?: string | null;
  readonly controlId?: string;
  readonly name?: string;
  readonly className?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly multiline?: boolean;
  readonly rows?: number;
  readonly charLimit?: number;
  readonly helpText?: ReactNode;
  readonly action?: ReactNode;
  readonly error?: ReactNode;

  onChange(value: string): void;

  onCommit?(value: string): void;
}

/**
 * Text field that keeps the typed value in local state and only propagates it to
 * the parent when the user pauses typing or leaves the field. Without this, every
 * keystroke re-renders the whole surrounding form, which is expensive.
 */
export function DeferredTextField({
  label,
  value,
  controlId,
  name,
  className,
  placeholder,
  disabled,
  multiline,
  rows,
  charLimit,
  helpText,
  action,
  error,
  onChange,
  onCommit,
}: DeferredTextFieldProps) {
  const { t } = useTranslation();

  const [draft, setDraft] = useState(value ?? '');

  const draftRef = useRef(draft);
  const committedRef = useRef(value ?? '');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const callbacksRef = useRef({ onChange, onCommit });

  callbacksRef.current = { onChange, onCommit };

  useEffect(() => {
    const nextValue = value ?? '';

    if (nextValue === committedRef.current || timeoutRef.current) {
      return;
    }

    committedRef.current = nextValue;
    draftRef.current = nextValue;
    setDraft(nextValue);
  }, [value]);

  const commit = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (draftRef.current === committedRef.current) {
      return;
    }

    committedRef.current = draftRef.current;
    callbacksRef.current.onChange(draftRef.current);
  }, []);

  useEffect(() => commit, [commit]);

  function handleChange(nextDraft: string) {
    draftRef.current = nextDraft;
    setDraft(nextDraft);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
      commit();
    }, COMMIT_DELAY);
  }

  function handleBlur() {
    commit();
    callbacksRef.current.onCommit?.(draftRef.current);
  }

  const Field = multiline || rows ? Textarea : Input;

  const input = (
    <Field
      rows={rows}
      name={name}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );

  return (
    <Form.Group controlId={controlId}>
      <Form.Label>
        {label}
        {charLimit !== undefined && (
          <CharCount>
            {draft.length}/{charLimit}
          </CharCount>
        )}
      </Form.Label>

      {action ?
        <InputGroup>
          {input}
          {action}
        </InputGroup>
      : input}

      {error && <Form.ErrorMessage show>{error}</Form.ErrorMessage>}

      {helpText && <Form.Text>{helpText}</Form.Text>}

      {charLimit !== undefined && draft.length > charLimit && (
        <CharCountWarning>
          {t('articleEditor.panels.charCountWarning', {
            charCountWarning: charLimit,
          })}
        </CharCountWarning>
      )}
    </Form.Group>
  );
}
