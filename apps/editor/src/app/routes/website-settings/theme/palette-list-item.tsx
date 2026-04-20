import styled from '@emotion/styled';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  SimplePaletteColorOptions,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore } from 'react-icons/md';

import { ColorPicker } from './color-picker';

const ThemeColorReel = styled.div`
  display: flex;
  flex-flow: row wrap;
  padding: 1px;
  margin-right: 12px;
`;

const ThemeColorItem = styled.div<{ colorstr?: string | null }>(
  ({ theme, colorstr }) => `
  width: 25px;
  height: 25px;
  margin-right: -1px;
  margin-left: -1px;
  border: 1px solid #000;
  background-color: ${colorstr ?? '#000'};
`
);

type PaletteListItemProps<
  Keys extends Array<keyof SimplePaletteColorOptions> | undefined,
> = {
  defaultValue: Keys extends Array<keyof SimplePaletteColorOptions> ?
    SimplePaletteColorOptions
  : string | null | undefined;
  keys?: Keys;
  isOpen: boolean;
  name: string;
  onOpen: () => void;
};

export const PaletteListItem = <
  Keys extends Array<keyof SimplePaletteColorOptions> | undefined,
>({
  name,
  keys,
  defaultValue,
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
      >
        <List
          component="div"
          disablePadding
        >
          {keys?.map(key => (
            <ListItem key={key}>
              <Controller
                name={`${name}.${key}`}
                control={control}
                defaultValue={(defaultValue as SimplePaletteColorOptions)[key]}
                render={({ field, fieldState: { error } }) => (
                  <ColorPicker
                    {...field}
                    label={t(`websiteSettings.theme.palette.${key}`)}
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
                defaultValue={defaultValue}
                render={({ field, fieldState: { error } }) => (
                  <ColorPicker
                    {...field}
                    label={t(`websiteSettings.theme.${name}`)}
                    error={error}
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
