import {Context} from '../../context'
import {
  AnonymousCommentError,
  AnonymousCommentsDisabledError,
  ChallengeMissingCommentError,
  CommentAuthenticationError,
  CommentLengthError,
  NotAuthorisedError,
  UserInputError
} from '../../error'
import {countRichtextChars, MAX_COMMENT_LENGTH} from '../../utility'
import {CommentState, PrismaClient, Prisma, CommentAuthorType, Comment} from '@prisma/client'

export const addPublicComment = async (
  input: {text: string; challenge: {challengeID: string; challengeSolution: number}} & Omit<
    Prisma.CommentUncheckedCreateInput,
    'revisions' | 'authorType' | 'userID' | 'state'
  >,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  challenge: Context['challenge'],
  commentClient: PrismaClient['comment']
) => {
  const user = optionalAuthenticateUser()
  let authorType: CommentAuthorType = CommentAuthorType.verifiedUser
  const commentLength = countRichtextChars(0, input.text)

  if (commentLength > MAX_COMMENT_LENGTH) {
    throw new CommentLengthError()
  }

  // Challenge
  if (!user) {
    authorType = CommentAuthorType.guestUser
    if (process.env.ENABLE_ANONYMOUS_COMMENTS !== 'true') throw new AnonymousCommentsDisabledError()

    if (!input.guestUsername) throw new AnonymousCommentError()
    if (!input.challenge) throw new ChallengeMissingCommentError()

    const challengeValidationResult = await challenge.validateChallenge({
      challengeID: input.challenge.challengeID,
      solution: input.challenge.challengeSolution
    })

    if (!challengeValidationResult.valid)
      throw new CommentAuthenticationError(challengeValidationResult.message)
  }

  // Cleanup
  const {challenge: _, text, ...commentInput} = input

  const comment = await commentClient.create({
    data: {
      ...commentInput,
      revisions: {
        create: {
          text
        }
      },
      userID: user?.user.id,
      authorType,
      state: CommentState.pendingApproval
    }
  })

  return {...comment, text}
}

export const updatePublicComment = async (
  input: {id: Comment['id']} & Prisma.CommentsRevisionsCreateInput,
  authenticateUser: Context['authenticateUser'],
  commentClient: PrismaClient['comment']
) => {
  const {user} = authenticateUser()

  const comment = await commentClient.findUnique({
    where: {
      id: input.id
    }
  })

  if (!comment) return null

  if (user.id !== comment?.userID) {
    throw new NotAuthorisedError()
  } else if (comment.state !== CommentState.pendingUserChanges) {
    throw new UserInputError('Comment state must be pending user changes')
  }

  const {id, text} = input

  const updatedComment = await commentClient.update({
    where: {id},
    data: {
      revisions: {
        create: {
          text
        }
      },
      state: CommentState.pendingApproval
    }
  })

  return {...updatedComment, text}
}
