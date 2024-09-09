import {Box, styled, Typography} from '@mui/material'
import {createUniqueFieldSchema, useFieldInfo, useTsController} from '@ts-react/form'
import {useCallback} from 'react'
import {DropzoneOptions, useDropzone} from 'react-dropzone'
import {z} from 'zod'
import {deepUnwrap, isArray} from '../../form/hooks'
import {MdAddAPhoto} from 'react-icons/md'

const IMAGE_BRANDING = 'image'

export const ImageInputSchema = createUniqueFieldSchema(z.string(), IMAGE_BRANDING)
export const ImageArrayInputSchema = createUniqueFieldSchema(z.array(z.string()), IMAGE_BRANDING)

const Dropzone = styled('div')<{isDragActive: boolean}>`
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

export function ImageInput() {
  const {zodType} = useFieldInfo()
  const {field, error} = useTsController<string | string[]>()

  const allowMultipleImages = isArray(deepUnwrap(zodType))

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
