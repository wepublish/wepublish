import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LetterLogState, PrismaClient } from '@prisma/client';
import {
  LetterContext,
  toDeliveryProduct,
  toPrintMode,
  toPrintSpectrum,
} from '@wepublish/letter/api';
import {
  CanGetMailTemplates,
  CanSendTestMailTemplates,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { getMaxTake } from '@wepublish/utils/api';
import {
  LetterPreviewInput,
  LetterPreviewModel,
  MailProviderModel,
} from '../mail-template/mail-template.model';
import { LetterPreviewService } from './letter-preview.service';
import { LetterLogModel } from './letter-send.model';

@Resolver(() => LetterLogModel)
export class LetterSendResolver {
  constructor(
    private prisma: PrismaClient,
    private letterContext: LetterContext,
    private letterPreviewService: LetterPreviewService
  ) {}

  @Permissions(CanGetMailTemplates)
  @Query(() => MailProviderModel, {
    description: `The provider letters are printed and posted through.`,
  })
  async letterProvider() {
    return { name: await this.letterContext.letterProvider.getName() };
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => LetterPreviewModel, {
    description: `Render a template as the letter it would be printed as, without sending it.`,
  })
  async previewLetter(
    @Args('input') input: LetterPreviewInput
  ): Promise<LetterPreviewModel> {
    return this.letterPreviewService.preview(input);
  }

  @Permissions(CanGetMailTemplates)
  @Query(() => [LetterLogModel], {
    description: `Return the letters that were sent, newest first.`,
  })
  async letterLogs(
    @Args('take', { type: () => Int, nullable: true, defaultValue: 50 })
    take: number,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('state', { type: () => String, nullable: true }) state?: string
  ) {
    return this.prisma.letterLog.findMany({
      where: state ? { state: state as LetterLogState } : undefined,
      take: getMaxTake(take),
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Sends a letter that was created with `auto_send` off and is waiting for a
   * human to approve the cost.
   */
  @Permissions(CanSendTestMailTemplates)
  @Mutation(() => LetterLogModel)
  async dispatchLetter(@Args('id') id: string) {
    const letterLog = await this.prisma.letterLog.findUniqueOrThrow({
      where: { id },
    });

    if (!letterLog.providerLetterID) {
      throw new Error('This letter was never handed to the provider.');
    }

    await this.letterContext.letterProvider.dispatchLetter({
      providerLetterID: letterLog.providerLetterID,
      deliveryProduct: toDeliveryProduct(letterLog.deliveryProduct),
      printMode: toPrintMode(letterLog.printMode),
      printSpectrum: toPrintSpectrum(letterLog.printSpectrum),
    });

    return this.prisma.letterLog.update({
      where: { id },
      data: { state: LetterLogState.dispatched, sentDate: new Date() },
    });
  }

  @Permissions(CanSendTestMailTemplates)
  @Mutation(() => LetterLogModel)
  async cancelLetter(@Args('id') id: string) {
    const letterLog = await this.prisma.letterLog.findUniqueOrThrow({
      where: { id },
    });

    if (letterLog.providerLetterID) {
      await this.letterContext.letterProvider.cancelLetter(
        letterLog.providerLetterID
      );
    }

    return this.prisma.letterLog.update({
      where: { id },
      data: { state: LetterLogState.canceled },
    });
  }
}
