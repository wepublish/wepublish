import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import {
  BuilderRichTextBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

import { eenewsColors } from '../../theme';

const CalloutAside = styled('aside')`
  margin: 36px -24px;
  padding: 28px 32px;
  background: ${eenewsColors.section};
  border-left: 3px solid ${eenewsColors.accentDeep};
`;

/**
 * Callout block — RichTextBlock with `blockStyle="RichTextBlockCallout"` (v2 design).
 *
 * Section bg + accent-deep left border + accent-deep eyebrow + 18px body.
 * The eyebrow text "Unterstützen Sie ee-news" mirrors the v2 reference; CMS could
 * supply this via a structured field if/when needed.
 */
export const EenewsCallout = (props: BuilderRichTextBlockProps) => {
  const {
    blocks: { RichText },
  } = useWebsiteBuilder();

  return (
    <CalloutAside>
      <Typography
        variant="metaEyebrow"
        component="div"
        sx={{
          marginBottom: 1,
          color: eenewsColors.accentDeep,
        }}
      >
        Unterstützen Sie ee-news
      </Typography>
      <Typography
        variant="bodyCallout"
        component="div"
        sx={{ margin: 0, color: eenewsColors.ink }}
      >
        <RichText {...props} />
      </Typography>
    </CalloutAside>
  );
};
