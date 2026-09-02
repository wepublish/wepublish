import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DiscountCodeService } from './discountCode.service';
import {
  CreateDiscountCodeInput,
  DiscountCode,
  PaginatedDiscountCodes,
  DiscountCodeListArgs,
  UpdateDiscountCodeInput,
} from './discountCode.model';
import {
  CanGetDiscountCode,
  CanCreateDiscountCode,
  CanDeleteDiscountCode,
  CanUpdateDiscountCode,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { DiscountCodeDataloader } from './discountCode.dataloader';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => DiscountCode)
export class DiscountCodeResolver {
  constructor(
    private discountCodeservice: DiscountCodeService,
    private dataloader: DiscountCodeDataloader
  ) {}

  @Permissions(CanGetDiscountCode)
  @Query(() => DiscountCode, {
    description: `Returns an discountCode by id or discountCode.`,
  })
  public async discountCode(@Args('id') id: string) {
    const discountCode = await this.dataloader.load(id);

    if (!discountCode) {
      throw new NotFoundException(`DiscountCode with id ${id} was not found.`);
    }

    return discountCode;
  }

  @Permissions(CanGetDiscountCode)
  @Query(() => PaginatedDiscountCodes, {
    description: 'This query returns a list of discountCodes',
  })
  async discountCodes(@Args() args: DiscountCodeListArgs) {
    return this.discountCodeservice.getDiscountCodes(args);
  }

  @Permissions(CanCreateDiscountCode)
  @Mutation(returns => DiscountCode, {
    description: `Creates a new discountCode.`,
  })
  public createDiscountCode(@Args() discountCode: CreateDiscountCodeInput) {
    return this.discountCodeservice.createDiscountCode(discountCode);
  }

  @Permissions(CanUpdateDiscountCode)
  @Mutation(returns => DiscountCode, {
    description: `Updates an existing discountCode.`,
  })
  public updateDiscountCode(@Args() discountCode: UpdateDiscountCodeInput) {
    return this.discountCodeservice.updateDiscountCode(discountCode);
  }

  @Permissions(CanDeleteDiscountCode)
  @Mutation(returns => DiscountCode, {
    description: `Deletes an existing discountCode.`,
  })
  public deleteDiscountCode(@Args('id') id: string) {
    return this.discountCodeservice.deleteDiscountCode(id);
  }
}
