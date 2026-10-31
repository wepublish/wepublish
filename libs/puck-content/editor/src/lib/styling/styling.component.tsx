import { Tooltip } from '@mui/material';
import { FieldGroup, FieldLabel, FieldProps } from '@puckeditor/core';
import { Fragment, ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LuBox,
  LuCaseLower,
  LuCaseSensitive,
  LuCaseUpper,
  LuMoveHorizontal,
  LuMoveVertical,
  LuPaintBucket,
  LuRemoveFormatting,
  LuRuler,
  LuSparkles,
  LuSquareDashed,
  LuType,
} from 'react-icons/lu';

import { AlignmentFieldRender } from '../alignment/alignment.component';
import { BorderFieldRender } from '../border/border.component';
import { BoxModelInput } from '../box-model/box-model.component';
import { ColorFieldRender } from '../color/color.component';
import { FieldSelect, FieldToggleGroup } from '../field-controls.component';
import { ImagePicker } from '../image/image.component';
import {
  getThemeTypographyVariants,
  resolveTypography,
} from '../typography/typography.field';
import { useWebsiteTheme } from '../website-theme';
import {
  BackgroundPositionInput,
  CornerRadiusInput,
  LengthInput,
  MaxWidthInput,
  PercentSlider,
  ShadowInput,
  StylingToggleGroup,
} from './styling-controls.component';
import {
  StylingOptionText,
  StylingWeightSample,
} from './styling-controls.styles';
import {
  BackgroundSizeValue,
  backgroundSizeValues,
  defaultBackgroundPosition,
  defaultBackgroundSize,
  defaultOverlayOpacity,
  FontWeightValue,
  fontWeightValues,
  headingLevel,
  humanizeTypographyVariant,
  isStylingGroupModified,
  minHeightUnits,
  resetStylingGroup,
  setStyling,
  StylingField,
  StylingGroup,
  StylingValue,
  textAlignValues,
  TextTransformValue,
  textTransformValues,
} from './styling.field';
import {
  StylingGroupFrame,
  StylingGroupIcon,
  StylingGroups,
  StylingModifiedDot,
  StylingResetButton,
} from './styling.styles';

const ignoredTypographyVariants = new Set(['inherit']);

const useStylingLabels = () => {
  const { t } = useTranslation();

  return {
    styling: t('', 'Styling'),
    groups: {
      text: t('', 'Text'),
      background: t('', 'Background'),
      spacing: t('', 'Spacing'),
      border: t('', 'Border'),
      size: t('', 'Size'),
      effects: t('', 'Effects'),
    } satisfies Record<StylingGroup, string>,
    typography: t('', 'Typography'),
    themeDefault: t('', 'Theme default'),
    heading: (level: number) => t('', 'Heading {{level}}', { level }),
    alignment: t('', 'Alignment'),
    textColour: t('', 'Text colour'),
    backgroundColour: t('', 'Background colour'),
    weight: t('', 'Weight'),
    weights: {
      light: t('', 'Light'),
      regular: t('', 'Regular'),
      medium: t('', 'Medium'),
      bold: t('', 'Bold'),
    } satisfies Record<FontWeightValue, string>,
    letterCase: t('', 'Letter case'),
    letterCases: {
      none: t('', 'As written'),
      uppercase: t('', 'Uppercase'),
      lowercase: t('', 'Lowercase'),
      capitalize: t('', 'Capitalize words'),
    } satisfies Record<TextTransformValue, string>,
    image: t('', 'Image'),
    imageSize: t('', 'Size'),
    imageSizes: {
      cover: t('', 'Cover'),
      contain: t('', 'Contain'),
      auto: t('', 'Original'),
    } satisfies Record<BackgroundSizeValue, string>,
    position: t('', 'Position'),
    overlay: t('', 'Overlay'),
    overlayOpacity: t('', 'Overlay opacity'),
    border: t('', 'Border'),
    cornerRadius: t('', 'Corner radius'),
    minHeight: t('', 'Min height'),
    maxWidth: t('', 'Max width'),
    customMaxWidth: t('', 'Custom max width'),
    shadow: t('', 'Shadow'),
    opacity: t('', 'Opacity'),
    reset: t('', 'Reset'),
    resetGroup: (group: string) => t('', 'Reset {{group}}', { group }),
  };
};

const letterCaseIcons = {
  none: <LuRemoveFormatting size={16} />,
  uppercase: <LuCaseUpper size={16} />,
  lowercase: <LuCaseLower size={16} />,
  capitalize: <LuCaseSensitive size={16} />,
} satisfies Record<TextTransformValue, ReactNode>;

const fontWeightKeys = {
  light: 'fontWeightLight',
  regular: 'fontWeightRegular',
  medium: 'fontWeightMedium',
  bold: 'fontWeightBold',
} as const satisfies Record<FontWeightValue, string>;

export type StylingGroupSectionProps = {
  id: string;
  label: string;
  icon: ReactNode;
  modified: boolean;
  defaultExpanded?: boolean;
  readOnly?: boolean;
  onReset: () => void;
  children: ReactNode;
};

export const StylingGroupSection = ({
  id,
  label,
  icon,
  modified,
  defaultExpanded = false,
  readOnly,
  onReset,
  children,
}: StylingGroupSectionProps) => {
  const labels = useStylingLabels();
  const [initiallyExpanded] = useState(defaultExpanded || modified);
  const [resets, setResets] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const resetLabel = labels.resetGroup(label);

  const reset = () => {
    frameRef.current
      ?.querySelector<HTMLButtonElement>(
        ':scope > [data-puck-field-group-collapsible] > button'
      )
      ?.focus();
    onReset();
    setResets(count => count + 1);
  };

  return (
    <StylingGroupFrame ref={frameRef}>
      {modified && !readOnly && (
        <Tooltip
          title={resetLabel}
          disableInteractive
        >
          <StylingResetButton
            type="button"
            aria-label={resetLabel}
            onClick={reset}
          >
            {labels.reset}
          </StylingResetButton>
        </Tooltip>
      )}

      <FieldGroup
        id={id}
        label={label}
        defaultExpanded={initiallyExpanded}
        icon={
          <StylingGroupIcon>
            {icon}
            {modified && <StylingModifiedDot aria-hidden />}
          </StylingGroupIcon>
        }
      >
        <Fragment key={resets}>{children}</Fragment>
      </FieldGroup>
    </StylingGroupFrame>
  );
};

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
  const labels = useStylingLabels();
  const theme = useWebsiteTheme();
  const current = value ?? {};
  const update = (patch: Partial<StylingValue>) =>
    onChange(setStyling(value, patch));
  const sub = (key: keyof StylingValue) => ({
    id: `${name}-${key}`,
    name: `${name}-${key}`,
    readOnly,
  });
  const typographyVariants = getThemeTypographyVariants(theme).filter(
    variant => !ignoredTypographyVariants.has(variant)
  );
  const variantLabel = (variant: string) => {
    const level = headingLevel(variant);
    const title =
      level ? labels.heading(level) : humanizeTypographyVariant(variant);
    const fontSize = resolveTypography(theme, { variant })?.fontSize;

    return fontSize ? `${title} · ${fontSize}` : title;
  };

  const groupProps = (group: StylingGroup) => ({
    id: `${name}-${group}`,
    label: labels.groups[group],
    modified: isStylingGroupModified(value, group),
    defaultExpanded: group === 'text' || group === 'background',
    readOnly,
    onReset: () => onChange(resetStylingGroup(value, group)),
  });

  return (
    <StylingGroups
      role="group"
      aria-label={field.label ?? labels.styling}
    >
      <StylingGroupSection
        {...groupProps('text')}
        icon={<LuType size={16} />}
      >
        <FieldGroup.Item>
          <FieldLabel
            label={labels.typography}
            readOnly={readOnly}
          >
            <FieldSelect
              value={current.typography ?? ''}
              disabled={readOnly}
              onChange={event =>
                update({ typography: event.currentTarget.value || undefined })
              }
            >
              <option value="">{labels.themeDefault}</option>

              {typographyVariants.map(variant => (
                <option
                  key={variant}
                  value={variant}
                >
                  {variantLabel(variant)}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>
        </FieldGroup.Item>

        <FieldGroup.Item>
          <AlignmentFieldRender
            {...sub('textAlign')}
            field={{
              type: 'alignment',
              label: labels.alignment,
              orientation: 'text',
              alignments: textAlignValues,
            }}
            value={current.textAlign}
            onChange={align =>
              update({
                textAlign: textAlignValues.find(option => option === align),
              })
            }
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <ColorFieldRender
            {...sub('color')}
            field={{ type: 'color', label: labels.textColour }}
            value={current.color}
            onChange={color => update({ color })}
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <FieldLabel
            label={labels.weight}
            readOnly={readOnly}
            el="div"
          >
            <StylingToggleGroup label={labels.weight}>
              <FieldToggleGroup
                name={`${name}-fontWeight`}
                value={current.fontWeight}
                readOnly={readOnly}
                deselectable
                onChange={fontWeight => update({ fontWeight })}
                options={fontWeightValues.map(weight => ({
                  value: weight,
                  label: labels.weights[weight],
                  icon: (
                    <StylingWeightSample
                      sampleWeight={theme.typography[fontWeightKeys[weight]]}
                    >
                      Aa
                    </StylingWeightSample>
                  ),
                }))}
              />
            </StylingToggleGroup>
          </FieldLabel>
        </FieldGroup.Item>

        <FieldGroup.Item>
          <FieldLabel
            label={labels.letterCase}
            readOnly={readOnly}
            el="div"
          >
            <StylingToggleGroup label={labels.letterCase}>
              <FieldToggleGroup
                name={`${name}-textTransform`}
                value={current.textTransform}
                readOnly={readOnly}
                deselectable
                onChange={textTransform => update({ textTransform })}
                options={textTransformValues.map(letterCase => ({
                  value: letterCase,
                  label: labels.letterCases[letterCase],
                  icon: letterCaseIcons[letterCase],
                }))}
              />
            </StylingToggleGroup>
          </FieldLabel>
        </FieldGroup.Item>
      </StylingGroupSection>

      <StylingGroupSection
        {...groupProps('background')}
        icon={<LuPaintBucket size={16} />}
      >
        <FieldGroup.Item>
          <ColorFieldRender
            {...sub('background')}
            field={{ type: 'color', label: labels.backgroundColour }}
            value={current.background}
            onChange={background => update({ background })}
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <FieldLabel
            label={labels.image}
            readOnly={readOnly}
            el="div"
          >
            <ImagePicker
              value={current.backgroundImage}
              readOnly={readOnly}
              onChange={backgroundImage =>
                update(
                  backgroundImage ?
                    { backgroundImage }
                  : {
                      backgroundImage: undefined,
                      backgroundSize: undefined,
                      backgroundPosition: undefined,
                    }
                )
              }
            />
          </FieldLabel>
        </FieldGroup.Item>

        {current.backgroundImage && (
          <FieldGroup.Item>
            <FieldLabel
              label={labels.imageSize}
              readOnly={readOnly}
              el="div"
            >
              <StylingToggleGroup label={labels.imageSize}>
                <FieldToggleGroup
                  name={`${name}-backgroundSize`}
                  value={current.backgroundSize ?? defaultBackgroundSize}
                  readOnly={readOnly}
                  onChange={backgroundSize => update({ backgroundSize })}
                  options={backgroundSizeValues.map(size => ({
                    value: size,
                    label: labels.imageSizes[size],
                    icon: (
                      <StylingOptionText>
                        {labels.imageSizes[size]}
                      </StylingOptionText>
                    ),
                  }))}
                />
              </StylingToggleGroup>
            </FieldLabel>
          </FieldGroup.Item>
        )}

        {current.backgroundImage && (
          <FieldGroup.Item>
            <FieldLabel
              label={labels.position}
              readOnly={readOnly}
              el="div"
            >
              <BackgroundPositionInput
                name={`${name}-backgroundPosition`}
                label={labels.position}
                value={current.backgroundPosition ?? defaultBackgroundPosition}
                readOnly={readOnly}
                onChange={backgroundPosition => update({ backgroundPosition })}
              />
            </FieldLabel>
          </FieldGroup.Item>
        )}

        <FieldGroup.Item>
          <ColorFieldRender
            {...sub('overlay')}
            field={{ type: 'color', label: labels.overlay }}
            value={current.overlay}
            onChange={overlay =>
              update(
                overlay ?
                  { overlay }
                : { overlay: undefined, overlayOpacity: undefined }
              )
            }
          />
        </FieldGroup.Item>

        {current.overlay && (
          <FieldGroup.Item>
            <FieldLabel
              label={labels.overlayOpacity}
              readOnly={readOnly}
              el="div"
            >
              <PercentSlider
                label={labels.overlayOpacity}
                value={current.overlayOpacity}
                defaultValue={defaultOverlayOpacity}
                readOnly={readOnly}
                onChange={overlayOpacity => update({ overlayOpacity })}
              />
            </FieldLabel>
          </FieldGroup.Item>
        )}
      </StylingGroupSection>

      <StylingGroupSection
        {...groupProps('spacing')}
        icon={<LuBox size={16} />}
      >
        <FieldGroup.Item>
          <BoxModelInput
            name={`${name}-spacing`}
            margin={current.margin}
            padding={current.padding}
            marginSides={field.marginSides}
            readOnly={readOnly}
            onMarginChange={margin => update({ margin })}
            onPaddingChange={padding => update({ padding })}
          />
        </FieldGroup.Item>
      </StylingGroupSection>

      <StylingGroupSection
        {...groupProps('border')}
        icon={<LuSquareDashed size={16} />}
      >
        <FieldGroup.Item>
          <BorderFieldRender
            {...sub('border')}
            field={{ type: 'border', label: labels.border }}
            value={current.border}
            onChange={border => update({ border })}
          />
        </FieldGroup.Item>

        <FieldGroup.Item>
          <FieldLabel
            label={labels.cornerRadius}
            readOnly={readOnly}
            el="div"
          >
            <CornerRadiusInput
              value={current.borderRadius}
              readOnly={readOnly}
              onChange={borderRadius => update({ borderRadius })}
            />
          </FieldLabel>
        </FieldGroup.Item>
      </StylingGroupSection>

      <StylingGroupSection
        {...groupProps('size')}
        icon={<LuRuler size={16} />}
      >
        <FieldGroup.Item>
          <FieldLabel
            label={labels.minHeight}
            readOnly={readOnly}
            el="div"
          >
            <LengthInput
              label={labels.minHeight}
              icon={LuMoveVertical}
              units={minHeightUnits}
              value={current.minHeight}
              readOnly={readOnly}
              onChange={minHeight => update({ minHeight })}
            />
          </FieldLabel>
        </FieldGroup.Item>

        <FieldGroup.Item>
          <FieldLabel
            label={labels.maxWidth}
            readOnly={readOnly}
            el="div"
          >
            <MaxWidthInput
              label={labels.maxWidth}
              customLabel={labels.customMaxWidth}
              icon={LuMoveHorizontal}
              value={current.maxWidth}
              readOnly={readOnly}
              onChange={maxWidth => update({ maxWidth })}
            />
          </FieldLabel>
        </FieldGroup.Item>
      </StylingGroupSection>

      <StylingGroupSection
        {...groupProps('effects')}
        icon={<LuSparkles size={16} />}
      >
        <FieldGroup.Item>
          <FieldLabel
            label={labels.shadow}
            readOnly={readOnly}
            el="div"
          >
            <ShadowInput
              name={`${name}-shadow`}
              label={labels.shadow}
              value={current.shadow}
              readOnly={readOnly}
              onChange={shadow => update({ shadow })}
            />
          </FieldLabel>
        </FieldGroup.Item>

        <FieldGroup.Item>
          <FieldLabel
            label={labels.opacity}
            readOnly={readOnly}
            el="div"
          >
            <PercentSlider
              label={labels.opacity}
              value={current.opacity}
              defaultValue={100}
              readOnly={readOnly}
              onChange={opacity => update({ opacity })}
            />
          </FieldLabel>
        </FieldGroup.Item>
      </StylingGroupSection>
    </StylingGroups>
  );
};
