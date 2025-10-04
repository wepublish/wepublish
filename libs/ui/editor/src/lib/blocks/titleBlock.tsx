import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockProps } from '../atoms/blockList';
import { TypographicTextArea } from '../atoms/typographicTextArea';
import { TitleBlockValue } from './types';

export type TitleBlockProps = BlockProps<TitleBlockValue>;

export function TitleBlock({
  value,
  onChange,
  autofocus,
  disabled,
}: TitleBlockProps) {
  const { title, lead, preTitle } = value;
  const focusRef = useRef<HTMLTextAreaElement>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (autofocus) {
      focusRef.current?.focus();
    }
  }, [autofocus]);

  return (
    <>
      <TypographicTextArea
        variant="subtitle1"
        align="center"
        placeholder={t('blocks.title.preTitle')}
        value={preTitle}
        disabled={disabled}
        onChange={e => onChange({ ...value, preTitle: e.target.value })}
      />

      <TypographicTextArea
        ref={focusRef}
        variant="title"
        align="center"
        placeholder={t('blocks.title.title')}
        value={title}
        disabled={disabled}
        onChange={e => onChange({ ...value, title: e.target.value })}
      />
      <TypographicTextArea
        variant="body1"
        align="center"
        placeholder={t('blocks.title.leadText')}
        value={lead}
        disabled={disabled}
        onChange={e => onChange({ ...value, lead: e.target.value })}
      />
    </>
  );
}
