import {zodResolver} from '@hookform/resolvers/zod'
import {styled} from '@mui/material'
import {useUser} from '@wepublish/authentication/website'
import {toPlaintext} from '@wepublish/richtext'
import {BuilderCommentEditorProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useMemo} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {MdSend} from 'react-icons/md'
import {z} from 'zod'

export const CommentEditorWrapper = styled('form')`
  display: grid;
  gap: ${({theme}) => theme.spacing(2)};
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

export const CommentEditor = ({
  className,
  onCancel,
  onSubmit,
  maxCommentLength,
  title,
  text,
  challenge,
  loading,
  error
}: BuilderCommentEditorProps) => {
  const {
    elements: {TextField, Button, Alert}
  } = useWebsiteBuilder()
  const {hasUser} = useUser()

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

  return (
    <CommentEditorWrapper className={className} onSubmit={submit}>
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
              <TextField {...field} label={'Captcha'} error={!!error} helperText={error?.message} />
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
  )
}
