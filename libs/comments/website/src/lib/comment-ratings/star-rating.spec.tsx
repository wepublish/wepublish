import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { WebsiteBuilderProvider } from '@wepublish/website/builder';
import { StarRating } from './star-rating';

const Rating = ({
  onChange,
  value,
}: {
  onChange?: (event: unknown, value: number | null) => void;
  value?: number;
}) => <button onClick={() => onChange?.({}, null)}>rating {value}</button>;

describe('StarRating', () => {
  it('keeps the existing rating when the underlying rating control emits null', () => {
    const onChange = jest.fn();

    render(
      <ThemeProvider theme={createTheme()}>
        <WebsiteBuilderProvider
          elements={{ Rating: Rating as unknown as never }}
        >
          <StarRating
            rating={3}
            onChange={onChange}
          />
        </WebsiteBuilderProvider>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'rating 3' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });
});
