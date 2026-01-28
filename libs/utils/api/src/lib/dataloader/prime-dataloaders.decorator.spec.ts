import { PrimeDataLoader } from './prime-dataloaders.decorator';

class MockDataloader {
  prime = jest.fn();
}

it('should prime an object with an id', async () => {
  const mock = new MockDataloader();
  const decoratorFactory = PrimeDataLoader(MockDataloader as any);
  const container = {};

  const descriptor = {
    [`__DATALOADER__${MockDataloader.name}`]: mock,
    value: () => ({ id: '1234' }),
  };
  decoratorFactory(container, 'foobar', descriptor);
  await descriptor.value();

  expect(mock.prime).toHaveBeenCalledWith('1234', { id: '1234' });
});

it('should prime an array', async () => {
  const mock = new MockDataloader();
  const decoratorFactory = PrimeDataLoader(MockDataloader as any);
  const container = {};

  const descriptor = {
    [`__DATALOADER__${MockDataloader.name}`]: mock,
    value: () => [{ id: '1234' }, { id: '1235' }],
  };
  decoratorFactory(container, 'foobar', descriptor);
  await descriptor.value();

  expect(mock.prime).toHaveBeenCalledWith('1234', { id: '1234' });
  expect(mock.prime).toHaveBeenCalledWith('1235', { id: '1235' });
  expect(mock.prime).toHaveBeenCalledTimes(2);
});

it('should prime a paginated result', async () => {
  const mock = new MockDataloader();
  const decoratorFactory = PrimeDataLoader(MockDataloader as any);
  const container = {};

  const descriptor = {
    [`__DATALOADER__${MockDataloader.name}`]: mock,
    value: () => ({
      nodes: [{ id: '1234' }, { id: '1235' }],
    }),
  };
  decoratorFactory(container, 'foobar', descriptor);
  await descriptor.value();

  expect(mock.prime).toHaveBeenCalledWith('1234', { id: '1234' });
  expect(mock.prime).toHaveBeenCalledWith('1235', { id: '1235' });
  expect(mock.prime).toHaveBeenCalledTimes(2);
});

it('should not prime null', async () => {
  const mock = new MockDataloader();
  const decoratorFactory = PrimeDataLoader(MockDataloader as any);
  const container = {};

  const descriptor = {
    [`__DATALOADER__${MockDataloader.name}`]: mock,
    value: () => null,
  };
  decoratorFactory(container, 'foobar', descriptor);
  await descriptor.value();

  expect(mock.prime).not.toHaveBeenCalled();
});

it('should not invalid objects', async () => {
  const mock = new MockDataloader();
  const decoratorFactory = PrimeDataLoader(MockDataloader as any);
  const container = {};

  const descriptor = {
    [`__DATALOADER__${MockDataloader.name}`]: mock,
    value: () => ({ notAnId: '1234' }),
  };
  decoratorFactory(container, 'foobar', descriptor);
  await descriptor.value();

  expect(mock.prime).not.toHaveBeenCalled();
});
