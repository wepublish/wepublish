import { createInvoiceFilter } from './invoice.service';

describe('createInvoiceFilter', () => {
  it('filters invoices containing an item with the given discount code', () => {
    expect(
      createInvoiceFilter({ discountCodeId: 'code-a' }).AND
    ).toContainEqual({
      items: {
        some: {
          discountCodeId: 'code-a',
        },
      },
    });
  });

  it('does not restrict items when no discount code is given', () => {
    expect(createInvoiceFilter({ mail: 'foo@example.com' }).AND).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ items: {} })])
    );
  });
});
