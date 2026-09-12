import {
  BuilderListItemProps,
  BuilderOrderedListProps,
  BuilderUnorderedListProps,
} from './lists.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const OrderedList = (props: BuilderOrderedListProps) => {
  const {
    elements: { OrderedList },
  } = useWebsiteBuilder();

  return <OrderedList {...props} />;
};

export const UnorderedList = (props: BuilderUnorderedListProps) => {
  const {
    elements: { UnorderedList },
  } = useWebsiteBuilder();

  return <UnorderedList {...props} />;
};

export const ListItem = (props: BuilderListItemProps) => {
  const {
    elements: { ListItem },
  } = useWebsiteBuilder();

  return <ListItem {...props} />;
};
