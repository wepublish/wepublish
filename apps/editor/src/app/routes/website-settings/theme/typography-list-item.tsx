import {
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { MdExpandLess, MdExpandMore, MdFormatSize } from 'react-icons/md';
import * as z from 'zod';

import { typographyItem } from './schema';

type TypographyListItemProps = {
  defaultValue: z.infer<typeof typographyItem>;
  isOpen: boolean;
  name: string;
  onOpen: () => void;
};

export const TypographyListItem = ({
  name,
  defaultValue,
  isOpen,
  onOpen,
}: TypographyListItemProps) => {
  const { t } = useTranslation();
  const { control, watch } = useFormContext();

  return (
    <>
      <ListItemButton onClick={onOpen}>
        <ListItemText
          primary={
            isOpen ?
              <span
                css={{
                  fontSize: watch(`${name}.fontSize`),
                  lineHeight: watch(`${name}.lineHeight`),
                }}
              >
                {t(`websiteSettings.theme.${name}`)}
              </span>
            : t(`websiteSettings.theme.${name}`)
          }
        />

        {isOpen ?
          <MdExpandLess />
        : <MdExpandMore />}
      </ListItemButton>

      <Collapse
        timeout="auto"
        in={isOpen}
      >
        <List component="div">
          <ListItem>
            <Controller
              name={`${name}.fontSize`}
              control={control}
              defaultValue={defaultValue.fontSize}
              render={({ field, fieldState: { error } }) => (
                <Box sx={{ width: '100%' }}>
                  <Stack
                    spacing={3}
                    direction="row"
                    sx={{ alignItems: 'center', mb: 1 }}
                  >
                    <MdFormatSize
                      size={22}
                      css={{ width: '48px' }}
                    />

                    <Slider
                      {...field}
                      min={8}
                      max={100}
                      step={1}
                      color="primary"
                      size={'small'}
                      valueLabelDisplay="on"
                    />

                    <MdFormatSize
                      size={48}
                      css={{ width: '48px' }}
                    />
                  </Stack>

                  <Box
                    sx={{
                      display: 'flex',
                      padding: '0 calc(48px + 12px)',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2">8px</Typography>
                    <Typography variant="body2">{field.value}px</Typography>
                    <Typography variant="body2">100px</Typography>
                  </Box>
                </Box>
              )}
            />
          </ListItem>

          <ListItem>
            <Controller
              name={`${name}.lineHeight`}
              control={control}
              defaultValue={defaultValue.lineHeight}
              render={({ field, fieldState: { error } }) => (
                <Stack
                  spacing={3}
                  direction="row"
                  sx={{ alignItems: 'center', mb: 1, width: '100%' }}
                >
                  <Slider
                    {...field}
                    min={1}
                    max={3}
                    step={0.1}
                    color="primary"
                    size={'small'}
                    valueLabelDisplay="on"
                    marks={[
                      { value: 1, label: '1em' },
                      { value: 3, label: '3em' },
                    ]}
                  />
                </Stack>
              )}
            />
          </ListItem>
        </List>
      </Collapse>
    </>
  );
};
