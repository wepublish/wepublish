import { Link, Stack } from '@mui/material';
import { Meta, StoryObj } from '@storybook/react';
import { MdFavorite, MdHeartBroken } from 'react-icons/md';

import { Rating as RatingCmp } from './rating';

export default {
  component: RatingCmp,
  title: 'UI/Rating',
  render: () => (
    <Stack
      gap={1}
      alignItems={'start'}
    >
      <RatingCmp />
      <RatingCmp averageRating={4} />
      <RatingCmp
        averageRating={4}
        readOnly
      />
      <RatingCmp
        averageRating={3}
        highlightSelectedOnly
      />
      <RatingCmp
        averageRating={2}
        averageEmptyColor={'#000'}
        averageFilledColor={'#00F'}
      />
      <RatingCmp
        averageRating={1}
        averageEmptyColor={'#A77'}
        averageFilledColor={'#f50'}
        icon={<MdFavorite />}
        emptyIcon={<MdHeartBroken />}
      />

      <br />
      <Link
        href="https://mui.com/material-ui/react-rating/"
        target="_blank"
      >
        See more
      </Link>
    </Stack>
  ),
} as Meta<typeof Rating>;

export const Rating: StoryObj<typeof RatingCmp> = {};
