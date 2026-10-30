import styled from '@emotion/styled';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import { BlockTimingInput } from '@wepublish/editor/api';
import { BlockTimingButton, describeTiming } from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';

import { FieldStack } from '../field-controls';
import { SwitchFieldRender } from '../switch/switch.component';
import { VisibilityFieldRender } from '../visibility/visibility.component';
import {
  BlockTiming,
  BlockVisibilityField,
  BlockVisibilityValue,
  isTimed,
} from './block-visibility.field';

const TimingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const TimingSummary = styled.span`
  font-size: var(--puck-font-size-xxs);
  color: var(--puck-color-text-secondary);
`;

export type BlockVisibilityFieldRenderProps = FieldProps<
  BlockVisibilityField,
  BlockVisibilityValue | undefined
> & {
  name: string;
};

export const BlockVisibilityFieldRender = ({
  name,
  value,
  onChange,
  readOnly,
}: BlockVisibilityFieldRenderProps) => {
  const { t, i18n } = useTranslation();
  const current = value ?? {};
  const change = (next: BlockVisibilityValue) =>
    onChange({ ...current, ...next });
  const sub = (key: keyof BlockVisibilityValue) => ({
    id: `${name}-${key}`,
    name: `${name}-${key}`,
    readOnly,
  });

  return (
    <FieldStack>
      <SwitchFieldRender
        {...sub('disabled')}
        field={{ type: 'switch', label: t('', 'Disabled') }}
        value={current.disabled}
        onChange={disabled => change({ disabled: disabled || undefined })}
      />

      <FieldLabel
        label={t('', 'Timing')}
        readOnly={readOnly}
        el="div"
      >
        <TimingRow>
          <TimingSummary>
            {describeTiming(
              current.timings as BlockTimingInput | undefined,
              (key, options) => t(key, options ?? {}) as string,
              i18n?.language
            )}
          </TimingSummary>

          <BlockTimingButton
            timing={current.timings as BlockTimingInput | undefined}
            disabled={readOnly}
            onChange={timings =>
              change({
                timings:
                  isTimed(timings as BlockTiming | null) ?
                    (timings as BlockTiming)
                  : undefined,
              })
            }
          />
        </TimingRow>
      </FieldLabel>

      <VisibilityFieldRender
        {...sub('breakpoints')}
        field={{ type: 'visibility', label: t('', 'Breakpoints') }}
        value={current.breakpoints}
        onChange={breakpoints => change({ breakpoints })}
      />
    </FieldStack>
  );
};
