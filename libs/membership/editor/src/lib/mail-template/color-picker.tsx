import { useQuery } from '@apollo/client/react';
import { Box, Popover, Tooltip } from '@mui/material';
import { Sketch } from '@uiw/react-color';
import { WebsiteSettingsDocument } from '@wepublish/editor/api';
import { useId, useMemo, useRef, useState } from 'react';

/**
 * The colours configured under Settings › Website › Theme, flattened into a
 * swatch list. Offering them here keeps mails on brand without anyone having
 * to look up a hex value.
 */
export const useThemePresetColors = (): string[] => {
  const { data } = useQuery(WebsiteSettingsDocument);

  return useMemo(() => {
    const theme = data?.websiteSettings?.theme as
      Record<string, unknown> | undefined;
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
  label?: string;
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
  label,
  size = 32,
}: MailColorPickerProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const presetColors = useThemePresetColors();
  const dialogId = useId();

  const swatch = (
    <Box
      ref={anchorRef}
      role="button"
      tabIndex={0}
      aria-label={title ?? label}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? dialogId : undefined}
      onMouseDown={event => {
        // Keep the caret in the editor: opening the picker must not steal it.
        event.preventDefault();
        onOpen?.();
      }}
      onClick={() => setOpen(current => !current)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.();
          setOpen(current => !current);
        }
      }}
      sx={theme => ({
        width: size,
        height: size,
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: value || '#000000',
        border: `1px solid ${theme.vars.palette.divider}`,
        flexShrink: 0,
      })}
    />
  );

  return (
    <>
      {title ?
        <Tooltip title={title}>{swatch}</Tooltip>
      : swatch}

      <Popover
        id={dialogId}
        open={open}
        anchorEl={() => anchorRef.current!}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-label': title ?? label,
          },
        }}
      >
        <Sketch
          color={value}
          disableAlpha
          presetColors={presetColors.length ? presetColors : undefined}
          onChange={color => onChange(color.hex)}
        />
      </Popover>
    </>
  );
}
