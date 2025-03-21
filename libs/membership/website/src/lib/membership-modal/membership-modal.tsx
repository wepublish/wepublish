import {Modal} from '@mui/material'
import styled from '@emotion/styled'
import {useWebsiteBuilder} from '@wepublish/website/builder'
import {PropsWithChildren} from 'react'

export const MembershipModalWrapper = styled('section')`
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

export const MembershipModalContent = styled('div')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => theme.spacing(2)};
  padding-bottom: 0;
`

export const MembershipModalActions = styled('div')`
  display: flex;
  justify-content: end;
  gap: ${({theme}) => theme.spacing(3)};
`

export type MembershipModalProps = {
  className?: string
  open: boolean
  submitText: string
  onCancel: () => void
  onSubmit: () => void
}

export const MembershipModal = ({
  className,
  open,
  onCancel,
  onSubmit,
  submitText,
  children
}: PropsWithChildren<MembershipModalProps>) => {
  const {
    elements: {Button}
  } = useWebsiteBuilder()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description">
      <MembershipModalWrapper className={className}>
        <MembershipModalContent>{children}</MembershipModalContent>

        <MembershipModalActions>
          <Button onClick={onCancel} variant="text" color="secondary">
            Abbrechen
          </Button>

          <Button onClick={onSubmit}>{submitText}</Button>
        </MembershipModalActions>
      </MembershipModalWrapper>
    </Modal>
  )
}
