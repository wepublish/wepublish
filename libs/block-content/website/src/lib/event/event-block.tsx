import styled from '@emotion/styled';
import { truncateFirstParagraph } from '@wepublish/richtext';
import {
  BlockContent,
  EventBlock as EventBlockType,
} from '@wepublish/website/api';
import {
  BuilderEventBlockProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export const isEventBlock = (
  block: Pick<BlockContent, '__typename'>
): block is EventBlockType => block.__typename === 'EventBlock';

export const EventBlockWrapper = styled('aside')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(4)};
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  justify-items: center;
`;

const truncate = truncateFirstParagraph(255);

export const EventBlock = ({ events, className }: BuilderEventBlockProps) => {
  const { EventListItem } = useWebsiteBuilder();

  return (
    <EventBlockWrapper className={className}>
      {events.map(event => (
        <EventListItem
          key={event.id}
          {...event}
          description={truncate(event.description)}
        />
      ))}
    </EventBlockWrapper>
  );
};
