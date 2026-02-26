import styled from '@emotion/styled';
import { css, IconButton, Modal as MUIModal } from '@mui/material';
import { Link as BuilderLink } from '@wepublish/ui';
import { BuilderLinkProps } from '@wepublish/website/builder';
import NextLink from 'next/link';
import { forwardRef, useState } from 'react';
import { MdClose } from 'react-icons/md';

import MailchimpForm from './newsletter/mailchimp-form';

export const Modal = styled(MUIModal)``;

export const ModalTitle = styled('div')`
  padding: 0
  position: relative;
  background-color: ${({ theme }) => theme.palette.primary.main};
  padding: ${({ theme }) => theme.spacing(0.75, 2)};
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
`;

export const ModalTitleText = styled('h2')`
  margin: 0;
  font-size: ${({ theme }) => theme.typography.h6.fontSize};
  font-weight: 700;
  padding: 0;
  color: ${({ theme }) => theme.palette.common.white};
`;

export const ModalClose = styled(IconButton)`
  position: absolute;
  top: ${({ theme }) => `${theme.spacing(0.75)}`};
  right: ${({ theme }) => `${theme.spacing(1)}`};
  z-index: 1;
  color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => `${theme.spacing(0.5)}`};

  &:hover {
    color: ${({ theme }) => theme.palette.primary.main};
    background-color: ${({ theme }) => theme.palette.common.white};
  }
`;

export const ModalContent = styled('div')`
  padding: ${({ theme }) => theme.spacing(2)};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

export const ModalPaper = styled('div', {
  shouldForwardProp: propName => propName !== 'isMCSubmit',
})<{ isMCSubmit?: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  grid-template-rows: auto 1fr;
  background-color: ${({ theme }) => theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.shadows[24]};
  padding: 0;
  border-radius: 0.75rem;
  width: 800px;
  max-width: 90lvw;
  max-height: 92lvh;

  ${({ isMCSubmit }) =>
    isMCSubmit &&
    css`
      width: 90lvw;
      max-width: 1280px;

      ${ModalContent} {
        display: block;
      }
    `}
`;

type QueryParams = {
  mc_u: string;
  mc_id: string;
  mc_f_id: string;
  tf_id: string;
  source?: string;
  popTitle?: string;
  popButtonText?: string;
  popHeading?: string;
  popText?: string;
};

const parseQueryParams: (url: string) => QueryParams = (
  url: string
): QueryParams => {
  const queryParams: QueryParams = {
    mc_u: '',
    mc_id: '',
    mc_f_id: '',
    tf_id: '',
  };
  const urlObj = new URL(url, process.env.WEBSITE_URL || 'http://localhost');
  urlObj.searchParams.forEach((value: string, key: string) => {
    queryParams[key as keyof QueryParams] = value;
  });
  return queryParams;
};

export const TsriNextWepublishLink = forwardRef<
  HTMLAnchorElement,
  BuilderLinkProps & { variant?: string }
>(function NextWepublishLink({ children, href, variant, ...props }, ref) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isMCSubmit, setIsMCSubmit] = useState(false);
  const queryParams = parseQueryParams(href ?? '');

  const handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (props.onClick) {
      props.onClick(event);
    }
    if (
      href?.startsWith('/newsletter') &&
      queryParams.mc_u &&
      queryParams.mc_id &&
      queryParams.mc_f_id
    ) {
      event.preventDefault();
      setModalOpen(true);
      return;
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setIsMCSubmit(false);
  };

  const handleMCSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsMCSubmit(true);
  };

  return (
    <>
      <BuilderLink
        {...props}
        ref={ref}
        component={NextLink}
        href={href ?? ''}
        onClick={handleLinkClick}
        variant={variant}
      >
        {children}
      </BuilderLink>
      <Modal
        open={modalOpen}
        onClose={handleClose}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.9)' } } }}
      >
        <ModalPaper isMCSubmit={isMCSubmit}>
          <ModalTitle>
            <ModalTitleText>
              {queryParams.popTitle ?? 'Newsletter abonnieren'}
            </ModalTitleText>
            <ModalClose onClick={handleClose}>
              <MdClose />
            </ModalClose>
          </ModalTitle>
          <ModalContent>
            <MailchimpForm
              onMCSubmit={handleMCSubmit}
              {...queryParams}
            />
          </ModalContent>
        </ModalPaper>
      </Modal>
    </>
  );
});
