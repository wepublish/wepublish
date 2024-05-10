import {Modal, css, styled} from '@mui/material'
import {LoginFormContainer, useUser} from '@wepublish/authentication/website'
import {Button, IconButton, Link} from '@wepublish/ui'
import {Comment} from '@wepublish/website/api'
import {BuilderCommentListProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {MdClose, MdForum} from 'react-icons/md'
import {getStateForEditor} from './comment-list.state'
import {useMemo, useState} from 'react'

export const CommentListWrapper = styled('section')`
  display: grid;
  gap: ${({theme}) => theme.spacing(4)};
`

export const CommentListActions = styled('div')`
  display: flex;
  justify-content: end;
`

export const CommentListReadMore = styled(Button)`
  padding: ${({theme}) => `${theme.spacing(1)} ${theme.spacing(2.5)}`};
  text-transform: uppercase;
`

export const ButtonsWrapper = styled('div')`
  width: ${({theme}) => theme.spacing(86)};
  margin-top: ${({theme}) => theme.spacing(5)};
  display: flex;
  justify-content: center;
`

export const LoginButton = styled(Button)`
  margin-left: ${({theme}) => theme.spacing(6)};
  border-width: 1px;

  &:hover {
    border-width: 1px;
  }
`

export const CommentEditorOuter = styled('div')`
  padding: ${({theme}) => theme.spacing(4)};
`

export const LoginWrapper = styled('div')`
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding-top: ${({theme}) => theme.spacing(4)};
`

export const Register = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  grid-column: 2/3;
  font-size: 1.8rem;
  margin: 0 ${({theme}) => theme.spacing(4)};
`

export const CloseLogin = styled(IconButton)`
  position: absolute;
  top: ${({theme}) => `-${theme.spacing(2)}`};
  right: ${({theme}) => `-${theme.spacing(2)}`};
`

export const ModalContent = styled('div')`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: ${({theme}) => `${theme.spacing(4)} ${theme.spacing(3)}`};
  bottom: 0;
  background-color: ${({theme}) => theme.palette.common.white};
  width: auto;

  animation: slideUpAndFadeIn 0.5s ease forwards;

  @keyframes slideUpAndFadeIn {
    from {
      transform: translateX(-50%) translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }
`

const headingStyles = () => css`
  font-size: 1.5rem;
  font-weight: 400;
`

const linkStyles = () => css`
  white-space: nowrap;
`

export const CommentList = ({
  data,
  loading,
  error,
  challenge,
  className,
  maxCommentLength,
  anonymousCanComment,
  anonymousCanRate,
  userCanEdit,
  add,
  onAddComment,
  edit,
  onEditComment,
  openEditorsState,
  openEditorsStateDispatch: dispatch
}: BuilderCommentListProps) => {
  const {
    CommentEditor,
    CommentListItem,
    elements: {Alert, H4}
  } = useWebsiteBuilder()
  const {hasUser} = useUser()
  const canReply = anonymousCanComment || hasUser

  const [modalOpen, setModalOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleModalOpen = () => {
    setModalOpen(true)

    if (canReply) {
      dispatch({
        type: 'add',
        action: 'open',
        commentId: null
      })
    }
  }
  const handleModalClose = () => {
    dispatch({
      type: 'add',
      action: 'close',
      commentId: null
    })
    setShowLogin(false)
    setModalOpen(false)
  }

  const showReply = getStateForEditor(openEditorsState)('add', null)

  const h4Styles = useMemo(() => headingStyles(), [])
  const aStyles = useMemo(() => linkStyles(), [])

  const handleAddComment = (props: any) => {
    onAddComment(props)
    handleModalClose()
  }

  const handleAfterLoginCallback = () => {
    setShowLogin(false)

    dispatch({
      type: 'add',
      action: 'open',
      commentId: null
    })
  }

  return (
    <CommentListWrapper className={className}>
      {!loading && !error && !data?.comments.length && (
        <Alert severity="info">Keine Kommentare vorhanden.</Alert>
      )}

      {error && <Alert severity="error">{error.message}</Alert>}

      {data?.comments?.map((comment, index) => (
        <CommentListItem
          key={comment.id}
          {...comment}
          isTopComment={index <= 1}
          ratingSystem={data.ratingSystem}
          openEditorsState={openEditorsState}
          openEditorsStateDispatch={dispatch}
          challenge={challenge}
          add={add}
          onAddComment={onAddComment}
          edit={edit}
          onEditComment={onEditComment}
          anonymousCanComment={anonymousCanComment}
          anonymousCanRate={anonymousCanRate}
          userCanEdit={userCanEdit}
          maxCommentLength={maxCommentLength}
          children={(comment.children as Comment[]) ?? []}
        />
      ))}

      <CommentListActions>
        <CommentListReadMore startIcon={<MdForum />} variant="contained" onClick={handleModalOpen}>
          Jetzt Mitreden
        </CommentListReadMore>
      </CommentListActions>

      <Modal open={modalOpen} onClose={handleModalClose} closeAfterTransition>
        <ModalContent>
          {showReply ? (
            <CommentEditorOuter>
              <CommentEditor
                challenge={challenge}
                maxCommentLength={maxCommentLength}
                onCancel={() => {
                  dispatch({
                    type: 'add',
                    action: 'close',
                    commentId: null
                  })
                  handleModalClose()
                }}
                onSubmit={handleAddComment}
                error={add.error}
                loading={add.loading}
              />
            </CommentEditorOuter>
          ) : showLogin ? (
            <LoginWrapper>
              <LoginFormContainer afterLoginCallback={handleAfterLoginCallback} />
              <Register>
                <Link href="/signup" css={aStyles}>
                  Jetzt registrieren
                </Link>
                <CloseLogin size="large" aria-label="Menu" onClick={() => setShowLogin(false)}>
                  <MdClose />
                </CloseLogin>
              </Register>
            </LoginWrapper>
          ) : (
            <>
              <H4 css={h4Styles}>Du bist nicht eingeloggt</H4>
              <ButtonsWrapper>
                <Button
                  variant="text"
                  size="large"
                  color="inherit"
                  onClick={() =>
                    dispatch({
                      type: 'add',
                      action: 'open',
                      commentId: null
                    })
                  }>
                  Als Gast kommentieren
                </Button>
                <LoginButton variant="outlined" size="large" onClick={() => setShowLogin(true)}>
                  Anmelden / Registrieren
                </LoginButton>
              </ButtonsWrapper>
            </>
          )}
        </ModalContent>
      </Modal>
    </CommentListWrapper>
  )
}
