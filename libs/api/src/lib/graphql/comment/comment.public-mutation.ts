import {
  Comment,
  CommentAuthorType,
  CommentItemType,
  CommentState,
  Prisma,
  PrismaClient
} from '@prisma/client'
import {Context} from '../../context'
import {SettingName} from '@wepublish/settings/api'
import {
  AnonymousCommentError,
  AnonymousCommentsDisabledError,
  ChallengeMissingCommentError,
  CommentAuthenticationError,
  CommentLengthError,
  NotAuthorisedError,
  PeerIdMissingCommentError,
  UserInputError
} from '../../error'
import {countRichtextChars} from '../../utility'

export const addPublicComment = async (
  input: {
    title?: string
    text: string
    challenge: {challengeID: string; challengeSolution: number}
  } & Omit<Prisma.CommentUncheckedCreateInput, 'revisions' | 'authorType' | 'userID' | 'state'>,
  optionalAuthenticateUser: Context['optionalAuthenticateUser'],
  challenge: Context['challenge'],
  settingsClient: PrismaClient['setting'],
  commentClient: PrismaClient['comment']
) => {
  const user = optionalAuthenticateUser()
  let authorType: CommentAuthorType = CommentAuthorType.verifiedUser
  const commentLength = countRichtextChars(0, input.text)

  const maxCommentLength = (
    await settingsClient.findUnique({
      where: {
        name: SettingName.COMMENT_CHAR_LIMIT
      }
    })
  )?.value as number

  if (commentLength > maxCommentLength) {
    throw new CommentLengthError(+maxCommentLength)
  }

  // Challenge
  if (!user) {
    authorType = CommentAuthorType.guestUser

    const guestCanCommentSetting = await settingsClient.findUnique({
      where: {name: SettingName.ALLOW_GUEST_COMMENTING}
    })
    const guestCanComment =
      guestCanCommentSetting?.value ?? process.env.ENABLE_ANONYMOUS_COMMENTS === 'true'

    if (!guestCanComment) {
      throw new AnonymousCommentsDisabledError()
    }

    if (!input.guestUsername) throw new AnonymousCommentError()
    if (!input.challenge) throw new ChallengeMissingCommentError()

    const challengeValidationResult = await challenge.validateChallenge({
      challengeID: input.challenge.challengeID,
      solution: input.challenge.challengeSolution
    })

    if (!challengeValidationResult.valid)
      throw new CommentAuthenticationError(challengeValidationResult.message)
  }

  if (input.itemType === CommentItemType.peerArticle && !input.peerId) {
    throw new PeerIdMissingCommentError()
  }

  // Cleanup
  const {challenge: _, title, text, ...commentInput} = input

  const comment = await commentClient.create({
    data: {
      ...commentInput,
      revisions: {
        create: {
          text,
          title
        }
      },
      userID: user?.user.id,
      authorType,
      state: CommentState.pendingApproval
    },
    include: {revisions: {orderBy: {createdAt: 'asc'}}}
  })
  return {...comment, title, text}
}

export const updatePublicComment = async (
  input: {id: Comment['id']} & Prisma.CommentsRevisionsCreateInput,
  authenticateUser: Context['authenticateUser'],
  commentClient: PrismaClient['comment'],
  settingsClient: PrismaClient['setting']
) => {
  const {user} = authenticateUser()

  const comment = await commentClient.findUnique({
    where: {
      id: input.id
    },
    include: {revisions: {orderBy: {createdAt: 'asc'}}}
  })

  if (!comment) return null

  if (user.id !== comment?.userID) {
    throw new NotAuthorisedError()
  }
  const commentEditingSetting = await settingsClient.findUnique({
    where: {
      name: SettingName.ALLOW_COMMENT_EDITING
    }
  })

  if (!commentEditingSetting?.value && comment.state !== CommentState.pendingUserChanges) {
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
    },
    include: {revisions: {orderBy: {createdAt: 'asc'}}}
  })

  return {...updatedComment, text}
}
