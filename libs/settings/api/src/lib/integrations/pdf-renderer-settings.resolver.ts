import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  CanCreatePdfRendererSettings,
  CanDeletePdfRendererSettings,
  CanGetPdfRendererSettings,
  CanUpdatePdfRendererSettings,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  CreateSettingPdfRendererInput,
  SettingPdfRenderer,
  UpdateSettingPdfRendererInput,
  SettingPdfRendererFilter,
} from './pdf-renderer-settings.model';
import { PdfRendererSettingsService } from './pdf-renderer-settings.service';
import { PdfRendererSettingsDataloaderService } from './pdf-renderer-settings-dataloader.service';

@Resolver()
export class PdfRendererSettingsResolver {
  constructor(
    private pdfRendererSettingsService: PdfRendererSettingsService,
    private pdfRendererSettingsDataloader: PdfRendererSettingsDataloaderService
  ) {}

  @Permissions(CanGetPdfRendererSettings)
  @Query(returns => [SettingPdfRenderer], {
    name: 'pdfRendererSettings',
    description: 'Returns all pdf renderer settings.',
  })
  pdfRendererSettings(
    @Args('filter', { nullable: true }) filter?: SettingPdfRendererFilter
  ) {
    return this.pdfRendererSettingsService.pdfRendererSettingsList(filter);
  }

  @Permissions(CanGetPdfRendererSettings)
  @Query(returns => SettingPdfRenderer, {
    name: 'pdfRendererSetting',
    description: 'Returns a single pdf renderer setting by id.',
  })
  pdfRendererSetting(@Args('id') id: string) {
    return this.pdfRendererSettingsDataloader.load(id);
  }

  @Permissions(CanCreatePdfRendererSettings)
  @Mutation(returns => SettingPdfRenderer, {
    name: 'createPdfRendererSetting',
    description: 'Creates a new pdf renderer setting.',
  })
  createPdfRendererSetting(@Args() input: CreateSettingPdfRendererInput) {
    return this.pdfRendererSettingsService.createPdfRendererSetting(input);
  }

  @Permissions(CanUpdatePdfRendererSettings)
  @Mutation(returns => SettingPdfRenderer, {
    name: 'updatePdfRendererSetting',
    description: 'Updates an existing pdf renderer setting.',
  })
  updatePdfRendererSetting(@Args() input: UpdateSettingPdfRendererInput) {
    return this.pdfRendererSettingsService.updatePdfRendererSetting(input);
  }

  @Permissions(CanDeletePdfRendererSettings)
  @Mutation(returns => SettingPdfRenderer, {
    name: 'deletePdfRendererSetting',
    description: 'Deletes an existing pdf renderer setting.',
  })
  deletePdfRendererSetting(@Args('id') id: string) {
    return this.pdfRendererSettingsService.deletePdfRendererSetting(id);
  }
}
