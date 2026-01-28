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
      <RatingCmp defaultValue={4} />
      <RatingCmp
        defaultValue={4}
        readOnly
      />
      <RatingCmp
        defaultValue={3}
        highlightSelectedOnly
      />
      <RatingCmp
        defaultValue={2}
        emptyColor={'#000'}
        hoverColor={'#F00'}
        filledColor={'#00F'}
      />
      <RatingCmp
        defaultValue={1}
        emptyColor={'#A77'}
        hoverColor={'#f50'}
        filledColor={'#f50'}
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
