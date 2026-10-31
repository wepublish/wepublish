import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

import { ApiPuckRegistry } from './puck-blocks';

@ObjectType({
  description:
    'The components the Puck AI designed for a document, kept exactly as Puck keeps them in `_dynamicConfig`.',
})
@InputType('PuckRegistryInput')
export class PuckRegistry {
  @Field(() => GraphQLJSONObject, {
    description:
      'The designed components by name, each with its annotated `html` and optionally `label`, `styles`, `script`, `fields`, `defaultProps`, `streaming` and any other key Puck AI keeps.',
  })
  components!: ApiPuckRegistry['components'];

  @Field(() => String, {
    nullable: true,
    description: 'Styles every designed component of the document shares.',
  })
  styles?: string | null;

  @Field(() => String, {
    nullable: true,
    description:
      'A script the document runs in the browser once it is mounted, never on the server.',
  })
  script?: string | null;
}
