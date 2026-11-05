import styled from '@emotion/styled';
import { Modal as MuiModal } from '@mui/material';
import { Children, PropsWithChildren, ReactNode, useId } from 'react';

import { Button } from '../button/button';
import { H5 } from '../typography/typography';

export const ModalWrapper = styled('section')`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80lvw;
  max-width: 800px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.shadows[24]};
  padding: ${({ theme }) => theme.spacing(2)};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export const ModalContent = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  padding: ${({ theme }) => theme.spacing(2)};
  padding-bottom: 0;
`;

export const ModalBody = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const ModalActions = styled('div')`
  display: flex;
  justify-content: end;
  gap: ${({ theme }) => theme.spacing(3)};
`;

export type ModalProps = PropsWithChildren<{
  className?: string;
  open: boolean;
  title: ReactNode;
  submitText: string;
  cancelText?: string;
  onCancel: () => void;
  onSubmit: () => void;
}>;

export const Modal = ({
  className,
  open,
  title,
  onCancel,
  onSubmit,
  submitText,
  cancelText = 'Abbrechen',
  children,
}: ModalProps) => {
  const titleId = useId();
  const bodyId = useId();
  const hasBody = Children.toArray(children).length > 0;

  return (
    <MuiModal
      open={open}
      onClose={onCancel}
    >
      <ModalWrapper
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={hasBody ? bodyId : undefined}
      >
        <ModalContent>
          <H5
            id={titleId}
            component="h1"
          >
            {title}
          </H5>

          {hasBody && <ModalBody id={bodyId}>{children}</ModalBody>}
        </ModalContent>

        <ModalActions>
          <Button
            onClick={onCancel}
            variant="text"
            color="secondary"
          >
            {cancelText}
          </Button>

          <Button
            variant={'contained'}
            color="primary"
            onClick={onSubmit}
          >
            {submitText}
          </Button>
        </ModalActions>
      </ModalWrapper>
    </MuiModal>
  );
};
