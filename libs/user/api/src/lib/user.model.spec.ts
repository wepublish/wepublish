import { getFieldsAndDecoratorForType } from '@nestjs/graphql/dist/schema-builder/utils/get-fields-and-decorator.util';
import { UpdateCurrentUserInput } from './user.model';

const argumentNames = (target: object) =>
  getFieldsAndDecoratorForType(target as any).fields.map(field => field.name);

describe('UpdateCurrentUserInput', () => {
  it('lets a user update their own profile fields', () => {
    expect(argumentNames(UpdateCurrentUserInput)).toEqual(
      expect.arrayContaining(['name', 'firstName', 'flair', 'address'])
    );
  });

  it.each(['password', 'challengeAnswer', 'email'])(
    'does not accept %s',
    field => {
      expect(argumentNames(UpdateCurrentUserInput)).not.toContain(field);
    }
  );
});
