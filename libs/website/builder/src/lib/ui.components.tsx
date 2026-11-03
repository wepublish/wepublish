import {
  BuilderAlertProps,
  BuilderButtonProps,
  BuilderIconButtonProps,
  BuilderModalProps,
  BuilderPaginationProps,
  BuilderRatingProps,
  BuilderTextFieldProps,
} from './ui.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Button = (props: BuilderButtonProps) => {
  const {
    elements: { Button },
  } = useWebsiteBuilder();

  return <Button {...props} />;
};

export const IconButton = (props: BuilderIconButtonProps) => {
  const {
    elements: { IconButton },
  } = useWebsiteBuilder();

  return <IconButton {...props} />;
};

export const Modal = (props: BuilderModalProps) => {
  const {
    elements: { Modal },
  } = useWebsiteBuilder();

  return <Modal {...props} />;
};

export const Alert = (props: BuilderAlertProps) => {
  const {
    elements: { Alert },
  } = useWebsiteBuilder();

  return <Alert {...props} />;
};

export const Rating = (props: BuilderRatingProps) => {
  const {
    elements: { Rating },
  } = useWebsiteBuilder();

  return <Rating {...props} />;
};

export const TextField = (props: BuilderTextFieldProps) => {
  const {
    elements: { TextField },
  } = useWebsiteBuilder();

  return <TextField {...props} />;
};

export const Pagination = (props: BuilderPaginationProps) => {
  const {
    elements: { Pagination },
  } = useWebsiteBuilder();

  return <Pagination {...props} />;
};
