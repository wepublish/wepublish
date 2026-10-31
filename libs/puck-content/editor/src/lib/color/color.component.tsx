import { Popover } from '@mui/material';
import { FieldLabel, FieldProps } from '@puckeditor/core';
import {
  Alpha,
  HsvaColor,
  hsvaToRgba,
  Hue,
  rgbaToHsva,
  Saturation,
} from '@uiw/react-color';
import { KeyboardEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown } from 'react-icons/lu';

import { FieldInput } from '../field-controls';
import { useWebsiteTheme } from '../website-theme';
import {
  ColorSwatch,
  ColorSwatchRadioGroup,
  ColorSwatchRow,
} from './color-swatches.component';
import {
  ColorField,
  ColorValue,
  filterThemeColorGroups,
  findThemeColor,
  formatColorHex,
  getThemeColorGroups,
  humanizeColorKey,
  isHexColor,
  isThemeColor,
  parseHexInput,
  resolvePaletteColor,
  ThemeColorGroup,
  ThemeColorPath,
  toHexColor,
  toRgba,
} from './color.field';
import {
  ColorCustomEditor,
  ColorFieldError,
  ColorHexLabel,
  ColorHexRow,
  ColorMatchHint,
  ColorPickerSurface,
  ColorTabButton,
  ColorTabList,
  ColorTextButton,
  ColorTrigger,
  ColorTriggerText,
} from './color.styles';

type ColorTab = 'theme' | 'custom';

const useColorLabels = () => {
  const { t } = useTranslation();

  return {
    colour: t('', 'Colour'),
    default: t('', 'Default'),
    tabs: {
      theme: t('', 'Theme'),
      custom: t('', 'Custom'),
    } satisfies Record<ColorTab, string>,
    source: t('', 'Colour source'),
    themeColours: t('', 'Theme colours'),
    hex: t('', 'Hex'),
    invalidHex: t('', 'Enter a hex colour such as #1A1A1A.'),
    matchesTheme: t('', 'Matches the theme colour'),
    useThemeColour: t('', 'Use theme colour'),
    saturation: t('', 'Saturation and brightness'),
    hue: t('', 'Hue'),
    opacity: t('', 'Opacity'),
    groups: {
      primary: t('', 'Primary'),
      secondary: t('', 'Secondary'),
      accent: t('', 'Accent'),
      success: t('', 'Success'),
      error: t('', 'Error'),
      info: t('', 'Info'),
      warning: t('', 'Warning'),
      text: t('', 'Text'),
      background: t('', 'Background'),
      common: t('', 'Common'),
    } as Partial<Record<string, string>>,
    shades: {
      main: t('', 'Main'),
      light: t('', 'Light'),
      dark: t('', 'Dark'),
      contrastText: t('', 'Contrast text'),
      primary: t('', 'Primary'),
      secondary: t('', 'Secondary'),
      disabled: t('', 'Disabled'),
      default: t('', 'Default'),
      paper: t('', 'Paper'),
      black: t('', 'Black'),
      white: t('', 'White'),
    } as Partial<Record<string, string>>,
  };
};

type ColorLabels = ReturnType<typeof useColorLabels>;

const groupLabel = (labels: ColorLabels, group: string) =>
  labels.groups[group] ?? humanizeColorKey(group);

const describeThemeColor = (labels: ColorLabels, path: ThemeColorPath) => {
  const [group, shade] = path.split('.');

  return `${groupLabel(labels, group)} · ${labels.shades[shade] ?? humanizeColorKey(shade)}`;
};

const describeColor = (labels: ColorLabels, value: ColorValue | undefined) => {
  if (!value) {
    return labels.default;
  }

  if (isThemeColor(value)) {
    return describeThemeColor(labels, value);
  }

  return isHexColor(value) ? value.toUpperCase() : value;
};

const sliderStep = (event: KeyboardEvent<HTMLDivElement>) => {
  const size = event.shiftKey ? 10 : 1;

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return size;
    case 'ArrowLeft':
    case 'ArrowDown':
      return -size;
    default:
      return undefined;
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const fallbackHsva: HsvaColor = { h: 0, s: 0, v: 0, a: 1 };

const toHsva = (color: string | undefined) => {
  const rgba = color ? toRgba(color) : undefined;

  return rgba ? rgbaToHsva(rgba) : fallbackHsva;
};

type CustomColorEditorProps = {
  labels: ColorLabels;
  value: string | undefined;
  initialColor: string | undefined;
  allowedColors: readonly string[] | undefined;
  autoFocus: boolean;
  onChange: (value: string) => void;
  onUseThemeColor: (path: ThemeColorPath) => void;
};

const CustomColorEditor = ({
  labels,
  value,
  initialColor,
  allowedColors,
  autoFocus,
  onChange,
  onUseThemeColor,
}: CustomColorEditorProps) => {
  const theme = useWebsiteTheme();
  const inputId = useId();
  const errorId = useId();
  const [draft, setDraft] = useState(() => {
    if (value) {
      return value;
    }

    const rgba = initialColor ? toRgba(initialColor) : undefined;

    return rgba ? toHexColor(rgba) : '';
  });
  const [hsva, setHsva] = useState(() => toHsva(value ?? initialColor));
  const [touched, setTouched] = useState(false);
  const invalid = touched && draft.trim() !== '' && !parseHexInput(draft);
  const match = value ? findThemeColor(theme, value, allowedColors) : undefined;

  const commit = (hex: string) => {
    if (hex !== value) {
      onChange(hex);
    }
  };

  const handleDraftChange = (input: string) => {
    setDraft(input);

    const hex = parseHexInput(input);
    const rgba = hex ? toRgba(hex) : undefined;

    if (!hex || !rgba) {
      return;
    }

    setTouched(false);
    setHsva(rgbaToHsva(rgba));
    commit(hex);
  };

  const handlePickerChange = (next: HsvaColor) => {
    const hex = toHexColor(hsvaToRgba(next));

    setHsva(next);
    setDraft(hex);
    setTouched(false);
    commit(hex);
  };

  const handleHueKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = sliderStep(event);

    if (step !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      handlePickerChange({ ...hsva, h: clamp(hsva.h + step, 0, 360) });
    }
  };

  const handleAlphaKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = sliderStep(event);

    if (step !== undefined) {
      event.preventDefault();
      event.stopPropagation();
      handlePickerChange({ ...hsva, a: clamp(hsva.a + step / 100, 0, 1) });
    }
  };

  return (
    <ColorCustomEditor>
      <Saturation
        hsva={hsva}
        radius="var(--puck-radius-m)"
        style={{ width: '100%', height: 136 }}
        role="slider"
        aria-label={labels.saturation}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsva.s)}
        aria-valuetext={`${Math.round(hsva.s)}%, ${Math.round(hsva.v)}%`}
        onChange={handlePickerChange}
      />

      <Hue
        hue={hsva.h}
        width="100%"
        height={12}
        radius={6}
        innerProps={{
          role: 'slider',
          'aria-label': labels.hue,
          'aria-valuemin': 0,
          'aria-valuemax': 360,
          'aria-valuenow': Math.round(hsva.h),
        }}
        onKeyDownCapture={handleHueKeyDown}
        onChange={({ h }) => handlePickerChange({ ...hsva, h })}
      />

      <Alpha
        hsva={hsva}
        width="100%"
        height={12}
        radius={6}
        innerProps={{
          role: 'slider',
          'aria-label': labels.opacity,
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-valuenow': Math.round(hsva.a * 100),
          'aria-valuetext': `${Math.round(hsva.a * 100)}%`,
        }}
        onKeyDownCapture={handleAlphaKeyDown}
        onChange={({ a }) => handlePickerChange({ ...hsva, a })}
      />

      <ColorHexRow>
        <ColorSwatch color={value} />
        <ColorHexLabel htmlFor={inputId}>{labels.hex}</ColorHexLabel>
        <FieldInput
          id={inputId}
          value={draft}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          maxLength={9}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={event => handleDraftChange(event.currentTarget.value)}
          onBlur={() => setTouched(true)}
        />
      </ColorHexRow>

      {invalid && (
        <ColorFieldError id={errorId}>{labels.invalidHex}</ColorFieldError>
      )}

      <div role="status">
        {match && (
          <ColorMatchHint>
            <span>
              {labels.matchesTheme}{' '}
              <strong>{describeThemeColor(labels, match)}</strong>
            </span>

            <ColorTextButton
              type="button"
              onClick={() => onUseThemeColor(match)}
            >
              {labels.useThemeColour}
            </ColorTextButton>
          </ColorMatchHint>
        )}
      </div>
    </ColorCustomEditor>
  );
};

type ColorPickerPanelProps = {
  labels: ColorLabels;
  label: string;
  value: ColorValue | undefined;
  groups: ThemeColorGroup[];
  allowedColors: readonly string[] | undefined;
  allowCustom: boolean;
  onChange: (value: ColorValue | undefined) => void;
  onClose: () => void;
};

const ColorPickerPanel = ({
  labels,
  label,
  value,
  groups,
  allowedColors,
  allowCustom,
  onChange,
  onClose,
}: ColorPickerPanelProps) => {
  const theme = useWebsiteTheme();
  const baseId = useId();
  const tabButtons = useRef<
    Partial<Record<ColorTab, HTMLButtonElement | null>>
  >({});
  const isCustom = !!value && !isThemeColor(value);
  const tabs: ColorTab[] = allowCustom ? ['theme', 'custom'] : ['theme'];
  const [tab, setTab] = useState<ColorTab>(
    allowCustom && isCustom ? 'custom' : 'theme'
  );
  const [focusPanel, setFocusPanel] = useState(true);
  const hasTabs = tabs.length > 1;

  const rows: ColorSwatchRow<string>[] = [
    {
      key: 'default',
      options: [
        {
          value: '',
          label: labels.default,
          color: undefined,
          showLabel: true,
        },
      ],
    },
    ...groups.map(({ group, shades }) => ({
      key: group,
      label: groupLabel(labels, group),
      options: shades.map(shade => {
        const path: ThemeColorPath = `${group}.${shade}`;
        const color = resolvePaletteColor(theme, path);

        return {
          value: path,
          label: describeThemeColor(labels, path),
          color,
          detail: formatColorHex(color),
        };
      }),
    })),
  ];

  const selectTab = (next: ColorTab) => {
    setFocusPanel(false);
    setTab(next);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
      return;
    }

    event.preventDefault();

    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(tabs.indexOf(tab) + offset + tabs.length) % tabs.length];

    selectTab(next);
    tabButtons.current[next]?.focus();
  };

  const panelProps = (panel: ColorTab) =>
    hasTabs ?
      {
        role: 'tabpanel',
        id: `${baseId}-panel-${panel}`,
        'aria-labelledby': `${baseId}-tab-${panel}`,
      }
    : {};

  return (
    <ColorPickerSurface>
      {hasTabs && (
        <ColorTabList
          role="tablist"
          aria-label={`${label} · ${labels.source}`}
        >
          {tabs.map(option => (
            <ColorTabButton
              key={option}
              ref={element => {
                tabButtons.current[option] = element;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${option}`}
              aria-selected={tab === option}
              aria-controls={`${baseId}-panel-${option}`}
              tabIndex={tab === option ? 0 : -1}
              onClick={() => selectTab(option)}
              onKeyDown={handleTabKeyDown}
            >
              {labels.tabs[option]}
            </ColorTabButton>
          ))}
        </ColorTabList>
      )}

      {tab === 'theme' ?
        <div {...panelProps('theme')}>
          <ColorSwatchRadioGroup
            label={labels.themeColours}
            rows={rows}
            value={value ?? ''}
            autoFocus={focusPanel}
            onChange={next => onChange(next || undefined)}
            onPick={onClose}
          />
        </div>
      : <div {...panelProps('custom')}>
          <CustomColorEditor
            labels={labels}
            value={isCustom ? value : undefined}
            initialColor={resolvePaletteColor(theme, value)}
            allowedColors={allowedColors}
            autoFocus={focusPanel}
            onChange={onChange}
            onUseThemeColor={path => {
              onChange(path);
              setFocusPanel(true);
              setTab('theme');
            }}
          />
        </div>
      }
    </ColorPickerSurface>
  );
};

export type ColorFieldRenderProps = FieldProps<
  ColorField,
  ColorValue | undefined
> & {
  name: string;
};

export const ColorFieldRender = ({
  field,
  id,
  value,
  onChange,
  readOnly,
}: ColorFieldRenderProps) => {
  const labels = useColorLabels();
  const theme = useWebsiteTheme();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const label = field.label ?? labels.colour;
  const valueLabel = describeColor(labels, value);
  const groups = filterThemeColorGroups(
    getThemeColorGroups(theme.palette),
    field.colors
  );

  return (
    <FieldLabel
      label={label}
      readOnly={readOnly}
      el="div"
    >
      <ColorTrigger
        id={id}
        type="button"
        aria-label={`${label}: ${valueLabel}`}
        aria-haspopup="dialog"
        aria-expanded={!!anchor}
        disabled={readOnly}
        onClick={event => {
          event.currentTarget.focus();
          setAnchor(event.currentTarget);
        }}
      >
        <ColorSwatch color={resolvePaletteColor(theme, value)} />
        <ColorTriggerText>{valueLabel}</ColorTriggerText>
        <LuChevronDown aria-hidden="true" />
      </ColorTrigger>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { role: 'dialog', 'aria-label': label } }}
        onClose={() => setAnchor(null)}
      >
        <ColorPickerPanel
          labels={labels}
          label={label}
          value={value}
          groups={groups}
          allowedColors={field.colors}
          allowCustom={field.allowCustom ?? true}
          onChange={next => onChange(next)}
          onClose={() => setAnchor(null)}
        />
      </Popover>
    </FieldLabel>
  );
};
