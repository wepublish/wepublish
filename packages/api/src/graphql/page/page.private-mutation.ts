import {Prisma, PrismaClient} from '@prisma/client'
import {Context} from '../../context'
import {DuplicatePageSlugError, NotFound} from '../../error'
import {authorise, CanCreatePage, CanDeletePage, CanPublishPage} from '../permissions'

export const deletePageById = (
  id: string,
  authenticate: Context['authenticate'],
  page: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanDeletePage, roles)

  return page.delete({
    where: {
      id
    }
  })
}

export const createPage = (
  input: Omit<Prisma.PageRevisionCreateInput, 'updatedAt' | 'revision'>,
  authenticate: Context['authenticate'],
  page: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  return page.create({
    data: {
      draft: {
        ...input,
        revision: 0,
        updatedAt: new Date()
      },
      modifiedAt: new Date()
    }
  })
}

export const duplicatePage = async (
  id: string,
  authenticate: Context['authenticate'],
  pages: Context['loaders']['pages'],
  pageClient: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  const page = await pages.load(id)
  if (!page) {
    throw new NotFound('page', id)
  }

  const pageRevision = (page.draft ?? page.pending ?? page.published)!

  const input: Prisma.PageRevisionCreateInput = {
    ...pageRevision,
    blocks: pageRevision.blocks as Prisma.JsonValue[],
    slug: '',
    revision: 0,
    publishedAt: null,
    updatedAt: new Date(),
    createdAt: new Date()
  }

  return pageClient.create({
    data: {
      draft: input,
      modifiedAt: new Date()
    }
  })
}

export const unpublishPage = async (
  id: string,
  authenticate: Context['authenticate'],
  pageClient: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanPublishPage, roles)

  const page = await pageClient.findUnique({where: {id}})

  if (!page) {
    throw new NotFound('page', id)
  }

  return pageClient.update({
    where: {id},
    data: {
      draft: {
        ...(page.pending ?? page.published)!,
        publishAt: null,
        publishedAt: null,
        updatedAt: null
      },
      pending: null,
      published: null
    }
  })
}

export const publishPage = async (
  id: string,
  input: Pick<Prisma.PageRevisionCreateInput, 'publishAt' | 'publishedAt' | 'updatedAt'>,
  authenticate: Context['authenticate'],
  publicPagesBySlug: Context['loaders']['publicPagesBySlug'],
  pageClient: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanPublishPage, roles)

  const publishAt = input.publishAt ?? new Date()
  const publishedAt = input.publishedAt
  const updatedAt = input.updatedAt

  const page = await pageClient.findUnique({where: {id}})

  if (!page) throw new NotFound('page', id)
  if (!page.draft) return null

  const publishedPage = await publicPagesBySlug.load(page.draft.slug)
  if (publishedPage && publishedPage.id !== id)
    throw new DuplicatePageSlugError(publishedPage.id, publishedPage.slug)

  if (publishAt > new Date()) {
    return pageClient.update({
      where: {id},
      data: {
        pending: {
          ...page.draft,
          publishAt: publishAt,
          publishedAt: publishedAt ?? page?.published?.publishedAt ?? publishAt,
          updatedAt: updatedAt ?? publishAt
        },
        draft: null
      }
    })
  }

  return pageClient.update({
    where: {id},
    data: {
      published: {
        ...page.draft,
        publishedAt: publishedAt ?? page.published?.publishAt ?? publishAt,
        updatedAt: updatedAt ?? publishAt,
        publishAt: null
      },
      pending: null,
      draft: null
    }
  })
}

export const updatePage = async (
  id: string,
  input: Omit<
    Prisma.PageRevisionCreateInput,
    'revision' | 'createdAt' | 'updatedAt' | 'publishAt' | 'publishedAt'
  >,
  authenticate: Context['authenticate'],
  pageClient: PrismaClient['page']
) => {
  const {roles} = authenticate()
  authorise(CanCreatePage, roles)

  const page = await pageClient.findUnique({where: {id}})

  if (!page) {
    throw new NotFound('page', id)
  }

  return pageClient.update({
    where: {id},
    data: {
      draft: {
        slug: input.slug,
        title: input.title,
        description: input.description,
        imageID: input.imageID,
        tags: input.tags,
        socialMediaTitle: input.socialMediaTitle,
        socialMediaDescription: input.socialMediaDescription,
        socialMediaImageID: input.socialMediaImageID,
        properties: input.properties,
        blocks: input.blocks,
        revision: page.pending
          ? page.pending.revision + 1
          : page.published
          ? page.published.revision + 1
          : 0,
        updatedAt: new Date(),
        createdAt: page.draft?.createdAt ?? new Date()
      }
    }
  })
}
