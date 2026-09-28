import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import { BuilderBreakBlockProps } from '@wepublish/website/builder';

const Callout = styled('aside')`
  margin: 32px 0;
  padding: 20px 24px;
  border: 1.5px solid ${({ theme }) => theme.palette.primary.main};
  color: ${({ theme }) => theme.palette.primary.main};
`;

export const EenewsArticleSupportCallout = ({
  text,
  className,
}: BuilderBreakBlockProps) => {
  return (
    <Callout className={className}>
      <Typography
        variant="articleSupport"
        component="p"
      >
        {text ??
          'Wir freuen uns, wenn Ihnen dieser Beitrag einen Mehrwert brachte. Unterstützen Sie uns — auch per Twint.'}
      </Typography>
    </Callout>
  );
};
