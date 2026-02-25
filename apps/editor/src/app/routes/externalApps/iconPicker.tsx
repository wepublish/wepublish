import { Autocomplete, Box, TextField } from '@mui/material';
import React, { useMemo } from 'react';
import { ICON_REGISTRY } from './iconRegistry';

interface IconPickerProps {
  value?: string;
  onChange: (value?: string) => void;
  iconRegistry?: typeof ICON_REGISTRY;
}

type IconPickerItem = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
};

export const IconPickerSelect = ({
  value,
  onChange,
  iconRegistry = ICON_REGISTRY,
}: IconPickerProps) => {
  const data = useMemo<IconPickerItem[]>(
    () =>
      Object.entries(iconRegistry).map(([iconKey, iconData]) => ({
        label: iconData.label,
        value: iconKey,
        icon: iconData.icon,
      })),
    [iconRegistry]
  );

  return (
    <Autocomplete
      options={data}
      getOptionLabel={option => option.label}
      value={data.find(item => item.value === value) || null}
      onChange={(_, newValue) => {
        onChange(newValue?.value);
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        const IconComponent = option.icon;
        return (
          <Box
            component="li"
            key={key}
            {...optionProps}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <IconComponent size={20} />
            {option.label}
          </Box>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label="Select Icon"
          variant="outlined"
          InputProps={{
            ...params.InputProps,
            startAdornment:
              value && data.find(item => item.value === value) ?
                <Box
                  sx={{ display: 'flex', alignItems: 'center', mr: 1, ml: 1 }}
                >
                  {(() => {
                    const selectedItem = data.find(
                      item => item.value === value
                    );
                    if (selectedItem) {
                      const IconComponent = selectedItem.icon;
                      return <IconComponent size={20} />;
                    }
                    return null;
                  })()}
                </Box>
              : null,
          }}
        />
      )}
    />
  );
};
