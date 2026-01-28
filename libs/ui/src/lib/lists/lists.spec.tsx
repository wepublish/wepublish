import { render } from '@testing-library/react';

import { OrderedList, UnorderedList } from './lists';

describe('UnorderedList', () => {
  it('should render successfully', () => {
    render(
      <UnorderedList>
        <li>Foobar</li>
      </UnorderedList>
    );
  });
});

describe('OrderedList', () => {
  it('should render successfully', () => {
    render(
      <OrderedList>
        <li>Foobar</li>
      </OrderedList>
    );
  });
});
