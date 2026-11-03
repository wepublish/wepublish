import { render, screen } from '@testing-library/react';
import { createElement } from 'react';

import { emptyPuckBlockData } from './block.types';
import { builderBlock, plainBlock } from './builder-block';

type GreetingProps = { name: string; className?: string };

const received: unknown[] = [];

const Greeting = (props: GreetingProps) => {
  received.push(props);

  return <p className={props.className}>Hello {props.name}</p>;
};

const renderBlock = (Block: ReturnType<typeof builderBlock<GreetingProps>>) =>
  render(
    createElement(Block, {
      id: 'Greeting-1',
      props: { name: 'Ada' },
      data: emptyPuckBlockData,
      slots: {},
      styling: { xs: { opacity: 50 } },
      visibility: { disabled: false },
      className: 'styled',
    })
  );

describe.each([
  ['builderBlock', builderBlock],
  ['plainBlock', plainBlock],
])('%s', (_name, adapt) => {
  beforeEach(() => {
    received.length = 0;
  });

  it('renders the component with the stored props and the class name', () => {
    renderBlock(adapt(Greeting));

    expect(screen.getByText('Hello Ada').className).toBe('styled');
  });

  it('passes nothing of the envelope on', () => {
    renderBlock(adapt(Greeting));

    expect(received).toEqual([{ name: 'Ada', className: 'styled' }]);
  });
});
