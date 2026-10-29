import styled from '@emotion/styled';
import { FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';

import { ColorFieldRender } from '../color/color.component';
import { FieldToggleGroup, ToggleableField } from '../field-controls.component';
import { FieldStack } from '../field-controls';
import { SidesInput } from '../sides/sides.component';
import {
  BorderField,
  BorderStyle,
  borderStyles,
  BorderValue,
} from './border.field';

const LinePreview = styled.span<{ lineStyle: BorderStyle }>`
  width: 20px;
  border-top: 2px ${({ lineStyle }) => lineStyle} currentColor;
`;

export type BorderFieldRenderProps = FieldProps<
  BorderField,
  BorderValue | undefined
> & {
  name: string;
};

export const BorderFieldRender = ({
  field,
  name,
  value,
  onChange,
  readOnly,
}: BorderFieldRenderProps) => {
  const { t } = useTranslation();
  const current = value ?? {};
  const styleLabels: Record<BorderStyle, string> = {
    solid: t('', 'Solid'),
    dashed: t('', 'Dashed'),
    dotted: t('', 'Dotted'),
  };

  return (
    <ToggleableField
      label={field.label ?? t('', 'Border')}
      value={value}
      readOnly={readOnly}
      onChange={onChange}
    >
      <FieldStack>
        <SidesInput
          name={`${name}-width`}
          unit="px"
          value={current.width}
          readOnly={readOnly}
          onChange={width => onChange({ ...current, width })}
        />

        <FieldToggleGroup
          name={`${name}-style`}
          value={current.style ?? 'solid'}
          readOnly={readOnly}
          onChange={style => onChange({ ...current, style })}
          options={borderStyles.map(style => ({
            value: style,
            label: styleLabels[style],
            icon: <LinePreview lineStyle={style} />,
          }))}
        />

        <ColorFieldRender
          id={`${name}-color`}
          name={`${name}-color`}
          field={{ type: 'color', label: t('', 'Colour') }}
          value={current.color}
          readOnly={readOnly}
          onChange={color => onChange({ ...current, color })}
        />
      </FieldStack>
    </ToggleableField>
  );
};
