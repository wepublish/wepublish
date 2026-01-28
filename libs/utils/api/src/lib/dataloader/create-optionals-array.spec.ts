import { createOptionalsArray } from './create-optionals-array';

it('should return missing keys as null', () => {
  expect(
    createOptionalsArray(['123', '1234'], [{ id: '1234' }], 'id')
  ).toMatchSnapshot();
});
