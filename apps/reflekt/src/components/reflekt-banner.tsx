import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Container,
  css,
  DialogProps,
  Link,
  Modal as MUIModal,
  TextField,
  Typography,
} from '@mui/material';
import {
  BannerActions,
  BannerCloseButton,
  BannerContent,
  BannerContentWrapper,
  BannerCta,
  BannerCtaText,
  BannerImage,
  BannerText,
  BannerTitle,
  BannerWrapper,
  collapseBanner,
} from '@wepublish/banner/website';
import { BuilderBannerProps } from '@wepublish/website/builder';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { recife } from '../theme';
import { usePressAnimation } from './hooks/use-press-animation';

const MailchimpFormSchema = z.object({
  EMAIL: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein').min(1),
});
type MailchimpFormInput = z.infer<typeof MailchimpFormSchema>;

const SubmitBtn = styled(Link)`
  margin: ${({ theme }) => theme.spacing(2)} auto 0;

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: ${({ theme }) => theme.spacing(0, 0, 0, 2.5)};
  }
` as typeof Link;

const formStyles = (theme: Theme) => css`
  display: flex;
  flex-direction: column;
  align-items: center;

  ${theme.breakpoints.up('md')} {
    flex-direction: row;
    align-items: flex-start;
  }
`;

export const BannerBase = ({
  data,
  loading,
  error,
  className,
  onRegister,
}: BuilderBannerProps & { onRegister?: () => void }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isPressing: isSubmitPressing, onClick: onSubmitPress } =
    usePressAnimation();

  const { handleSubmit, control } = useForm<MailchimpFormInput>({
    resolver: zodResolver(MailchimpFormSchema),
    defaultValues: { EMAIL: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const handleClose = () => {
    setCollapsed(true);
    collapseBanner();
  };

  if (!data?.primaryBanner || loading || error) {
    return <></>;
  }

  const htmlContent = data?.primaryBanner?.html;

  return (
    <BannerWrapper
      hasImage={!!data?.primaryBanner.image}
      className={className}
      data-collapsed={collapsed}
      data-banner
    >
      <BannerCloseButton onClick={handleClose}>&#x2715;</BannerCloseButton>

      {data?.primaryBanner.image && (
        <BannerImage
          style={{ backgroundImage: `url(${data?.primaryBanner.image.url})` }}
        ></BannerImage>
      )}

      {htmlContent && (
        <BannerContentWrapper
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )}

      {!htmlContent && (
        <BannerContentWrapper>
          <BannerContent>
            <Typography
              variant="bannerTitle"
              component={BannerTitle}
            >
              {data?.primaryBanner.title}
            </Typography>

            <Typography
              variant="bannerText"
              component={BannerText}
            >
              {data?.primaryBanner.text}
            </Typography>
          </BannerContent>

          <BannerCta>
            <BannerActions>
              {data?.primaryBanner.actions?.[0] && (
                <form
                  noValidate
                  onSubmit={handleSubmit(async values => {
                    const url = data?.primaryBanner?.actions?.[0]?.url;
                    if (!url) return;
                    const body = new URLSearchParams({
                      EMAIL: values.EMAIL,
                    });
                    try {
                      await fetch(url, {
                        method: 'POST',
                        body,
                        mode: 'no-cors',
                      });
                    } catch {
                      // Fire-and-forget — opaque response, ignore network errors
                    }
                    handleClose();
                    onRegister?.();
                  })}
                  css={formStyles}
                >
                  <Controller
                    name="EMAIL"
                    control={control}
                    render={({ field, fieldState: { error } }) => (
                      <TextField
                        {...field}
                        autoComplete="email"
                        type="email"
                        placeholder="E-Mail Adresse"
                        error={!!error}
                        helperText={error?.message}
                        size="small"
                        sx={theme => ({
                          width: '300px',
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'white',
                            borderRadius: '0',
                          },
                          '& input::placeholder': {
                            fontStyle: 'italic',
                          },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                            {
                              borderColor: '#333',
                            },
                          '& .MuiFormHelperText-root': {
                            backgroundColor: 'transparent',
                          },
                          [theme.breakpoints.up('md')]: {
                            marginTop: theme.spacing(1),
                          },
                        })}
                      />
                    )}
                  />
                  <SubmitBtn
                    component="button"
                    type="submit"
                    variant="buttonLinkSecondary"
                    className={isSubmitPressing ? 'is-pressing' : undefined}
                    onClick={onSubmitPress}
                  >
                    {data.primaryBanner.actions[0].label}
                  </SubmitBtn>
                </form>
              )}
            </BannerActions>
            {data?.primaryBanner.cta && (
              <Typography
                variant="bannerCta"
                component={BannerCtaText}
              >
                {data?.primaryBanner.cta.replace(/\\n/g, '\n')}
              </Typography>
            )}
          </BannerCta>
        </BannerContentWrapper>
      )}
    </BannerWrapper>
  );
};

const StyledBanner = styled(BannerBase, {
  shouldForwardProp: propName => propName !== 'hasPaywallBypass',
})<{ hasPaywallBypass: boolean }>`
  position: unset;
  top: unset;
  background-color: ${({ theme }) => theme.palette.secondary.light};
  color: ${({ theme }) => theme.palette.common.black};
  border-radius: 12px;

  [data-role='PRIMARY'] {
    background-color: transparent;
    border: none;
    color: ${({ theme }) => theme.palette.common.black};
  }

  ${BannerCloseButton} {
    display: none;
  }

  &[data-collapsed='false'] {
    ${BannerContentWrapper} {
      display: grid;
      grid-template-columns: unset;
      grid-template-rows: auto auto;
      row-gap: ${({ theme }) => theme.spacing(1.5)};
      padding: ${({ theme }) => theme.spacing(6, 2, 2, 2)};
      align-items: center;

      ${({ theme }) => theme.breakpoints.up('md')} {
        row-gap: ${({ theme }) => theme.spacing(3)};
      }

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

    ${BannerText}, ${BannerCtaText} {
      text-align: center;
      font-family: ${recife.style.fontFamily};
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
      font-size: 1.125rem;
      line-height: 1.2;
    }

    ${BannerCtaText} {
      padding-bottom: ${({ theme }) => theme.spacing(4)};
      max-width: 600px;
      white-space: pre-line;
    }

    ${BannerActions} {
      justify-content: center;
      padding: ${({ theme }) => theme.spacing(3, 0)};
    }

    ${BannerCta} {
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
  position: static;
  top: unset;
  z-index: unset;
  left: unset;
  transition: unset;
  transform: unset;

  ${({ isScrolled }) =>
    isScrolled &&
    css`
      clip-path: unset;
    `}

  &:empty {
    display: none;
  }

  ::before {
    display: none;
  }

  :has([data-collapsed='true']) {
    clip-path: unset;

    ${({ theme }) => theme.breakpoints.down('sm')} {
      transform: unset;

      ${({ isScrolled }) =>
        isScrolled &&
        css`
          clip-path: unset;
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

export const ModalContent = styled('div')`
  padding: 0;
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
  background-color: transparent;
  box-shadow: ${({ theme }) => theme.shadows[24]};
  padding: 0;
  border-radius: 0.75rem;
  width: 800px;
  max-width: 90lvw;
  max-height: 92lvh;

  &:focus-visible {
    outline: none;
  }

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

const BANNER_SUBMITTED_KEY = 'reflekt-banner-submitted';

export const ReflektBanner = (props: BuilderBannerProps) => {
  // Start closed; open on mount unless user has already submitted
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Only open the modal if there's actually an active banner to show
    if (!props.data?.primaryBanner) {
      return;
    }

    // Only open the modal if not already submitted
    if (localStorage.getItem(BANNER_SUBMITTED_KEY)) {
      return;
    }

    const delay = (props.data.primaryBanner.delay ?? 0) * 1000;
    const timer = setTimeout(() => setModalOpen(true), delay);

    return () => clearTimeout(timer);
  }, [props.data?.primaryBanner]);

  const handleClose: DialogProps['onClose'] = (event, reason) => {
    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
      return;
    }

    setModalOpen(false);
  };

  return (
    <Modal
      open={modalOpen}
      onClose={handleClose}
      disableEscapeKeyDown
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          },
        },
      }}
    >
      <ModalPaper>
        <ModalContent>
          <ReflekttBannerContainer
            maxWidth="lg"
            isScrolled={false}
            data-banner
          >
            <StyledBanner
              {...props}
              hasPaywallBypass={false}
              onRegister={() => {
                localStorage.setItem(BANNER_SUBMITTED_KEY, 'true');
                setModalOpen(false);
              }}
            />
          </ReflekttBannerContainer>
        </ModalContent>
      </ModalPaper>
    </Modal>
  );
};
