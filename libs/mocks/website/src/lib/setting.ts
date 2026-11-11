import { FullSettingFragment, SettingName } from '@wepublish/website/api';
import { faker } from './faker';
import { definedOnly } from './overrides';

export const mockSetting = (
  overrides: Partial<FullSettingFragment> = {}
): FullSettingFragment => ({
  __typename: 'Setting',
  id: faker.string.nanoid(),
  name: SettingName.AllowGuestCommenting,
  value: true,
  ...definedOnly(overrides),
});
