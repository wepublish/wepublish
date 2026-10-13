import { NotFoundException } from '@nestjs/common';
import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  AuthSession,
  Authenticated,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { MemberPlan } from '@wepublish/member-plan/api';
import {
  CreateGateInput,
  Gate,
  GateBypass,
  GateNewsletterParam,
  GatesArgs,
  PageModel,
  UpdateGateInput,
} from './gate.model';
import { assertGatePermission } from './gate-permission';
import { GateMemberPlansDataloader } from './gate-member-plans.dataloader';
import { GateService, GateWithActions } from './gate.service';

@Resolver(() => Gate)
export class GateResolver {
  constructor(
    private gateService: GateService,
    private memberPlansDataloader: GateMemberPlansDataloader,
    private imageDataloader: ImageDataloaderService
  ) {}

  @Public()
  @Query(() => [Gate], {
    description: `Returns the gates of one mode, oldest first.`,
  })
  public async gates(
    @Args() args: GatesArgs,
    @CurrentUser() session: AuthSession | undefined
  ) {
    assertGatePermission(args.mode, 'get', session);

    return this.gateService.getGates(args);
  }

  @Public()
  @Query(() => Gate, { description: `Returns a gate by id.` })
  public async gate(
    @Args('id') id: string,
    @CurrentUser() session: AuthSession | undefined
  ) {
    const gate = await this.loadGate(id);
    assertGatePermission(gate.mode, 'get', session);

    return gate;
  }

  @Authenticated()
  @Mutation(() => Gate, {
    description: `Creates a gate. Activating a content gate deactivates every other content gate.`,
  })
  public async createGate(
    @Args('input') input: CreateGateInput,
    @CurrentUser() session: AuthSession | undefined
  ) {
    assertGatePermission(input.mode, 'create', session);

    return this.gateService.createGate(input);
  }

  @Authenticated()
  @Mutation(() => Gate, {
    description: `Updates a gate. Activating a content gate deactivates every other content gate.`,
  })
  public async updateGate(
    @Args('input') input: UpdateGateInput,
    @CurrentUser() session: AuthSession | undefined
  ) {
    const gate = await this.loadGate(input.id);
    assertGatePermission(gate.mode, 'update', session);

    return this.gateService.updateGate(input);
  }

  @Authenticated()
  @Mutation(() => Gate, { description: `Deletes a gate.` })
  public async deleteGate(
    @Args('id') id: string,
    @CurrentUser() session: AuthSession | undefined
  ) {
    const gate = await this.loadGate(id);
    assertGatePermission(gate.mode, 'delete', session);

    return this.gateService.deleteGate(id);
  }

  @ResolveField(() => [MemberPlan])
  public memberPlans(@Parent() gate: GateWithActions) {
    return this.memberPlansDataloader.load(gate.id);
  }

  @ResolveField(() => [GateBypass])
  public bypasses(@Parent() gate: GateWithActions) {
    return this.gateService.getBypasses(gate.id);
  }

  @ResolveField(() => [PageModel])
  public showOnPages(@Parent() gate: GateWithActions) {
    return this.gateService.getPages(gate.id);
  }

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() { imageId }: GateWithActions) {
    return imageId ? this.imageDataloader.load(imageId) : null;
  }

  @ResolveField(() => [GateNewsletterParam])
  public newsletterParams(@Parent() { newsletterParams }: GateWithActions) {
    return (newsletterParams as unknown as GateNewsletterParam[] | null) ?? [];
  }

  private async loadGate(id: string) {
    const gate = await this.gateService.getGate(id);

    if (!gate) {
      throw new NotFoundException(`Gate with id ${id} was not found.`);
    }

    return gate;
  }
}
