import { faker } from '@faker-js/faker';

// Fixed seed + reference date so all faker-generated values are identical
// across every Chromatic build, regardless of module load order.
faker.seed(123);
faker.setDefaultRefDate(new Date('2020-01-01'));

export * from './lib/author';
export * from './lib/image';
export * from './lib/tag';
export * from './lib/richtext';
export * from './lib/event';
export * from './lib/poll';
export * from './lib/comment';
export * from './lib/article';
export * from './lib/page';
export * from './lib/peer';
export * from './lib/block-content';
export * from './lib/crowdfunding';
export * from './lib/user';
export * from './lib/membership';
export * from './lib/user';
