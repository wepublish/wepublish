import { Tooltip } from '@mui/material';
import { KeyboardEvent, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuLink2, LuLink2Off } from 'react-icons/lu';

import { Side, sides, SidesValue } from '../sides/sides';
import { SpacingValue } from '../spacing/spacing';
import { useWebsiteTheme } from '../website-theme';
import {
  areSpacingKeysUniform,
  formatSpacingInput,
  linkSpacingKeys,
  parseSpacingInput,
  setSpacingKeys,
  stepSpacingValue,
} from './box-model';
import { useLinkedSpacingKeys } from './box-model.hooks';
import {
  BoxModelContent,
  BoxModelFrame,
  BoxModelHint,
  BoxModelInner,
  BoxModelLinkCell,
  BoxModelRing,
  BoxModelRingLabel,
  BoxModelSideCell,
  BoxModelSideUnavailable,
  SpacingLinkToggle,
  SpacingTextField,
} from './box-model.styles';

export type SpacingTextInputProps = {
  label: string;
  value: SpacingValue | undefined;
  onChange: (value: SpacingValue | undefined) => void;
  readOnly?: boolean;
  placeholder?: string;
  describedBy?: string;
};

export const SpacingTextInput = ({
  label,
  value,
  onChange,
  readOnly,
  placeholder = '–',
  describedBy,
}: SpacingTextInputProps) => {
  const [draft, setDraft] = useState<string>();
  const invalid = draft !== undefined && !parseSpacingInput(draft).valid;

  const change = (raw: string) => {
    const result = parseSpacingInput(raw);
    setDraft(raw);

    if (result.valid && result.value !== value) {
      onChange(result.value);
    }
  };

  const step = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    setDraft(undefined);
    onChange(
      stepSpacingValue(
        value,
        (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? 10 : 1)
      )
    );
  };

  return (
    <Tooltip
      title={label}
      disableInteractive
    >
      <SpacingTextField
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={draft ?? formatSpacingInput(value)}
        placeholder={placeholder}
        disabled={readOnly}
        onChange={event => change(event.currentTarget.value)}
        onKeyDown={step}
        onBlur={() => setDraft(undefined)}
      />
    </Tooltip>
  );
};

export type SpacingLinkButtonProps = {
  label: string;
  linked: boolean;
  onToggle: () => void;
  readOnly?: boolean;
};

export const SpacingLinkButton = ({
  label,
  linked,
  onToggle,
  readOnly,
}: SpacingLinkButtonProps) => (
  <Tooltip
    title={label}
    disableInteractive
  >
    <SpacingLinkToggle
      type="button"
      aria-label={label}
      aria-pressed={linked}
      disabled={readOnly}
      onClick={onToggle}
    >
      {linked ?
        <LuLink2
          size={14}
          aria-hidden
        />
      : <LuLink2Off
          size={14}
          aria-hidden
        />
      }
    </SpacingLinkToggle>
  </Tooltip>
);

const useBoxModelLabels = () => {
  const { t } = useTranslation();

  return {
    margin: t('', 'Margin'),
    padding: t('', 'Padding'),
    sides: {
      margin: {
        top: t('', 'Margin top'),
        right: t('', 'Margin right'),
        bottom: t('', 'Margin bottom'),
        left: t('', 'Margin left'),
      } satisfies Record<Side, string>,
      padding: {
        top: t('', 'Padding top'),
        right: t('', 'Padding right'),
        bottom: t('', 'Padding bottom'),
        left: t('', 'Padding left'),
      } satisfies Record<Side, string>,
    },
    link: {
      margin: t('', 'Link margin sides'),
      padding: t('', 'Link padding sides'),
    },
    unavailable: t('', 'Not available for this component'),
    hint: (unit: number) =>
      t(
        '',
        'Numbers are theme units (1 = {{unit}}px), add px for exact pixels. Arrow keys change the value.',
        { unit }
      ),
  };
};

type SpacingRingProps = {
  kind: 'margin' | 'padding';
  value: SidesValue | undefined;
  allowed: Side[];
  onChange: (value: SidesValue) => void;
  readOnly?: boolean;
  describedBy?: string;
  children: ReactNode;
};

const SpacingRing = ({
  kind,
  value,
  allowed,
  onChange,
  readOnly,
  describedBy,
  children,
}: SpacingRingProps) => {
  const labels = useBoxModelLabels();
  const [linked, setLinked] = useLinkedSpacingKeys(value, allowed);

  const changeSide = (side: Side, amount: SpacingValue | undefined) =>
    onChange(setSpacingKeys(value, linked ? allowed : [side], amount));

  const toggleLinked = () => {
    setLinked(!linked);

    if (!linked && !areSpacingKeysUniform(value, allowed)) {
      onChange(linkSpacingKeys(value, allowed));
    }
  };

  return (
    <BoxModelRing
      ringKind={kind}
      role="group"
      aria-label={labels[kind]}
    >
      <BoxModelRingLabel aria-hidden>{labels[kind]}</BoxModelRingLabel>

      <BoxModelLinkCell>
        <SpacingLinkButton
          label={labels.link[kind]}
          linked={linked}
          readOnly={readOnly}
          onToggle={toggleLinked}
        />
      </BoxModelLinkCell>

      {sides.map(side => (
        <BoxModelSideCell
          key={side}
          gridArea={side}
        >
          {allowed.includes(side) ?
            <SpacingTextInput
              label={labels.sides[kind][side]}
              value={value?.[side]}
              readOnly={readOnly}
              describedBy={describedBy}
              onChange={amount => changeSide(side, amount)}
            />
          : <Tooltip
              title={labels.unavailable}
              disableInteractive
            >
              <BoxModelSideUnavailable>–</BoxModelSideUnavailable>
            </Tooltip>
          }
        </BoxModelSideCell>
      ))}

      <BoxModelInner>{children}</BoxModelInner>
    </BoxModelRing>
  );
};

export type BoxModelInputProps = {
  name: string;
  margin: SidesValue | undefined;
  padding: SidesValue | undefined;
  onMarginChange: (value: SidesValue) => void;
  onPaddingChange: (value: SidesValue) => void;
  marginSides?: Side[];
  readOnly?: boolean;
};

export const BoxModelInput = ({
  name,
  margin,
  padding,
  onMarginChange,
  onPaddingChange,
  marginSides = sides,
  readOnly,
}: BoxModelInputProps) => {
  const labels = useBoxModelLabels();
  const theme = useWebsiteTheme();
  const unit = parseFloat(theme.spacing(1)) || 8;
  const hintId = `${name}-hint`;

  return (
    <BoxModelFrame>
      <SpacingRing
        kind="margin"
        value={margin}
        allowed={marginSides}
        readOnly={readOnly}
        describedBy={hintId}
        onChange={onMarginChange}
      >
        <SpacingRing
          kind="padding"
          value={padding}
          allowed={sides}
          readOnly={readOnly}
          describedBy={hintId}
          onChange={onPaddingChange}
        >
          <BoxModelContent aria-hidden />
        </SpacingRing>
      </SpacingRing>

      <BoxModelHint id={hintId}>{labels.hint(unit)}</BoxModelHint>
    </BoxModelFrame>
  );
};
