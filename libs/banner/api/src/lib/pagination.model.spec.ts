import { PaginationArgs } from './pagination.model';

describe('PaginationArgs', () => {
  it('should create pagination args with different values', () => {
    const paginationArgs = new PaginationArgs();
    paginationArgs.skip = 20;
    paginationArgs.take = 50;

    expect(paginationArgs.skip).toBe(20);
    expect(paginationArgs.take).toBe(50);
  });
});
