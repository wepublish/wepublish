import {Modal as MuiModal} from '@mui/material'
import styled from '@emotion/styled'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export const ModalWrapper = styled('section')`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80lvw;
  max-width: 800px;
  background-color: ${({theme}) => theme.palette.background.paper};
  box-shadow: ${({theme}) => theme.shadows[24]};
  padding: ${({theme}) => theme.spacing(2)};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

export const ModalContent = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => theme.spacing(2)};
  padding-bottom: 0;
`

export const ModalActions = styled('div')`
  display: flex;
  justify-content: end;
  gap: ${({theme}) => theme.spacing(3)};
`

export type ModalProps = {
  className?: string
  open: boolean
  submitText: string
  onCancel: () => void
  onSubmit: () => void
}

export const Modal = ({
  className,
  open,
  onCancel,
  onSubmit,
  submitText,
  children
}: PropsWithChildren<ModalProps>) => {
  const {
    elements: {Button}
  } = useWebsiteBuilder()

  return (
    <MuiModal open={open} onClose={onCancel}>
      <ModalWrapper className={className}>
        <ModalContent>{children}</ModalContent>

        <ModalActions>
          <Button onClick={onCancel} variant="text" color="secondary">
            Abbrechen
          </Button>

          <Button onClick={onSubmit}>{submitText}</Button>
        </ModalActions>
      </ModalWrapper>
    </MuiModal>
  )
}
