import { FieldGroup, FieldLabel, FieldProps } from '@puckeditor/core';
import { useTranslation } from 'react-i18next';
import { LuBox, LuPalette, LuType } from 'react-icons/lu';

import { AlignmentFieldRender } from '../alignment/alignment.component';
import { BorderFieldRender } from '../border/border.component';
import { ColorFieldRender } from '../color/color.component';
import { PaddingFieldRender } from '../padding/padding.component';
import { StylingField, StylingValue, textAlignValues } from './styling.field';

export type StylingFieldRenderProps = FieldProps<
  StylingField,
  StylingValue | undefined
> & {
  name: string;
};

export const StylingFieldRender = ({
  field,
  name,
  value,
  onChange,
  readOnly,
}: StylingFieldRenderProps) => {
  const { t } = useTranslation();
  const current = value ?? {};
  const set =
    <Key extends keyof StylingValue>(key: Key) =>
    (next: StylingValue[Key]) =>
      onChange({ ...current, [key]: next });
  const sub = (key: keyof StylingValue) => ({
    id: `${name}-${key}`,
    name: `${name}-${key}`,
    readOnly,
  });

  return (
    <FieldLabel
      label={field.label ?? t('', 'Styling')}
      readOnly={readOnly}
      el="div"
    >
      <FieldGroup
        label={t('', 'Colours')}
        icon={<LuPalette size={16} />}
        id={`${name}-colours`}
      >
        <FieldGroup.Item>
          <ColorFieldRender
            {...sub('color')}
            field={{ type: 'color', label: t('', 'Text') }}
            value={current.color}
            onChange={set('color')}
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <ColorFieldRender
            {...sub('background')}
            field={{ type: 'color', label: t('', 'Background') }}
            value={current.background}
            onChange={set('background')}
          />
        </FieldGroup.Item>
      </FieldGroup>

      <FieldGroup
        label={t('', 'Text')}
        icon={<LuType size={16} />}
        id={`${name}-text`}
      >
        <FieldGroup.Item>
          <AlignmentFieldRender
            {...sub('textAlign')}
            field={{
              type: 'alignment',
              label: t('', 'Alignment'),
              orientation: 'text',
              alignments: textAlignValues,
            }}
            value={current.textAlign}
            onChange={align =>
              set('textAlign')(align as StylingValue['textAlign'])
            }
          />
        </FieldGroup.Item>
      </FieldGroup>

      <FieldGroup
        label={t('', 'Box model')}
        icon={<LuBox size={16} />}
        id={`${name}-box`}
      >
        <FieldGroup.Item>
          <PaddingFieldRender
            {...sub('margin')}
            field={{
              type: 'padding',
              label: t('', 'Margin'),
              sides: field.marginSides,
            }}
            value={current.margin}
            onChange={set('margin')}
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <BorderFieldRender
            {...sub('border')}
            field={{ type: 'border', label: t('', 'Border') }}
            value={current.border}
            onChange={set('border')}
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <PaddingFieldRender
            {...sub('padding')}
            field={{ type: 'padding', label: t('', 'Padding') }}
            value={current.padding}
            onChange={set('padding')}
          />
        </FieldGroup.Item>
      </FieldGroup>
    </FieldLabel>
  );
};
