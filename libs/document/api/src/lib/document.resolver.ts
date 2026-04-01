import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Document,
  DocumentListArgs,
  PaginatedDocuments,
  UpdateDocumentInput,
  UploadDocumentInput,
} from './document.model';
import { MediaAdapter } from '@wepublish/image/api';
import { NotFoundException } from '@nestjs/common';
import { Permissions } from '@wepublish/permissions/api';
import {
  CanCreateDocument,
  CanDeleteDocument,
  CanGetDocument,
  CanGetDocuments,
} from '@wepublish/permissions';
import { DocumentService } from './document.service';
import { PrismaClient } from '@prisma/client';

@Resolver(() => Document)
export class DocumentResolver {
  constructor(
    private service: DocumentService,
    private mediaAdapter: MediaAdapter,
    private prisma: PrismaClient
  ) {}

  @Permissions(CanGetDocuments)
  @Query(() => PaginatedDocuments, {
    description: `Returns a paginated list of documents based on the filters given.`,
  })
  public documents(@Args() filter: DocumentListArgs) {
    return this.service.getDocuments(filter);
  }

  @Permissions(CanGetDocument)
  @Query(() => Document, { description: `Returns a document by id.` })
  public async document(@Args('id') id: string) {
    const document = await this.prisma.document.findUnique({ where: { id } });

    if (!document) {
      throw new NotFoundException(`Document with id ${id} was not found.`);
    }

    return document;
  }

  @Permissions(CanCreateDocument)
  @Mutation(returns => Document, { description: `Uploads a new document.` })
  public uploadDocument(@Args() document: UploadDocumentInput) {
    return this.service.createDocument(document);
  }

  @Permissions(CanCreateDocument)
  @Mutation(returns => Document, {
    description: `Updates an existing document.`,
  })
  public updateDocument(@Args() document: UpdateDocumentInput) {
    return this.service.updateDocument(document);
  }

  @Permissions(CanDeleteDocument)
  @Mutation(returns => String, {
    description: `Deletes an existing document.`,
  })
  public deleteDocument(@Args('id') id: string) {
    return this.service.deleteDocument(id);
  }

  @ResolveField(() => String)
  public async url(@Parent() document: Document) {
    return this.mediaAdapter.getDocumentURL(document);
  }

  @ResolveField(() => String, { nullable: true })
  public async thumbnailURL(@Parent() document: Document) {
    return this.mediaAdapter.getDocumentThumbnailURL(document);
  }
}
