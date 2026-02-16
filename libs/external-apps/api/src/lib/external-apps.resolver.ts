import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreateExternalApp,
  CanUpdateExternalApp,
  CanDeleteExternalApp,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  ExternalApp,
  CreateExternalAppInput,
  UpdateExternalAppInput,
  ExternalAppFilter,
} from './external-apps.model';
import { ExternalAppsService } from './external-apps.service';
import { ExternalAppsDataloaderService } from './external-apps-dataloader.service';
import { Authenticated } from '@wepublish/authentication/api';

@Resolver()
export class ExternalAppsResolver {
  constructor(
    private externalAppsService: ExternalAppsService,
    private externalAppsDataloader: ExternalAppsDataloaderService
  ) {}

  @Authenticated()
  @Query(returns => [ExternalApp], {
    name: 'externalApps',
    description: 'Returns all external apps. Requires authentication.',
  })
  externalApps(@Args('filter', { nullable: true }) filter?: ExternalAppFilter) {
    return this.externalAppsService.externalAppsList(filter);
  }

  @Authenticated()
  @Query(returns => ExternalApp, {
    name: 'externalApp',
    description:
      'Returns a single external app by id. Requires authentication.',
  })
  externalApp(@Args('id') id: string) {
    return this.externalAppsDataloader.load(id);
  }

  @Permissions(CanCreateExternalApp)
  @Mutation(returns => ExternalApp, {
    name: 'createExternalApp',
    description: 'Creates a new external app.',
  })
  createExternalApp(@Args('input') input: CreateExternalAppInput) {
    return this.externalAppsService.createExternalApp(input);
  }

  @Permissions(CanUpdateExternalApp)
  @Mutation(returns => ExternalApp, {
    name: 'updateExternalApp',
    description: 'Updates an existing external app.',
  })
  updateExternalApp(@Args() input: UpdateExternalAppInput) {
    return this.externalAppsService.updateExternalApp(input);
  }

  @Permissions(CanDeleteExternalApp)
  @Mutation(returns => ExternalApp, {
    name: 'deleteExternalApp',
    description: 'Deletes an external app.',
  })
  deleteExternalApp(@Args('id') id: string) {
    return this.externalAppsService.deleteExternalApp(id);
  }
}
