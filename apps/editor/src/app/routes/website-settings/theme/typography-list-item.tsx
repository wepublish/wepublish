import {
  Box,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Switch,
  useMediaQuery,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { InfoTooltip } from '@wepublish/ui/editor';
import { memo, Ref, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Controller,
  get,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

import { AvailableFontsPicker } from './available-fonts-picker';
import { FontWeightSelect } from './font-weight-select';
import { LengthSlider, UnitConfig } from './length-slider';
import { TextTransformSelect } from './text-transform-select';
import {
  fitToRange,
  inheritedValue,
  isMediaQuery,
  mediaQuery,
  overriddenScreenSizes,
  resolvedStyles,
  screenSizesWithErrors,
  screenSizeWidth,
  usedScreenSizes,
} from './typography-breakpoints';
import {
  overrideDescription,
  ScreenSizeOverrides,
  screenSizePanelId,
  screenSizeTabId,
  ScreenSizeTabRefs,
  ScreenSizeTabs,
  SelectedScreenSize,
} from './typography-screen-sizes';
import { useTypographySummary } from './typography-summary';

export const fontSizeConfig: UnitConfig = {
  em: { min: 0.5, max: 6.5, step: 0.05 },
  rem: { min: 0.5, max: 6.5, step: 0.05 },
  px: { min: 8, max: 100, step: 1 },
};

export const lineHeightConfig: UnitConfig = {
  em: { min: 1, max: 3, step: 0.1 },
  rem: { min: 1, max: 3, step: 0.1 },
  px: { min: 12, max: 60, step: 1 },
};

export const letterSpacingConfig: UnitConfig = {
  em: { min: -0.1, max: 0.2, step: 0.005 },
  rem: { min: -0.1, max: 1.5, step: 0.005 },
  px: { min: -2, max: 5, step: 0.2 },
};

type AllScreensOverrideFieldProps = {
  name: string;
  parentName: string;
  variant: string;
  property: 'lineHeight' | 'letterSpacing';
  fallback: string;
  unitConfig: UnitConfig;
};

const AllScreensOverrideField = ({
  name,
  parentName,
  variant,
  property,
  fallback,
  unitConfig,
}: AllScreensOverrideFieldProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const helperId = useId();
  const label = t(`websiteSettings.theme.typography.${property}`);

  const allVariants = useWatch({ control, name: `${parentName}.allVariants` });
  const inherited = inheritedValue(
    undefined,
    allVariants,
    property,
    'xs',
    variant
  );

  return (
    <Controller
      name={`${name}.${property}`}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Stack
          direction="column"
          sx={{ width: '100%' }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center' }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={field.value != null}
                  onChange={(_event, checked) =>
                    field.onChange(
                      checked ?
                        fitToRange(inherited?.value ?? fallback, unitConfig)
                      : null
                    )
                  }
                  slotProps={{ input: { 'aria-describedby': helperId } }}
                />
              }
              label={label}
              sx={{ mr: 0.5 }}
            />

            <InfoTooltip
              text={t('websiteSettings.theme.typography.overrideInfo')}
            />
          </Stack>

          <FormHelperText
            id={helperId}
            sx={{ mt: 0, mb: 1 }}
          >
            {overrideDescription(t, inherited, field.value != null)}
          </FormHelperText>

          {field.value != null && (
            <LengthSlider
              {...field}
              error={error}
              defaultUnit="em"
              unitConfig={unitConfig}
              label={label}
              unitLabel={t('websiteSettings.theme.typography.unitOf', {
                label,
              })}
              describedBy={helperId}
            />
          )}
        </Stack>
      )}
    />
  );
};

const standardEasing = 'cubic-bezier(0.2, 0, 0, 1)';

const plainStyles = {
  fontSize: '1rem',
  lineHeight: 1.5,
  letterSpacing: '0em',
  fontWeight: 400,
  textTransform: 'none',
  fontStyle: 'normal',
} as const;

type TypographyListItemProps = {
  headerId?: string;
  headerRef?: Ref<HTMLDivElement>;
  isOpen: boolean;
  compact?: boolean;
  name: string;
  parentName: string;
  onOpen: () => void;
  onOpened?: () => void;
  onClosed?: () => void;
};

export const TypographyListItem = memo<TypographyListItemProps>(
  ({
    headerId: givenHeaderId,
    headerRef,
    name,
    parentName,
    isOpen,
    compact,
    onOpen,
    onOpened,
    onClosed,
  }) => {
    const { t } = useTranslation();
    const { control, setFocus, subscribe } = useFormContext();
    const { errors, submitCount } = useFormState({ control, name });
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const [playAnimation, setPlayAnimation] = useState(true);
    const [animatedFor, setAnimatedFor] = useState(isOpen);
    const [framed, setFramed] = useState(isOpen);
    const [selected, setSelected] = useState<SelectedScreenSize>('xs');
    const focusTab = useRef<SelectedScreenSize>(undefined);
    const tabRefs: ScreenSizeTabRefs = useRef({});
    const focusError = useRef<SelectedScreenSize>(undefined);
    const handledSubmitCount = useRef(submitCount);
    const idPrefix = useId();
    const headerId = givenHeaderId ?? `${idPrefix}-header`;
    const regionId = `${idPrefix}-region`;
    const fontFamilyLabelId = `${idPrefix}-font-family`;
    const fontWeightLabelId = `${idPrefix}-font-weight`;
    const textTransformLabelId = `${idPrefix}-text-transform`;
    const fontSizeLabel = t('websiteSettings.theme.typography.fontSize');
    const variant = name.split('.').pop() ?? name;

    const item = useWatch({ control, name });
    const allVariants = useWatch({
      control,
      name: `${parentName}.allVariants`,
    });

    if (animatedFor !== isOpen) {
      setAnimatedFor(isOpen);
      setPlayAnimation(true);
    }

    useEffect(() => {
      const timeout = setTimeout(() => {
        setPlayAnimation(false);
      }, 250);

      return () => {
        clearTimeout(timeout);
      };
    }, [isOpen]);

    useEffect(() => {
      if (focusTab.current) {
        tabRefs.current[focusTab.current]?.focus();
        focusTab.current = undefined;
      }
    });

    const activeScreenSize: SelectedScreenSize =
      selected !== 'xs' && item?.[mediaQuery(selected)] ? selected : 'xs';
    const previewScreenSize = isOpen ? activeScreenSize : 'xs';

    useEffect(
      () =>
        subscribe({
          formState: { submitCount: true, errors: true },
          callback: state => {
            const count = state.submitCount ?? handledSubmitCount.current;

            if (handledSubmitCount.current === count) {
              return;
            }

            handledSubmitCount.current = count;

            const [first] =
              isOpen ? screenSizesWithErrors(get(state.errors, name)) : [];

            if (first) {
              focusError.current = first;
              setSelected(first);
            }
          },
        }),
      [subscribe, isOpen, name]
    );

    useEffect(() => {
      const screenSize = focusError.current;

      if (!screenSize || screenSize !== activeScreenSize) {
        return;
      }

      focusError.current = undefined;

      const path =
        screenSize === 'xs' ? name : `${name}.${mediaQuery(screenSize)}`;
      const [property] = Object.keys(get(errors, path) ?? {}).filter(
        key => !isMediaQuery(key)
      );

      if (property) {
        setFocus(`${path}.${property}`);
      }
    });

    const selectScreenSize = (screenSize: SelectedScreenSize) => {
      focusTab.current = screenSize;
      setSelected(screenSize);
    };

    const onClick = () => {
      setPlayAnimation(true);
      onOpen();
    };

    const plain = compact && !isOpen;
    const animate = playAnimation && !reducedMotion;

    const styles = useMemo(() => {
      const resolved = resolvedStyles(
        item,
        allVariants,
        previewScreenSize,
        variant
      );
      const { fontFamily, fontWeight, textTransform, fontStyle } = resolved;

      return {
        ...(animate ? { transition: `all 250ms ${standardEasing}` } : {}),
        ...(!plain ? resolved
        : framed ?
          { ...plainStyles, fontFamily, fontWeight, textTransform, fontStyle }
        : plainStyles),
      };
    }, [plain, framed, animate, item, allVariants, previewScreenSize, variant]);

    const summary = useTypographySummary(item, allVariants, variant);
    const overridden = overriddenScreenSizes(item);

    return (
      <Box
        component="li"
        sx={{
          listStyle: 'none',
          borderRadius: 0.75,
          border: 1,
          borderColor: isOpen || framed ? 'divider' : 'transparent',
          mb: 1,
          ...(isOpen || framed ? { pb: 1 } : {}),
        }}
      >
        <ListItemButton
          id={headerId}
          ref={headerRef}
          aria-expanded={isOpen}
          aria-controls={regionId}
          onClick={onClick}
          sx={{ borderRadius: 0.75, gap: 1 }}
        >
          <ListItemText
            primary={
              <span css={styles}>{t(`websiteSettings.theme.${name}`)}</span>
            }
            secondary={summary || undefined}
          />

          {!!overridden.length && (
            <>
              <Stack
                direction="row"
                aria-hidden
                sx={{ gap: 0.5, flexShrink: 0 }}
              >
                {overridden.map(screenSize => (
                  <Chip
                    key={screenSize}
                    label={screenSize}
                    title={t('websiteSettings.theme.typography.fromWidth', {
                      width: screenSizeWidth(screenSize),
                    })}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>

              <Box
                component="span"
                sx={visuallyHidden}
              >
                {t('websiteSettings.theme.typography.screenSizeOverrides', {
                  names: overridden
                    .map(screenSize =>
                      t('websiteSettings.theme.typography.screenSizeName', {
                        name: screenSize,
                        width: screenSizeWidth(screenSize),
                      })
                    )
                    .join(', '),
                })}
              </Box>
            </>
          )}

          {isOpen ?
            <MdExpandLess aria-hidden />
          : <MdExpandMore aria-hidden />}
        </ListItemButton>

        <Collapse
          id={regionId}
          role="region"
          aria-labelledby={headerId}
          timeout={reducedMotion ? 0 : { enter: 250, exit: 200 }}
          easing={standardEasing}
          in={isOpen}
          onEnter={() => setFramed(true)}
          onEntered={onOpened}
          onExited={() => {
            setFramed(false);
            onClosed?.();
          }}
          mountOnEnter
          unmountOnExit
        >
          <Stack sx={{ maxWidth: 800 }}>
            <ScreenSizeTabs
              idPrefix={idPrefix}
              name={name}
              selected={activeScreenSize}
              tabRefs={tabRefs}
              onSelect={selectScreenSize}
            />

            <div
              role="tabpanel"
              hidden={activeScreenSize !== 'xs'}
              id={screenSizePanelId(idPrefix, 'xs')}
              aria-labelledby={screenSizeTabId(idPrefix, 'xs')}
            >
              {activeScreenSize === 'xs' && (
                <List>
                  <ListItem>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ width: '100%' }}
                    >
                      <FormControl fullWidth>
                        <FormLabel>
                          <span id={fontFamilyLabelId}>
                            {t('websiteSettings.theme.typography.fontFamily')}
                          </span>{' '}
                          <InfoTooltip
                            text={t(
                              'websiteSettings.theme.typography.fontFamilyInfo'
                            )}
                          />
                        </FormLabel>

                        <Controller
                          name={`${name}.fontFamily`}
                          control={control}
                          render={({ field }) => (
                            <AvailableFontsPicker
                              {...field}
                              labelId={fontFamilyLabelId}
                            />
                          )}
                        />
                      </FormControl>

                      <FormControl fullWidth>
                        <FormLabel id={fontWeightLabelId}>
                          {t('websiteSettings.theme.typography.fontWeight')}
                        </FormLabel>

                        <Controller
                          name={`${name}.fontWeight`}
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <FontWeightSelect
                              {...field}
                              error={error}
                              labelId={fontWeightLabelId}
                            />
                          )}
                        />
                      </FormControl>
                    </Stack>
                  </ListItem>

                  <ListItem>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ width: '100%' }}
                    >
                      <FormControl fullWidth>
                        <FormLabel>
                          <span id={textTransformLabelId}>
                            {t(
                              'websiteSettings.theme.typography.textTransform'
                            )}
                          </span>{' '}
                          <InfoTooltip
                            text={t(
                              'websiteSettings.theme.typography.textTransformInfo'
                            )}
                          />
                        </FormLabel>

                        <Controller
                          name={`${name}.textTransform`}
                          control={control}
                          render={({ field, fieldState: { error } }) => (
                            <TextTransformSelect
                              {...field}
                              error={error}
                              labelId={textTransformLabelId}
                            />
                          )}
                        />
                      </FormControl>

                      <Stack
                        sx={{
                          width: '100%',
                          alignSelf: 'flex-end',
                          justifyContent: 'center',
                          minHeight: 40,
                        }}
                      >
                        <Controller
                          name={`${name}.fontStyle`}
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={field.value === 'italic'}
                                  onChange={(_event, checked) =>
                                    field.onChange(checked ? 'italic' : null)
                                  }
                                  onBlur={field.onBlur}
                                />
                              }
                              label={t(
                                'websiteSettings.theme.typography.italic'
                              )}
                            />
                          )}
                        />
                      </Stack>
                    </Stack>
                  </ListItem>

                  <ListItem>
                    <FormControl fullWidth>
                      <FormLabel>
                        {fontSizeLabel}{' '}
                        <InfoTooltip
                          text={t(
                            'websiteSettings.theme.typography.fontSizeInfo'
                          )}
                        />
                      </FormLabel>

                      <Controller
                        name={`${name}.fontSize`}
                        control={control}
                        render={({ field, fieldState: { error } }) => (
                          <LengthSlider
                            {...field}
                            error={error}
                            defaultUnit="rem"
                            unitConfig={fontSizeConfig}
                            label={fontSizeLabel}
                            unitLabel={t(
                              'websiteSettings.theme.typography.unitOf',
                              { label: fontSizeLabel }
                            )}
                          />
                        )}
                      />
                    </FormControl>
                  </ListItem>

                  <ListItem>
                    <AllScreensOverrideField
                      name={name}
                      parentName={parentName}
                      variant={variant}
                      property="lineHeight"
                      fallback="1.4em"
                      unitConfig={lineHeightConfig}
                    />
                  </ListItem>

                  <ListItem>
                    <AllScreensOverrideField
                      name={name}
                      parentName={parentName}
                      variant={variant}
                      property="letterSpacing"
                      fallback="0em"
                      unitConfig={letterSpacingConfig}
                    />
                  </ListItem>
                </List>
              )}
            </div>

            {usedScreenSizes(item).map(screenSize => (
              <div
                key={screenSize}
                role="tabpanel"
                hidden={activeScreenSize !== screenSize}
                id={screenSizePanelId(idPrefix, screenSize)}
                aria-labelledby={screenSizeTabId(idPrefix, screenSize)}
              >
                {activeScreenSize === screenSize && (
                  <ScreenSizeOverrides
                    name={name}
                    parentName={parentName}
                    variant={variant}
                    screenSize={screenSize}
                    fontSizeConfig={fontSizeConfig}
                    lineHeightConfig={lineHeightConfig}
                    letterSpacingConfig={letterSpacingConfig}
                  />
                )}
              </div>
            ))}
          </Stack>
        </Collapse>
      </Box>
    );
  }
);
