import {BuilderAlertProps, BuilderButtonProps, BuilderModalProps} from './ui.interface'
import {useWebsiteBuilder} from './website-builder.context'

export const Button = (props: BuilderButtonProps) => {
  const {
    elements: {Button}
  } = useWebsiteBuilder()

  return <Button {...props} />
}

export const Modal = (props: BuilderModalProps) => {
  const {
    elements: {Modal}
  } = useWebsiteBuilder()

  return <Modal {...props} />
}

export const Alert = (props: BuilderAlertProps) => {
  const {
    elements: {Alert}
  } = useWebsiteBuilder()

  return <Alert {...props} />
}
