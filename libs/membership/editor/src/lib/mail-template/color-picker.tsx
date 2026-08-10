import styled from '@emotion/styled';
import { Box, ClickAwayListener, Popper, Tooltip } from '@mui/material';
import { Sketch } from '@uiw/react-color';
import { useWebsiteSettingsQuery } from '@wepublish/editor/api';
import { useMemo, useRef, useState } from 'react';

const ElevatedPopper = styled(Popper)`
  z-index: 1400;
`;

/**
 * The colours configured under Settings › Website › Theme, flattened into a
 * swatch list. Offering them here keeps mails on brand without anyone having
 * to look up a hex value.
 */
export const useThemePresetColors = (): string[] => {
  const { data } = useWebsiteSettingsQuery();

  return useMemo(() => {
    const theme = data?.websiteSettings?.theme as
      | Record<string, unknown>
      | undefined;
    const palette = theme?.['palette'] as Record<string, unknown> | undefined;

    if (!palette) {
      return [];
    }

    const colors: string[] = [];

    const collect = (value: unknown) => {
      if (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value)) {
        colors.push(value);

        return;
      }

      if (value && typeof value === 'object') {
        Object.values(value).forEach(collect);
      }
    };

    collect(palette);

    // Preserve the order the theme defines them in, minus duplicates.
    return [...new Set(colors)];
  }, [data]);
};

export interface MailColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Called before the picker opens — used to snapshot the editor selection. */
  onOpen?: () => void;
  title?: string;
  size?: number;
}

/**
 * The same picker as the website theme settings (`@uiw/react-color` Sketch in a
 * popper), extended with the theme's own colours as one-click presets. Emits
 * 6-digit hex: mail clients handle alpha channels inconsistently.
 */
export function MailColorPicker({
  value,
  onChange,
  onOpen,
  title,
  size = 32,
}: MailColorPickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const presetColors = useThemePresetColors();

  const swatch = (
    <Box
      ref={anchorRef}
      onMouseDown={event => {
        // Keep the caret in the editor: opening the picker must not steal it.
        event.preventDefault();
        onOpen?.();
      }}
      onClick={() => setOpen(current => !current)}
      sx={theme => ({
        width: size,
        height: size,
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: value || '#000000',
        border: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
      })}
    />
  );

  return (
    <>
      {title ?
        <Tooltip title={title}>{swatch}</Tooltip>
      : swatch}

      <ElevatedPopper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        onKeyDown={event => {
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box>
            <Sketch
              color={value}
              disableAlpha
              presetColors={presetColors.length ? presetColors : undefined}
              onChange={color => onChange(color.hex)}
            />
          </Box>
        </ClickAwayListener>
      </ElevatedPopper>
    </>
  );
}
