import { withShowErrorAlert } from '@wepublish/errors/website';

import { plainBlock } from '../../blocks/builder-block';
import {
  TeaserAuthors,
  TeaserAuthorsConfigProps,
} from './teaser-authors/teaser-authors.component';
import {
  TeaserDate,
  TeaserDateConfigProps,
} from './teaser-date/teaser-date.component';
import {
  TeaserImage,
  TeaserImageConfigProps,
} from './teaser-image/teaser-image.component';
import {
  TeaserLead,
  TeaserLeadConfigProps,
} from './teaser-lead/teaser-lead.component';
import {
  TeaserPreTitle,
  TeaserPreTitleConfigProps,
} from './teaser-pre-title/teaser-pre-title.component';
import {
  TeaserTags,
  TeaserTagsConfigProps,
} from './teaser-tags/teaser-tags.component';
import {
  TeaserTitle,
  TeaserTitleConfigProps,
} from './teaser-title/teaser-title.component';

type StoredProps<Props> = Omit<Props, 'className'>;

export const TeaserTitleRender = plainBlock<
  StoredProps<TeaserTitleConfigProps>
>(withShowErrorAlert(TeaserTitle));

export const TeaserPreTitleRender = plainBlock<
  StoredProps<TeaserPreTitleConfigProps>
>(withShowErrorAlert(TeaserPreTitle));

export const TeaserLeadRender = plainBlock<StoredProps<TeaserLeadConfigProps>>(
  withShowErrorAlert(TeaserLead)
);

export const TeaserImageRender = plainBlock<
  StoredProps<TeaserImageConfigProps>
>(withShowErrorAlert(TeaserImage));

export const TeaserAuthorsRender = plainBlock<
  StoredProps<TeaserAuthorsConfigProps>
>(withShowErrorAlert(TeaserAuthors));

export const TeaserDateRender = plainBlock<StoredProps<TeaserDateConfigProps>>(
  withShowErrorAlert(TeaserDate)
);

export const TeaserTagsRender = plainBlock<StoredProps<TeaserTagsConfigProps>>(
  withShowErrorAlert(TeaserTags)
);
