import {Inject, Injectable} from '@nestjs/common'
import {CommentState, PrismaClient} from '@prisma/client'
import {Author, Blog, CheckResult, Client, Comment, CommentType} from '@cedx/akismet/src'
import {Cron} from '@nestjs/schedule'
import {toPlaintext} from '@wepublish/richtext'
import {Node} from 'slate'

export const AKISMET_CLIENT_OPTIONS = Symbol('AKISMET_CLIENT_OPTIONS')
export type AkismetConfig = {
  url: string
  apiKey: string
}

@Injectable()
export class AkismetSpamProtectionService {
  private client = new Client(
    this.config.apiKey,
    new Blog({
      languages: ['de-CH'],
      url: this.config.url
    })
  )

  constructor(
    @Inject(AKISMET_CLIENT_OPTIONS) private config: AkismetConfig,
    private prisma: PrismaClient
  ) {}

  @Cron('*/10 * * * *')
  async checkCommentsForSpam() {
    const openComments = await this.prisma.comment.findMany({
      where: {
        state: CommentState.pendingApproval
      },
      include: {
        user: true,
        revisions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    for (const comment of openComments) {
      const result = await this.client.checkComment(
        new Comment({
          author: new Author({
            email: comment.user?.email,
            name: comment.user?.firstName ?? comment.guestUsername ?? undefined,
            role: comment.userID ? 'user' : 'guest'
          }),
          content: toPlaintext(comment.revisions[0].text as Node[]),
          type: comment.parentID ? CommentType.reply : CommentType.comment,
          context: [comment.revisions[0].title ?? '', comment.revisions[0].lead ?? ''],
          date: comment.revisions[0].createdAt
        })
      )

      switch (result) {
        case CheckResult.pervasiveSpam: {
          await this.prisma.comment.delete({
            where: {
              id: comment.id
            }
          })
          break
        }

        case CheckResult.spam: {
          await this.prisma.comment.update({
            where: {
              id: comment.id
            },
            data: {
              state: CommentState.rejected
            }
          })
          break
        }

        case CheckResult.ham: {
          await this.prisma.comment.update({
            where: {
              id: comment.id
            },
            data: {
              state: CommentState.approved
            }
          })
          break
        }
      }
    }
  }
}
