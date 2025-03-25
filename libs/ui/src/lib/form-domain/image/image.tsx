import {Box, Typography} from '@mui/material'
import {useCallback} from 'react'
import {DropzoneOptions, useDropzone} from 'react-dropzone'
import {MdAddAPhoto} from 'react-icons/md'
import * as v from 'valibot'
import {InputComponentProps, isArraySchema} from '@wepublish/website/form-builder'
import styled from '@emotion/styled'

const IMAGE_BRANDING = 'image'
export const ImageInputSchema = v.pipe(v.string(), v.brand(IMAGE_BRANDING))
export const ImageArrayInputSchema = v.pipe(v.array(v.string()), v.brand(IMAGE_BRANDING))

const Dropzone = styled.div<{isDragActive: boolean}>`
  display: grid;
  align-items: center;
  justify-items: center;
  justify-self: center;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16/9;
  padding: ${({theme}) => theme.spacing(3)};
  margin-bottom: ${({theme}) => theme.spacing(2)};

  background-color: ${({theme}) => theme.palette.grey[50]};
  color: ${({theme}) => theme.palette.grey[700]};
  border: 2px dashed ${({theme}) => theme.palette.grey[400]};
  border-radius: 4px;
`

export function ImageInput({
  field,
  fieldState: {error},
  description,
  title,
  name,
  schema
}: InputComponentProps) {
  const allowMultipleImages = isArraySchema(schema)

  const onDrop = useCallback(acceptedFiles => {
    console.log(acceptedFiles)
  }, []) as Exclude<DropzoneOptions['onDrop'], undefined>

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    preventDropOnDocument: true,
    maxFiles: allowMultipleImages ? 0 : 1
  })

  return (
    <Dropzone {...getRootProps()} isDragActive={isDragActive}>
      <input {...getInputProps()} />

      <Box sx={{display: 'grid', justifyItems: 'center', gap: 1}}>
        <MdAddAPhoto size={36} css={{opacity: 0.4}} />

        <Typography variant="body1">Click or drop to upload image</Typography>
      </Box>
    </Dropzone>
  )
}
