import React, {useContext} from 'react'

import {
  Typography,
  Box,
  Spacing,
  Grid,
  Column,
  PrimaryButton,
  pxToRem,
  BorderRadius,
  BorderWidth,
  ThemeContext
} from '@karma.run/ui'

import {styled} from '@karma.run/react'

const Image = styled(
  'img',
  ({theme}) => ({
    width: '100%',
    height: '200px',
    borderWidth: BorderWidth.Small,
    borderColor: theme.colors.grayLight,
    borderStyle: 'solid',
    borderRadius: pxToRem(BorderRadius.Small),
    objectFit: 'cover'
  }),
  () => ({theme: useContext(ThemeContext)})
)

export function MediaList() {
  return (
    <>
      <Box flexDirection="row" marginBottom={Spacing.Medium} flex>
        <Typography variant="h1">Media Library</Typography>
        <Box flexGrow={1} />
        <PrimaryButton label="Upload Image" />
      </Box>
      <Box>
        <Grid spacing={Spacing.Small}>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
          <Column ratio={1 / 3}></Column>
        </Grid>
      </Box>
    </>
  )
}
