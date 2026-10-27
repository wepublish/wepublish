import { faker } from '@faker-js/faker';

export const MOCK_SEED = 1;
export const MOCK_REFERENCE_DATE = '2023-01-01T00:00:00.000Z';
export const MOCK_FAR_FUTURE_DATE = '2099-01-01T00:00:00.000Z';

export const seedMocks = (seed = MOCK_SEED) => {
  faker.seed(seed);
  faker.setDefaultRefDate(MOCK_REFERENCE_DATE);
};

seedMocks();

export { faker };
