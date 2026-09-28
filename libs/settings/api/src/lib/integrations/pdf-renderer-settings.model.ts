import {
  Field,
  ObjectType,
  ArgsType,
  registerEnumType,
  PartialType,
  PickType,
  OmitType,
  InputType,
  Int,
} from '@nestjs/graphql';
import { PdfRendererType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(PdfRendererType, {
  name: 'PdfRendererType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingPdfRenderer extends SettingProvider {
  @Field(type => PdfRendererType)
  type!: PdfRendererType;

  @Field({ nullable: true })
  cloudflare_accountId?: string;

  /** hide sensitive fields
  @Field({ nullable: true })
  cloudflare_apiToken?: string;
 **/

  @Field(type => Int, { nullable: true })
  timeoutMs?: number;
}

@InputType()
export class SettingPdfRendererFilter extends PartialType(
  PickType(SettingPdfRenderer, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingPdfRendererInput extends OmitType(
  SettingPdfRenderer,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => PdfRendererType)
  type!: PdfRendererType;

  @Field({ nullable: true })
  cloudflare_apiToken?: string;
}

@ArgsType()
export class UpdateSettingPdfRendererInput extends PartialType(
  OmitType(CreateSettingPdfRendererInput, ['type'] as const, ArgsType),
  ArgsType
) {}
