import {PrismaClient, RatingSystemType} from '@prisma/client'
import {CanUpdateCommentRatingSystem} from '@wepublish/permissions/api'
import {Context} from '../../context'
import {authorise} from '../permissions'

type UpdateCommentRatingAnswer = {id: string; answer: string; type: RatingSystemType}

export const updateRatingSystem = (
  ratingSystemId: string,
  name: string | undefined,
  answers: UpdateCommentRatingAnswer[] | undefined,
  authenticate: Context['authenticate'],
  ratingSystem: PrismaClient['commentRatingSystem']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateCommentRatingSystem, roles)

  return ratingSystem.update({
    where: {id: ratingSystemId},
    data: {
      name,
      answers: {
        update: answers?.map(answer => ({
          where: {id: answer.id},
          data: {
            answer: answer.answer
          }
        }))
      }
    },
    include: {
      answers: true
    }
  })
}

export const createCommentRatingAnswer = async (
  ratingSystemId: string,
  type: RatingSystemType,
  answer: string | undefined,
  authenticate: Context['authenticate'],
  ratingAnswer: PrismaClient['commentRatingSystemAnswer']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateCommentRatingSystem, roles)

  return ratingAnswer.create({
    data: {
      type,
      answer,
      ratingSystem: {
        connect: {
          id: ratingSystemId
        }
      }
    }
  })
}

export const deleteCommentRatingAnswer = async (
  answerId: string,
  authenticate: Context['authenticate'],
  commentRatingAnswer: PrismaClient['commentRatingSystemAnswer']
) => {
  const {roles} = authenticate()
  authorise(CanUpdateCommentRatingSystem, roles)

  return commentRatingAnswer.delete({
    where: {id: answerId}
  })
}
