import { Config, Data, Puck } from '@puckeditor/core';
import { fireEvent, render, screen } from '@testing-library/react';

import { actionBarPlugin, themePlugin } from './action-bar';
import { PuckActionBar } from './action-bar.component';

const config: Config = {
  components: {
    Title: {
      fields: { text: { type: 'text' } },
      render: ({ text }) => <h1>{text}</h1>,
    },
  },
};

let documents = 0;

const createDocument = (): Data => ({
  root: { props: {} },
  content: [
    { type: 'Title', props: { id: `First-${++documents}`, text: 'First' } },
    { type: 'Title', props: { id: `Second-${documents}`, text: 'Second' } },
  ],
});

const renderActionBar = (index: number) =>
  render(
    <Puck
      config={config}
      data={createDocument()}
      ui={{ itemSelector: { index, zone: 'root:default-zone' } }}
    >
      <PuckActionBar
        label="Title"
        parentAction={<button type="button">Select parent</button>}
        dragHandle={<button type="button">Drag</button>}
      >
        <button type="button">Duplicate</button>
      </PuckActionBar>
    </Puck>
  );

const names = () =>
  screen
    .getAllByRole('button')
    .map(button => button.textContent || button.getAttribute('title'));

describe('PuckActionBar', () => {
  it('keeps the parent action, the label and the drag handle of Puck', () => {
    renderActionBar(0);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(names()).toEqual([
      'Select parent',
      'Lock block',
      'Duplicate',
      'Move up',
      'Move down',
      'Drag',
    ]);
  });

  it('only moves blocks where there is room to move them', () => {
    renderActionBar(0);

    expect(screen.getByRole('button', { name: 'Move up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move down' })).toBeEnabled();
  });

  it('moves the selected block down', () => {
    renderActionBar(0);

    fireEvent.click(screen.getByRole('button', { name: 'Move down' }));

    expect(screen.getByRole('button', { name: 'Move up' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move down' })).toBeDisabled();
  });
});

describe('actionBarPlugin', () => {
  it('only overrides the action bar of blocks', () => {
    expect(Object.keys(actionBarPlugin.overrides ?? {})).toEqual(['actionBar']);
    expect(themePlugin).toBe(actionBarPlugin);
  });
});
