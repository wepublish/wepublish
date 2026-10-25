import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  CommentRatingSystemAnswer,
  RatingSystemType,
} from '@wepublish/editor/api';
import { createRef, ReactNode } from 'react';

import { RatingAnswers } from './commentRatingEditView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const ratingAnswer = (id: string, answer: string) =>
  ({
    __typename: 'CommentRatingSystemAnswer',
    id,
    answer,
    type: RatingSystemType.Star,
    ratingSystemId: 'system-1',
  }) as CommentRatingSystemAnswer;

const withTheme = (children: ReactNode) => (
  <ThemeProvider theme={createTheme({ cssVariables: true })}>
    {children}
  </ThemeProvider>
);

describe('RatingAnswers', () => {
  it('labels the name and type of every rating answer', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <RatingAnswers
          answers={[
            {
              __typename: 'CommentRatingSystemAnswer',
              id: 'answer-1',
              answer: 'Relevance',
              type: RatingSystemType.Star,
              ratingSystemId: 'system-1',
            },
          ]}
          onDeleteAnswer={vi.fn()}
          onUpdateAnswer={vi.fn()}
        />
      </ThemeProvider>
    );

    expect(
      screen.getByRole('textbox', { name: 'comments.ratingEdit.placeholder' })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'comments.ratingEdit.type' })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'delete Relevance' })
    ).toBeTruthy();
  });

  it('moves focus to the next answer after one is deleted', () => {
    const answers = [
      ratingAnswer('answer-1', 'Relevance'),
      ratingAnswer('answer-2', 'Tone'),
    ];
    const props = { onDeleteAnswer: vi.fn(), onUpdateAnswer: vi.fn() };
    const { rerender } = render(
      withTheme(
        <RatingAnswers
          answers={answers}
          {...props}
        />
      )
    );

    rerender(
      withTheme(
        <RatingAnswers
          answers={[answers[1]]}
          {...props}
        />
      )
    );

    expect(document.activeElement).toBe(screen.getByDisplayValue('Tone'));
  });

  it('moves focus to the fallback once the last answer is deleted', () => {
    const fallback = createRef<HTMLButtonElement>();
    const props = {
      onDeleteAnswer: vi.fn(),
      onUpdateAnswer: vi.fn(),
      emptyFocusRef: fallback,
    };
    const { rerender } = render(
      withTheme(
        <>
          <button ref={fallback} />
          <RatingAnswers
            answers={[ratingAnswer('answer-1', 'Relevance')]}
            {...props}
          />
        </>
      )
    );

    rerender(
      withTheme(
        <>
          <button ref={fallback} />
          <RatingAnswers
            answers={[]}
            {...props}
          />
        </>
      )
    );

    expect(document.activeElement).toBe(fallback.current);
  });
});
