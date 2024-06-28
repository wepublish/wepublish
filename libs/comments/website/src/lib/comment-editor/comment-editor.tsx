import {zodResolver} from '@hookform/resolvers/zod'
import {IconButton, Modal, Theme, css, styled, useTheme} from '@mui/material'
import {LoginFormContainer, useUser} from '@wepublish/authentication/website'
import {toPlaintext} from '@wepublish/richtext'
import {Link} from '@wepublish/ui'
import {BuilderCommentEditorProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {setCookie} from 'cookies-next'
import {add} from 'date-fns'
import {useMemo, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {MdClose, MdLogin, MdSend} from 'react-icons/md'
import {z} from 'zod'

export const IntendedRouteStorageKey = 'auth.intended'
export const IntendedRouteExpiryInSeconds = 2 * 60

export const CommentEditorWrapper = styled('form')<{modalOpen: boolean}>`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};

  ${({modalOpen}) => modalOpen && 'filter: blur(4px);'};
`

export const CommentEditorActions = styled('div')`
  justify-self: flex-end;
  display: flex;
  flex-flow: row wrap;
  gap: ${({theme}) => theme.spacing(1)};
`

export const CommentEditorChallengeWrapper = styled('div')`
  display: grid;
  grid-template-columns: minmax(max-content, 200px) 200px;
  align-items: center;
  gap: ${({theme}) => theme.spacing(3)};
  justify-content: flex-start;
`

export const CommentEditorChallenge = styled('div')`
  height: 100%;
  display: grid;

  svg {
    height: 100%;
  }
`

export const LoginWrapper = styled('div')`
  position: relative;
  display: grid;
  grid-template-columns: 1;
  padding-top: ${({theme}) => theme.spacing(4)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const Register = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column: 1/2;
  margin: 0 ${({theme}) => theme.spacing(4)};
  margin-top: ${({theme}) => theme.spacing(3)};

  ${({theme}) => theme.breakpoints.up('sm')} {
    grid-column: 2/3;
    margin-top: 0;
  }
`

export const registerStyles = (theme: Theme) => css`
  font-size: ${theme.typography.body1.fontSize};
  white-space: nowrap;
  color: ${theme.palette.common.white};

  ${theme.breakpoints.up('sm')} {
    font-size: ${theme.typography.h4.fontSize};
  }
`

export const registerIconStyles = (theme: Theme) => css`
  color: ${theme.palette.common.white};
  margin-right: ${theme.spacing(1)};
`

export const linkStyles = (theme: Theme) => css`
  color: ${theme.palette.common.white};
  text-decoration: none;
  font-size: ${theme.typography.body1.fontSize};

  ${theme.breakpoints.up('md')} {
    font-size: ${theme.typography.h4.fontSize};
  }
`

export const CloseLogin = styled(IconButton)`
  position: absolute;
  top: ${({theme}) => `${theme.spacing(1)}`};
  right: ${({theme}) => `${theme.spacing(1)}`};
  z-index: 1;
`

export const ModalContent = styled('div')`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80lvw;
  max-width: ${({theme}) => theme.spacing(100)};
  background-color: ${({theme}) => theme.palette.background.paper};
  box-shadow: ${({theme}) => theme.shadows[24]};
  padding: ${({theme}) => theme.spacing(2)};
  display: grid;
  gap: ${({theme}) => theme.spacing(3)};
`

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
  parentUrl
}: BuilderCommentEditorProps) => {
  const theme = useTheme()
  const {
    elements: {TextField, Button, Alert}
  } = useWebsiteBuilder()
  const {hasUser} = useUser()
  const [modalOpen, setModalOpen] = useState(!canReply)

  const handleClose = () => {
    setModalOpen(false)
    onCancel()
  }

  const buttonStyles = useMemo(() => registerStyles(theme), [theme])
  const iconStyles = useMemo(() => registerIconStyles(theme), [theme])
  const aStyles = useMemo(() => linkStyles(theme), [theme])

  const anonymousSchema = useMemo(
    () =>
      z.object({
        comment: z.string().nonempty().max(maxCommentLength),
        title: z.string(),
        guestUsername: z.string().nonempty(),
        challenge: z.object({
          challengeSolution: z.string().nonempty(),
          challengeID: z.string().nonempty()
        })
      }),
    [maxCommentLength]
  )

  const loggedInSchema = useMemo(
    () =>
      z.object({
        comment: z.string().nonempty().max(maxCommentLength),
        title: z.string()
      }),
    [maxCommentLength]
  )

  type FormInput = z.infer<typeof loggedInSchema> | z.infer<typeof anonymousSchema>
  const schema = hasUser ? loggedInSchema : anonymousSchema

  const {handleSubmit, control, reset} = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      comment: toPlaintext(text) ?? '',
      title: title ?? '',
      guestUsername: '',
      challenge: {
        challengeID: challenge?.data?.challenge.challengeID ?? '',
        challengeSolution: ''
      }
    },
    mode: 'all'
  })

  const submit = handleSubmit(({comment, ...data}) => {
    onSubmit({
      ...data,
      text: [
        {
          type: 'paragraph',
          children: [
            {
              text: comment
            }
          ]
        }
      ]
    })
  })

  const passRedirectCookie = () => {
    if (!hasUser && typeof window !== 'undefined') {
      setCookie(IntendedRouteStorageKey, parentUrl, {
        expires: add(new Date(), {
          seconds: IntendedRouteExpiryInSeconds
        })
      })
    }
  }

  const registerRedirect = () => {
    passRedirectCookie()
  }

  const handleAfterLoginCallback = () => {
    passRedirectCookie()
    setModalOpen(false)
  }

  return (
    <>
      <CommentEditorWrapper className={className} onSubmit={submit} modalOpen={modalOpen}>
        {!hasUser && (
          <Controller
            name={'guestUsername'}
            control={control}
            render={({field, fieldState: {error}}) => (
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
          render={({field, fieldState: {error}}) => (
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
          render={({field, fieldState: {error}}) => (
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

        {!hasUser && challenge?.data && (
          <CommentEditorChallengeWrapper>
            <CommentEditorChallenge
              dangerouslySetInnerHTML={{
                __html:
                  challenge.data.challenge.challenge
                    ?.replace('#ffffff', 'transparent')
                    .replace('width="200"', '')
                    .replace('height="200"', '') ?? ''
              }}
            />

            <Controller
              name={'challenge.challengeSolution'}
              control={control}
              render={({field, fieldState: {error}}) => (
                <TextField
                  {...field}
                  label={'Captcha'}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
          </CommentEditorChallengeWrapper>
        )}

        {challenge?.error && <Alert severity="error">{challenge.error.message}</Alert>}

        {error && <Alert severity="error">{error.message}</Alert>}

        <CommentEditorActions>
          <Button type="submit" size="small" endIcon={<MdSend />} disabled={loading}>
            Kommentieren
          </Button>

          <Button
            type="reset"
            onClick={() => {
              reset()
              onCancel()
            }}
            size="small"
            variant="text"
            color="secondary">
            Abbrechen
          </Button>
        </CommentEditorActions>
      </CommentEditorWrapper>

      <Modal open={modalOpen} onClose={handleClose}>
        <ModalContent>
          <CloseLogin onClick={handleClose}>
            <MdClose />
          </CloseLogin>
          <LoginWrapper>
            <LoginFormContainer afterLoginCallback={handleAfterLoginCallback} />
            <Register>
              <Button css={buttonStyles} onClick={registerRedirect}>
                <MdLogin aria-label="Register" css={iconStyles} />
                <Link href="/signup" css={aStyles}>
                  Jetzt registrieren
                </Link>
              </Button>
            </Register>
          </LoginWrapper>
        </ModalContent>
      </Modal>
    </>
  )
}
