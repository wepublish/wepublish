import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { EditorBlockType } from '@wepublish/editor/api';

import { CrowdfundingBlockValue } from '.';
import { CrowdfundingBlock } from './CrowdfundingBlock';

const theme = createTheme({ cssVariables: true });

const renderBlock = (crowdfunding: unknown) =>
  render(
    <ThemeProvider theme={theme}>
      <CrowdfundingBlock
        type={EditorBlockType.Crowdfunding}
        value={{ crowdfunding } as unknown as CrowdfundingBlockValue}
        onChange={vi.fn()}
      />
    </ThemeProvider>
  );

describe('CrowdfundingBlock', () => {
  it('spells out how to choose a crowdfunding when empty', () => {
    renderBlock(null);

    expect(screen.getByText('blocks.crowdfunding.title')).toBeVisible();
  });

  it('shows the progress of the chosen crowdfunding', () => {
    renderBlock({
      id: 'cf-1',
      name: 'New printing press',
      activeGoal: { progress: 42 },
    });

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '42'
    );
    expect(
      screen.getByRole('button', { name: 'blocks.crowdfunding.edit' })
    ).toBeInTheDocument();
  });
});
