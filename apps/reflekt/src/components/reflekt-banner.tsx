import styled from '@emotion/styled';
import { Container, css, IconButton, Modal as MUIModal } from '@mui/material';
import {
  Banner,
  BannerActions,
  BannerCloseButton,
  BannerContent,
  BannerContentWrapper,
  BannerCta,
  BannerCtaText,
  BannerImage,
  BannerText,
  BannerTitle,
} from '@wepublish/banner/website';
import { BuilderBannerProps } from '@wepublish/website/builder';
import { useCallback, useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';

import { recife } from '../theme';

const StyledBanner = styled(Banner, {
  shouldForwardProp: propName => propName !== 'hasPaywallBypass',
})<{ hasPaywallBypass: boolean }>`
  position: unset;
  top: unset;
  background-color: ${({ theme }) => theme.palette.secondary.light};
  color: ${({ theme }) => theme.palette.common.black};
  border-radius: 12px;

  [data-role='PRIMARY'] {
    background-color: transparent;
    border: 1px solid ${({ theme }) => theme.palette.secondary.main};
    color: ${({ theme }) => theme.palette.secondary.main};
  }

  ${BannerCloseButton} {
    display: none;
  }

  &[data-collapsed='false'] {
    ${BannerContentWrapper} {
      display: grid;
      grid-template-columns: unset;
      grid-template-rows: auto auto;
      row-gap: ${({ theme }) => theme.spacing(4)};
      padding: ${({ theme }) => theme.spacing(6, 2, 2, 2)};
      align-items: center;

      ${({ theme }) => theme.breakpoints.up('lg')} {
        zoom: 1;
      }
    }

    ${BannerContent} {
      display: grid;
      grid-template-columns: unset;
      align-items: center;
    }

    ${BannerTitle} {
      text-align: center;
      text-transform: uppercase;
      font-weight: 500;
      font-size: 1.5rem;
      line-height: 1.2;
      margin-left: auto;
      margin-right: auto;
      padding: 0;
    }

    ${BannerText} {
      text-align: center;
      font-family: ${recife.style.fontFamily};
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
      font-size: 1.125rem;
      lineheight: 1.2;
    }

    ${BannerActions} {
      justify-content: unset;
    }

    ${BannerCta} {
      ${({ theme }) => theme.breakpoints.up('md')} {
        padding-left: ${({ theme }) => theme.spacing(6)};
      }
    }

    ${BannerCtaText} {
      text-align: unset;
    }
  }

  &[data-collapsed='true'] {
    display: block;
    border-radius: 4px;
    grid-template-columns: 1fr;

    ${({ theme }) => theme.breakpoints.up('sm')} {
      bottom: ${({ theme }) => theme.spacing(1)};
    }

    ${BannerImage}, ${BannerTitle}, ${BannerText}, ${BannerCloseButton}, [data-role='CANCEL'], ${BannerCtaText} {
      display: none;
    }

    ${BannerContentWrapper} {
      padding: ${({ theme }) => theme.spacing(2)};
    }
  }
`;

export const ReflekttBannerContainer = styled(Container, {
  shouldForwardProp: propName => propName !== 'isScrolled',
})<{ isScrolled: boolean }>`
  padding: 0 !important;
  position: fixed;
  top: var(--changing-navbar-height);
  z-index: 1;
  left: 50%;
  transition:
    clip-path 10000ms ease-out,
    transform 300ms ease-out;
  transform: translate3d(
    -50%,
    ${({ isScrolled }) =>
      isScrolled ? `calc(var(--changing-navbar-height) / -3)` : '0'},
    0
  );

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      clip-path: polygon(
        0 calc(var(--changing-navbar-height) / 3),
        100% calc(var(--changing-navbar-height) / -6),
        100% 100%,
        0px 100%
      );
    `}

  &:empty {
    display: none;
  }

  ::before {
    position: absolute;
    top: 1px;
    left: 0;
    right: 0;
    transform: translateY(-100%);
    background: ${({ theme }) => theme.palette.primary.main};
    height: 50px;

    ${({ isScrolled }) =>
      isScrolled &&
      css`
        content: '';
      `}
  }

  :has([data-collapsed='true']) {
    clip-path: unset;

    ${({ theme }) => theme.breakpoints.down('sm')} {
      transform: translate3d(
        -50%,
        ${({ isScrolled }) =>
          isScrolled ? `calc(var(--changing-navbar-height) / -2)` : 0},
        0
      );

      ${({ isScrolled }) =>
        isScrolled &&
        css`
          clip-path: polygon(
            0 calc(var(--changing-navbar-height) / 2),
            100% -1px,
            100% 100%,
            0px 100%
          );
        `}

      ${BannerContentWrapper} {
        padding-bottom: 12px;
      }

      ${BannerActions} {
        justify-content: end;
        align-items: center;
      }

      ${BannerActions} a:not(:last-child) {
        flex: 1;
        background: transparent;
        letter-spacing: initial;
        text-transform: initial;
        font-weight: 600;
        padding: 0;
        padding-left: 25%;
        pointer-events: none;
      }

      ${BannerActions} a:last-child {
        font-size: 0.75rem;
        padding: 5px 12px;
      }
    }

    ${({ theme }) => theme.breakpoints.up('sm')} {
      transform: translateX(-50%);

      &::before {
        display: none;
      }

      width: 90vw;
      max-width: ${370 / 16}rem;
      top: unset;
      bottom: ${({ theme }) => theme.spacing(1)};
    }
  }
`;

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

export const ReflektBanner = (props: BuilderBannerProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const handleScroll = useCallback(() => setIsScrolled(window.scrollY > 1), []);
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleClose = () => {
    setModalOpen(false);
  };

  return (
    <Modal
      open={modalOpen}
      onClose={handleClose}
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.6)' } } }}
    >
      <ModalPaper>
        <ModalTitle>
          <ModalTitleText>{'Newsletter abonnieren'}</ModalTitleText>
          <ModalClose onClick={handleClose}>
            <MdClose />
          </ModalClose>
        </ModalTitle>
        <ModalContent>
          <ReflekttBannerContainer
            maxWidth="lg"
            isScrolled={false}
            data-banner
          >
            <StyledBanner
              {...props}
              hasPaywallBypass={false}
            />
          </ReflekttBannerContainer>
        </ModalContent>
      </ModalPaper>
    </Modal>
  );
};
