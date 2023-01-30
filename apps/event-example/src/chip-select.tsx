import * as React from 'react'
import {Theme, useTheme} from '@mui/material/styles'
import Box from '@mui/material/Box'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, {SelectChangeEvent} from '@mui/material/Select'
import Chip from '@mui/material/Chip'
import {Tag} from '@wepublish/editor/api'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
}

function getStyles(id: string, ids: readonly string[], theme: Theme) {
  return {
    fontWeight: ids.includes(id)
      ? theme.typography.fontWeightRegular
      : theme.typography.fontWeightMedium
  }
}

export type ChipSelectProps = {
  tags?: Tag[]
  value?: Tag['id'][]
  onChange?: (value: Tag['id'][]) => void
}

export function ChipSelect({tags, onChange, value: selectedTags}: ChipSelectProps) {
  const theme = useTheme()

  const handleChange = (event: SelectChangeEvent<typeof selectedTags>) => {
    const {
      target: {value}
    } = event
    onChange?.(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    )
  }

  return (
    <FormControl>
      <InputLabel id="demo-multiple-chip-label">Tags</InputLabel>
      <Select
        labelId="demo-multiple-chip-label"
        id="demo-multiple-chip"
        multiple
        value={selectedTags}
        onChange={handleChange}
        input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
        renderValue={selected => (
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
            {selected.map(value => (
              <Chip key={value} label={tags.find(tag => tag.id === value)?.tag} />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}>
        {tags?.map(tag => (
          <MenuItem key={tag.id} value={tag.id} style={getStyles(tag.id, selectedTags, theme)}>
            {tag.tag}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
