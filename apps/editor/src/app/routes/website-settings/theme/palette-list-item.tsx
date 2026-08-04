import styled from '@emotion/styled';
import {
  capitalize,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  SimplePaletteColorOptions,
  TypeBackground,
  TypeText,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

import { ColorPicker } from './color-picker';

const ThemeColorReel = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: 2px;
  margin-right: 12px;
`;

export const ThemeColorItem = styled.div<{ colorstr?: string | null }>(
  ({ theme, colorstr }) => `
  width: 25px;
  height: 25px;
  background-color: ${colorstr ?? '#000'};
  border: 1px solid ${theme.palette.divider};
  border-radius: 4px;
`
);

type PaletteListItemProps<
  Keys extends
    | Array<keyof SimplePaletteColorOptions>
    | Array<keyof TypeBackground>
    | Array<keyof TypeText>
    | undefined,
> = {
  keys?: Keys;
  isOpen: boolean;
  name: string;
  onOpen: () => void;
};

export const PaletteListItem = <
  Keys extends
    | Array<keyof SimplePaletteColorOptions>
    | Array<keyof TypeBackground>
    | Array<keyof TypeText>
    | undefined,
>({
  name,
  keys,
  isOpen,
  onOpen,
}: PaletteListItemProps<Keys>) => {
  const { t } = useTranslation();
  const { control, watch } = useFormContext();

  return (
    <>
      <ListItemButton onClick={onOpen}>
        <ListItemText primary={t(`websiteSettings.theme.${name}`)} />

        <ThemeColorReel>
          {keys ?
            keys.map(key => (
              <ThemeColorItem
                key={key}
                colorstr={watch(`${name}.${key}`)}
              />
            ))
          : <ThemeColorItem colorstr={watch(`${name}`)} />}
        </ThemeColorReel>

        {isOpen ?
          <MdExpandLess />
        : <MdExpandMore />}
      </ListItemButton>

      <Collapse
        timeout="auto"
        in={isOpen}
        mountOnEnter
        unmountOnExit
      >
        <List
          component="ul"
          disablePadding
        >
          {keys?.map(key => (
            <ListItem
              key={key}
              sx={{ py: 1.5 }}
            >
              <Controller
                name={`${name}.${key}`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <ColorPicker
                    {...field}
                    label={t(`websiteSettings.theme.palette.${key}`)}
                    helperText={
                      <Trans
                        i18nKey={t(
                          `websiteSettings.theme.${name}${capitalize(key)}`
                        )}
                      />
                    }
                    error={error}
                  />
                )}
              />
            </ListItem>
          ))}

          {!keys && (
            <ListItem>
              <Controller
                name={name}
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <ColorPicker
                    {...field}
                    label={t(`websiteSettings.theme.${name}`)}
                    error={error}
                    helperText={t(`websiteSettings.theme.${name}HelperText`)}
                  />
                )}
              />
            </ListItem>
          )}
        </List>
      </Collapse>
    </>
  );
};
