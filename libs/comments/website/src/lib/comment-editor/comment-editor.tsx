import { zodResolver } from '@hookform/resolvers/zod';
import { css, IconButton, Modal, Theme, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import {
  Challenge,
  IntendedRouteExpiryInSeconds,
  IntendedRouteStorageKey,
  LoginFormContainer,
  useUser,
} from '@wepublish/authentication/website';
import { BlockFormat, toPlaintext } from '@wepublish/richtext';
import {
  BuilderCommentEditorProps,
  Link,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { setCookie } from 'cookies-next';
import { add } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdClose, MdLogin, MdSend } from 'react-icons/md';
import { z } from 'zod';

export const CommentEditorWrapper = styled('form')<{ modalOpen: boolean }>`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ modalOpen }) => modalOpen && 'filter: blur(4px);'};
`;

export const CommentEditorActions = styled('div')`
  justify-self: flex-end;
  display: flex;
  flex-flow: row wrap;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export const LoginWrapper = styled('div')`
  position: relative;
  display: grid;
  grid-template-columns: 1;
  padding: ${({ theme }) => theme.spacing(4, 0, 3, 0)};
  column-gap: ${({ theme }) => theme.spacing(7)};
  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
    column-gap: ${({ theme }) => theme.spacing(3)};
  }
  ${({ theme }) => theme.breakpoints.up('md')} {
    column-gap: ${({ theme }) => theme.spacing(7)};
  }
`;

export const ExistingAccountsLoginWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(0, 2, 4, 2)};

  & > h3 {
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
    line-height: 1.2;
    margin: ${({ theme }) => theme.spacing(1, 0, 2, 0)};
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    padding: ${({ theme }) => theme.spacing(0, 0, 0, 2)};

    & > h3 {
      margin: ${({ theme }) => theme.spacing(2, 0, 1, 0)};
    }
  }
`;

export const NewAccountsLoginWrapper = styled('div')`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${({ theme }) => theme.palette.grey[300]};
  justify-content: flex-start;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing(2, 2, 0, 2)};

  & > h3 {
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
    line-height: 1.2;
    margin: ${({ theme }) => theme.spacing(2, 0, 3, 0)};
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    border-top: none;
    border-left: 1px solid ${({ theme }) => theme.palette.grey[300]};
    padding: ${({ theme }) => theme.spacing(0, 0, 0, 0)};

    & > h3 {
      width: unset;
      margin: ${({ theme }) => theme.spacing(2, 0, 7, 2)};
    }
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin-left: ${({ theme }) => theme.spacing(0)};

    & > h3 {
      margin: ${({ theme }) => theme.spacing(2, 0, 8, 7)};
    }
  }
`;

export const InitialModalWrapper = styled('div')`
  position: relative;
  display: grid;
  grid-template-columns: 1;
  padding-top: ${({ theme }) => theme.spacing(4)};
  align-items: center;
`;

export const InitialModalContent = styled('div')`
  width: 100%;
  justify-content: space-around;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing(2)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const Register = styled('div')`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-end;
  grid-column: 1/2;
  width: 100%;

  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: unset;
    grid-column: 2/3;
    margin: ${({ theme }) => theme.spacing(4, 0, 0, 3)};
    align-items: flex-start;
  }

  ${({ theme }) => theme.breakpoints.up('md')} {
    margin: ${({ theme }) => theme.spacing(0, 0, 0, 7)};
  }
`;

export const initialHeadingStyles = (theme: Theme) => css`
  width: 100%;
  text-align: left;
  font-size: ${theme.typography.h4.fontSize};
  margin-bottom: ${theme.spacing(3)};

  ${theme.breakpoints.up('sm')} {
    margin-bottom: ${theme.spacing(6)};
  }
`;

export const initialButtonStyles = (theme: Theme) => css`
  text-transform: uppercase;
  font-size: ${theme.typography.h5.fontSize};
`;

export const registerStyles = (theme: Theme) => css`
  font-size: ${theme.typography.body1.fontSize};
  white-space: nowrap;
  color: ${theme.palette.common.white};

  ${theme.breakpoints.up('sm')} {
    font-size: ${theme.typography.h4.fontSize};
  }
`;

export const registerIconStyles = (theme: Theme) => css`
  color: ${theme.palette.common.white};
  margin-right: ${theme.spacing(1)};
`;

export const SignupLink = styled(Link)`
  color: ${({ theme }) => theme.palette.common.white};
  text-decoration: none;
  font-size: ${({ theme }) => theme.typography.body1.fontSize};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    font-size: ${({ theme }) => theme.typography.h4.fontSize};
  }
`;

export const CloseLogin = styled(IconButton)`
  position: absolute;
  top: ${({ theme }) => `${theme.spacing(1)}`};
  right: ${({ theme }) => `${theme.spacing(1)}`};
  z-index: 1;
`;

export const ModalContent = styled('div')`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  max-width: ${({ theme }) => theme.spacing(100)};
  background-color: ${({ theme }) => theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.shadows[24]};
  padding: ${({ theme }) => theme.spacing(2)};
  display: grid;
  gap: ${({ theme }) => theme.spacing(3)};

  ${({ theme }) => theme.breakpoints.up('sm')} {
    width: 80lvw;
  }
`;

export const CommentEditor = ({
  className,
  onCancel,
  onSubmit,
  maxCommentLength,
  title,
  text,
  challenge,
  canReply,
  loading,
  error,
  parentUrl,
  signUpUrl,
  anonymousCanComment,
}: BuilderCommentEditorProps) => {
  const theme = useTheme();
  const {
    elements: { TextField, Button, Alert, H3, Link },
  } = useWebsiteBuilder();
  const { hasUser } = useUser();
  const [modalOpen, setModalOpen] = useState(!hasUser);
  const [userHasLoggedIn, setUserHasLoggedIn] = useState(hasUser);
  const [showInitialModal, setShowInitialModal] = useState(anonymousCanComment);

  const handleClose = () => {
    setModalOpen(false);
    onCancel();
  };

  const handleGuestComment = () => {
    setShowInitialModal(false);
    setModalOpen(false);
  };

  const handleLoginRegister = () => {
    setShowInitialModal(false);
  };

  const buttonStyles = useMemo(() => {
    let s = registerStyles(theme);
    s = css`
      font-size: ${theme.typography.body1.fontSize};
    `;
    return s;
  }, [theme]);
  const iconStyles = useMemo(() => registerIconStyles(theme), [theme]);
  const headingStyles = useMemo(() => initialHeadingStyles(theme), [theme]);

  const initialButtonsStyles = useMemo(
    () => initialButtonStyles(theme),
    [theme]
  );

  const anonymousSchema = useMemo(
    () =>
      z.object({
        comment: z.string().min(1).max(maxCommentLength),
        title: z.string(),
        guestUsername: z.string().min(1),
        challenge: z.object({
          challengeSolution: z.string().min(1),
          challengeID: z.string().min(1),
        }),
      }),
    [maxCommentLength]
  );

  const loggedInSchema = useMemo(
    () =>
      z.object({
        comment: z.string().min(1).max(maxCommentLength),
        title: z.string(),
      }),
    [maxCommentLength]
  );

  type FormInput =
    | z.infer<typeof loggedInSchema>
    | z.infer<typeof anonymousSchema>;
  const schema = hasUser ? loggedInSchema : anonymousSchema;

  const { handleSubmit, control, reset } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      comment: toPlaintext(text) ?? '',
      title: title ?? '',
      guestUsername: '',
      challenge: {
        challengeID: challenge?.data?.challenge.challengeID ?? '',
        challengeSolution: '',
      },
    },
    mode: 'all',
  });

  const submit = handleSubmit(({ comment, ...data }) => {
    onSubmit({
      ...data,
      text: [
        {
          type: BlockFormat.Paragraph,
          children: [
            {
              text: comment,
            },
          ],
        },
      ],
    });
  });

  const passRedirectCookie = () => {
    if (!hasUser && typeof window !== 'undefined') {
      setCookie(IntendedRouteStorageKey, parentUrl, {
        expires: add(new Date(), {
          seconds: IntendedRouteExpiryInSeconds,
        }),
      });
    }
  };

  const registerRedirect = () => {
    passRedirectCookie();
  };

  const handleAfterLoginCallback = () => {
    passRedirectCookie();
  };

  useEffect(() => {
    if (hasUser) {
      setModalOpen(false);
      setUserHasLoggedIn(true);
    } else {
      if (userHasLoggedIn) {
        setUserHasLoggedIn(false);
        onCancel();
      }
    }
  }, [hasUser, onCancel, userHasLoggedIn]);

  return (
    <>
      {(anonymousCanComment || hasUser) && (
        <CommentEditorWrapper
          className={className}
          onSubmit={submit}
          modalOpen={modalOpen}
        >
          {!hasUser && (
            <Controller
              name={'guestUsername'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  fullWidth
                  placeholder="Dein Name"
                  label="Name"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}

          <Controller
            name={'title'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                fullWidth
                placeholder="Gib Deinem Beitrag einen Titel."
                label="Titel"
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          <Controller
            name={'comment'}
            control={control}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                multiline
                fullWidth
                minRows={5}
                label="Kommentar"
                placeholder="Beitrag verfassen"
                error={!!error}
                helperText={`${field.value.length} / ${maxCommentLength} Zeichen`}
              />
            )}
          />

          {challenge?.data?.challenge && (
            <Controller
              name={'challenge.challengeSolution'}
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Challenge
                  {...field}
                  onChange={field.onChange}
                  challenge={challenge.data!.challenge}
                  label={'Captcha'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          )}

          {challenge?.error && (
            <Alert severity="error">{challenge.error.message}</Alert>
          )}

          {error && <Alert severity="error">{error.message}</Alert>}

          <CommentEditorActions>
            <Button
              type="submit"
              size="small"
              endIcon={<MdSend />}
              disabled={loading}
            >
              Kommentieren
            </Button>

            <Button
              type="reset"
              onClick={() => {
                reset();
                onCancel();
              }}
              size="small"
              variant="text"
              color="secondary"
            >
              Abbrechen
            </Button>
          </CommentEditorActions>
        </CommentEditorWrapper>
      )}

      <Modal
        open={modalOpen}
        onClose={handleClose}
      >
        <ModalContent>
          <CloseLogin onClick={handleClose}>
            <MdClose />
          </CloseLogin>

          {showInitialModal && (
            <InitialModalWrapper>
              <H3 css={headingStyles}>Du bist nicht eingeloggt</H3>

              <InitialModalContent>
                {anonymousCanComment && (
                  <Button
                    onClick={handleGuestComment}
                    variant="outlined"
                    css={initialButtonsStyles}
                  >
                    als gast kommentieren
                  </Button>
                )}

                <Button
                  onClick={handleLoginRegister}
                  css={initialButtonsStyles}
                >
                  anmelden/registieren
                </Button>
              </InitialModalContent>
            </InitialModalWrapper>
          )}

          {!showInitialModal && (
            <LoginWrapper>
              <ExistingAccountsLoginWrapper>
                <H3>Login für Leserinnen und Leser</H3>
                <LoginFormContainer
                  afterLoginCallback={handleAfterLoginCallback}
                />
              </ExistingAccountsLoginWrapper>

              <NewAccountsLoginWrapper>
                <H3>Noch kein Account?</H3>
                <Register>
                  <Button
                    css={buttonStyles}
                    onClick={registerRedirect}
                  >
                    <MdLogin
                      aria-label="Register"
                      css={iconStyles}
                    />

                    <SignupLink href={signUpUrl}>Jetzt registrieren</SignupLink>
                  </Button>
                </Register>
              </NewAccountsLoginWrapper>
            </LoginWrapper>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
