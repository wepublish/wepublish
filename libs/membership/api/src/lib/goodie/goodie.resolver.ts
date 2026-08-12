import { NotFoundException } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Goodie as PGoodie } from '@prisma/client';
import { MemberPlan } from '@wepublish/member-plan/api';
import {
  CanCreateGoodie,
  CanDeleteGoodie,
  CanGetGoodie,
  CanUpdateGoodie,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import { GoodieDataloader } from './goodie.dataloader';
import {
  CreateGoodieInput,
  Goodie,
  GoodieListArgs,
  PaginatedGoodies,
  UpdateGoodieInput,
} from './goodie.model';
import { GoodieService } from './goodie.service';

@Resolver(() => Goodie)
export class GoodieResolver {
  constructor(
    private goodieService: GoodieService,
    private dataloader: GoodieDataloader
  ) {}

  @Permissions(CanGetGoodie)
  @Query(() => Goodie, { description: `Returns a goodie by id.` })
  public async goodie(@Args('id') id: string) {
    const goodie = await this.dataloader.load(id);

    if (!goodie) {
      throw new NotFoundException(`Goodie with id ${id} was not found.`);
    }

    return goodie;
  }

  @Permissions(CanGetGoodie)
  @Query(() => PaginatedGoodies, {
    description: 'This query returns a list of goodies',
  })
  async goodies(@Args() args: GoodieListArgs) {
    return this.goodieService.getGoodies(args);
  }

  @Permissions(CanCreateGoodie)
  @Mutation(returns => Goodie, { description: `Creates a new goodie.` })
  public createGoodie(@Args() goodie: CreateGoodieInput) {
    return this.goodieService.createGoodie(goodie);
  }

  @Permissions(CanUpdateGoodie)
  @Mutation(returns => Goodie, { description: `Updates an existing goodie.` })
  public updateGoodie(@Args() goodie: UpdateGoodieInput) {
    return this.goodieService.updateGoodie(goodie);
  }

  @Permissions(CanDeleteGoodie)
  @Mutation(returns => Goodie, { description: `Deletes an existing goodie.` })
  public deleteGoodie(@Args('id') id: string) {
    return this.goodieService.deleteGoodie(id);
  }

  @ResolveField(() => [MemberPlan])
  public memberPlans(@Parent() goodie: PGoodie) {
    return this.goodieService.getMemberPlansForGoodie(goodie.id);
  }

  @ResolveField(() => Int, { nullable: true })
  public availableStock(@Parent() goodie: PGoodie) {
    return this.goodieService.getAvailableStock(goodie);
  }
}
