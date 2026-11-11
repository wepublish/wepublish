import {
  Box,
  Button,
  FormControlLabel,
  FormHelperText,
  List,
  ListItem,
  Menu,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { TFunction } from 'i18next';
import {
  KeyboardEvent,
  memo,
  ReactNode,
  RefObject,
  useId,
  useRef,
  useState,
} from 'react';
import {
  Controller,
  get,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdClose, MdErrorOutline } from 'react-icons/md';

import { LengthSlider, UnitConfig } from './length-slider';
import {
  fitToRange,
  inheritedValue,
  mediaQuery,
  missingScreenSizes,
  ResponsiveProperty,
  ScreenSize,
  screenSizes,
  screenSizesWithErrors,
  screenSizeWidth,
  usedScreenSizes,
  withoutScreenSize,
  withScreenSize,
} from './typography-breakpoints';

export type SelectedScreenSize = 'xs' | ScreenSize;

export const screenSizeTabId = (
  prefix: string,
  screenSize: SelectedScreenSize
) => `${prefix}-tab-${screenSize}`;

export const screenSizePanelId = (
  prefix: string,
  screenSize: SelectedScreenSize
) => `${prefix}-panel-${screenSize}`;

const inheritedDescription = (
  t: TFunction,
  inherited: ReturnType<typeof inheritedValue>
) =>
  !inherited ? t('websiteSettings.theme.typography.inheritedNone')
  : inherited.from === 'browser' ?
    t('websiteSettings.theme.typography.inheritedFromBrowser', {
      value: inherited.value,
    })
  : inherited.from === 'theme' ?
    t('websiteSettings.theme.typography.inheritedFromTheme', {
      value: inherited.value,
    })
  : inherited.from === 'xs' ?
    t('websiteSettings.theme.typography.inheritedFromBaseline', {
      value: inherited.value,
    })
  : inherited.from === 'allVariants' ?
    t('websiteSettings.theme.typography.inheritedFromGeneral', {
      value: inherited.value,
    })
  : t('websiteSettings.theme.typography.inheritedFromWidth', {
      value: inherited.value,
      name: inherited.from,
      width: screenSizeWidth(inherited.from),
    });

const replacedDescription = (
  t: TFunction,
  inherited: ReturnType<typeof inheritedValue>
) =>
  !inherited ? t('websiteSettings.theme.typography.replacesNone')
  : inherited.from === 'browser' ?
    t('websiteSettings.theme.typography.replacesFromBrowser', {
      value: inherited.value,
    })
  : inherited.from === 'theme' ?
    t('websiteSettings.theme.typography.replacesFromTheme', {
      value: inherited.value,
    })
  : inherited.from === 'xs' ?
    t('websiteSettings.theme.typography.replacesFromBaseline', {
      value: inherited.value,
    })
  : inherited.from === 'allVariants' ?
    t('websiteSettings.theme.typography.replacesFromGeneral', {
      value: inherited.value,
    })
  : t('websiteSettings.theme.typography.replacesFromWidth', {
      value: inherited.value,
      name: inherited.from,
      width: screenSizeWidth(inherited.from),
    });

export const overrideDescription = (
  t: TFunction,
  inherited: ReturnType<typeof inheritedValue>,
  overriding: boolean
) =>
  overriding ?
    replacedDescription(t, inherited)
  : inheritedDescription(t, inherited);

type ScreenSizeNameProps = {
  screenSize: ScreenSize;
};

export const ScreenSizeName = ({ screenSize }: ScreenSizeNameProps) => {
  const { t } = useTranslation();

  return (
    <>
      {screenSize}{' '}
      <Box
        component="span"
        sx={{ color: 'text.secondary', fontSize: '0.85em', fontWeight: 400 }}
      >
        {t('websiteSettings.theme.typography.fromWidth', {
          width: screenSizeWidth(screenSize),
        })}
      </Box>
    </>
  );
};

export type ScreenSizeTabRefs = RefObject<
  Partial<Record<SelectedScreenSize, HTMLElement | null>>
>;

type ScreenSizeTabsProps = {
  idPrefix: string;
  name: string;
  selected: SelectedScreenSize;
  tabRefs: ScreenSizeTabRefs;
  onSelect: (screenSize: SelectedScreenSize) => void;
};

export const ScreenSizeTabs = memo<ScreenSizeTabsProps>(
  ({ idPrefix, name, selected, tabRefs, onSelect }) => {
    const { t } = useTranslation();
    const { control, getValues, setValue } = useFormContext();
    const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
    const addButtonRef = useRef<HTMLButtonElement>(null);
    const tabRef =
      (screenSize: SelectedScreenSize) => (tab: HTMLElement | null) => {
        tabRefs.current[screenSize] = tab;
      };
    const buttonId = `${idPrefix}-add`;
    const menuId = `${idPrefix}-add-menu`;
    const removeHintId = `${idPrefix}-remove-hint`;

    const overrides = useWatch({
      control,
      name: screenSizes.map(screenSize => `${name}.${mediaQuery(screenSize)}`),
    });
    const item = Object.fromEntries(
      screenSizes.map((screenSize, index) => [
        mediaQuery(screenSize),
        overrides[index],
      ])
    );
    const { errors } = useFormState({ control, name });
    const used = usedScreenSizes(item);
    const missing = missingScreenSizes(item);
    const withErrors = screenSizesWithErrors(get(errors, name));

    const removeScreenSize = (screenSize: ScreenSize) => {
      const current = getValues(name);
      const removed = current?.[mediaQuery(screenSize)];
      const index = used.indexOf(screenSize);

      setValue(name, withoutScreenSize(current, screenSize), {
        shouldDirty: true,
      });
      onSelect(index > 0 ? used[index - 1] : 'xs');

      enqueueSnackbar(
        t('websiteSettings.theme.typography.screenSizeRemoved', {
          name: screenSize,
        }),
        {
          action: {
            label: t('websiteSettings.theme.typography.undo'),
            onClick: () => {
              setValue(
                name,
                withScreenSize(getValues(name), screenSize, removed),
                { shouldDirty: true }
              );
              onSelect(screenSize);
            },
          },
        }
      );
    };

    const tabLabel = (screenSize: SelectedScreenSize, text: ReactNode) => {
      const hasErrors = withErrors.includes(screenSize);
      const removable = screenSize !== 'xs' && screenSize === selected;
      return {
        label: (
          <>
            <Box
              component="span"
              sx={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                lineHeight: 1.25,
              }}
            >
              {text}
              {hasErrors && (
                <Box
                  component="span"
                  sx={visuallyHidden}
                >
                  {t('websiteSettings.theme.typography.hasErrors')}
                </Box>
              )}
            </Box>

            {removable && (
              <Box
                component="span"
                aria-hidden
                data-testid="remove-screen-size"
                onClick={event => {
                  event.stopPropagation();
                  removeScreenSize(screenSize);
                }}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: 4,
                  transform: 'translateY(-50%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
                }}
              >
                <MdClose size={16} />
              </Box>
            )}
          </>
        ) as ReactNode,
        ...(hasErrors ?
          {
            icon: <MdErrorOutline aria-hidden />,
            iconPosition: 'end' as const,
          }
        : {}),
        sx: {
          position: 'relative',
          ...(removable ? { pr: 4.5 } : {}),
          ...(hasErrors ? { color: 'error.main' } : {}),
        },
        ...(screenSize !== 'xs' ?
          {
            'aria-keyshortcuts': 'Delete',
            'aria-describedby': removeHintId,
            onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
              if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                removeScreenSize(screenSize);
              }
            },
          }
        : {}),
      };
    };

    const closeMenu = () => {
      setMenuAnchor(null);
      addButtonRef.current?.focus();
    };

    const addScreenSize = (screenSize: ScreenSize) => {
      setValue(
        name,
        withScreenSize(getValues(name), screenSize, {
          fontSize: null,
          lineHeight: null,
          letterSpacing: null,
        }),
        {
          shouldDirty: true,
        }
      );
      setMenuAnchor(null);
      onSelect(screenSize);
    };

    return (
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={selected}
          onChange={(_event, value: SelectedScreenSize) => onSelect(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label={t('websiteSettings.theme.typography.screenSizes')}
          sx={{
            flex: 1,
            minWidth: 0,
            '& .MuiTab-root': { textTransform: 'none' },
          }}
        >
          <Tab
            value="xs"
            {...tabLabel('xs', t('websiteSettings.theme.typography.baseline'))}
            id={screenSizeTabId(idPrefix, 'xs')}
            aria-controls={screenSizePanelId(idPrefix, 'xs')}
            ref={tabRef('xs')}
          />

          {used.map(screenSize => (
            <Tab
              key={screenSize}
              value={screenSize}
              {...tabLabel(
                screenSize,
                <ScreenSizeName screenSize={screenSize} />
              )}
              id={screenSizeTabId(idPrefix, screenSize)}
              aria-controls={screenSizePanelId(idPrefix, screenSize)}
              ref={tabRef(screenSize)}
            />
          ))}
        </Tabs>

        <Button
          id={buttonId}
          ref={addButtonRef}
          size="small"
          startIcon={<MdAdd />}
          disabled={!missing.length}
          aria-haspopup="menu"
          aria-expanded={menuAnchor ? 'true' : undefined}
          aria-controls={menuAnchor ? menuId : undefined}
          onClick={event => setMenuAnchor(event.currentTarget)}
          sx={{ flexShrink: 0 }}
        >
          {t('websiteSettings.theme.typography.addScreenSize')}
        </Button>

        <Box
          id={removeHintId}
          component="span"
          sx={visuallyHidden}
        >
          {t('websiteSettings.theme.typography.removeScreenSizeHint')}
        </Box>

        <Menu
          id={menuId}
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={closeMenu}
          disableRestoreFocus
          slotProps={{ list: { 'aria-labelledby': buttonId } }}
        >
          {missing.map(screenSize => (
            <MenuItem
              key={screenSize}
              onClick={() => addScreenSize(screenSize)}
              sx={{ gap: 3, justifyContent: 'space-between' }}
            >
              <ScreenSizeName screenSize={screenSize} />
            </MenuItem>
          ))}
        </Menu>
      </Stack>
    );
  }
);

type OverrideFieldProps = {
  name: string;
  parentName: string;
  variant: string;
  screenSize: ScreenSize;
  property: ResponsiveProperty;
  fallback: string;
  defaultUnit: 'em' | 'rem' | 'px';
  unitConfig: UnitConfig;
};

const OverrideField = ({
  name,
  parentName,
  variant,
  screenSize,
  property,
  fallback,
  defaultUnit,
  unitConfig,
}: OverrideFieldProps) => {
  const { t } = useTranslation();
  const { control } = useFormContext();
  const helperId = useId();

  const item = useWatch({ control, name });
  const allVariants = useWatch({ control, name: `${parentName}.allVariants` });
  const inherited = inheritedValue(
    item,
    allVariants,
    property,
    screenSize,
    variant
  );
  const width = screenSizeWidth(screenSize);
  const label = t('websiteSettings.theme.typography.fieldAtWidth', {
    label: t(`websiteSettings.theme.typography.${property}`),
    name: screenSize,
    width,
  });

  return (
    <Controller
      name={`${name}.${mediaQuery(screenSize)}.${property}`}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Stack
          direction="column"
          sx={{ width: '100%' }}
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
            label={t(`websiteSettings.theme.typography.${property}`)}
          />

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
              defaultUnit={defaultUnit}
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

type ScreenSizeOverridesProps = {
  name: string;
  parentName: string;
  variant: string;
  screenSize: ScreenSize;
  fontSizeConfig: UnitConfig;
  lineHeightConfig: UnitConfig;
  letterSpacingConfig: UnitConfig;
};

export const ScreenSizeOverrides = memo<ScreenSizeOverridesProps>(
  ({
    name,
    parentName,
    variant,
    screenSize,
    fontSizeConfig,
    lineHeightConfig,
    letterSpacingConfig,
  }) => {
    const { t } = useTranslation();
    const width = screenSizeWidth(screenSize);

    return (
      <List>
        <ListItem>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            {t('websiteSettings.theme.typography.screenSizeInfo', { width })}
          </Typography>
        </ListItem>

        <ListItem>
          <OverrideField
            name={name}
            parentName={parentName}
            variant={variant}
            screenSize={screenSize}
            property="fontSize"
            fallback="1rem"
            defaultUnit="rem"
            unitConfig={fontSizeConfig}
          />
        </ListItem>

        <ListItem>
          <OverrideField
            name={name}
            parentName={parentName}
            variant={variant}
            screenSize={screenSize}
            property="lineHeight"
            fallback="1.4em"
            defaultUnit="em"
            unitConfig={lineHeightConfig}
          />
        </ListItem>

        <ListItem>
          <OverrideField
            name={name}
            parentName={parentName}
            variant={variant}
            screenSize={screenSize}
            property="letterSpacing"
            fallback="0em"
            defaultUnit="em"
            unitConfig={letterSpacingConfig}
          />
        </ListItem>
      </List>
    );
  }
);
