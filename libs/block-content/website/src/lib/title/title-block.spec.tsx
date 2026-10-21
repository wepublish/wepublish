import { screen } from '@testing-library/react';
import { mockTitleBlock, renderWithProviders } from '@wepublish/mocks/website';
import { BuilderTitleBlockProps } from '@wepublish/website/builder';
import { TitleBlock } from './title-block';

describe('TitleBlock', () => {
  it('shows the title as the main heading with pre-title and lead', () => {
    renderWithProviders(
      <TitleBlock
        {...mockTitleBlock({
          preTitle: 'Interview',
          title: 'The future of local news',
          lead: 'Why small newsrooms matter',
        })}
      />
    );

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'The future of local news',
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.getByText('Why small newsrooms matter')).toBeInTheDocument();
  });

  it('leaves out the lead when it is empty', () => {
    renderWithProviders(
      <TitleBlock {...mockTitleBlock({ preTitle: 'Interview', lead: '' })} />
    );

    expect(screen.getByText('Interview')).toBeInTheDocument();
    expect(screen.queryByText('Lead')).not.toBeInTheDocument();
  });

  it('leaves out the pre-title when it is empty', () => {
    renderWithProviders(<TitleBlock {...mockTitleBlock({ preTitle: '' })} />);

    expect(screen.queryByText('Pre-Title')).not.toBeInTheDocument();
    expect(screen.getByText('Lead')).toBeInTheDocument();
  });

  it('renders the pre-title through a custom component', () => {
    const PreTitle = ({
      preTitle,
    }: Pick<BuilderTitleBlockProps, 'preTitle'>) => (
      <strong>Custom {preTitle}</strong>
    );

    renderWithProviders(
      <TitleBlock
        {...mockTitleBlock({ preTitle: 'Interview' })}
        PreTitle={PreTitle}
      />
    );

    expect(screen.getByText('Custom Interview')).toBeInTheDocument();
  });
});
