import {
  useMyNewsletterListsQuery,
  useSubscribeToNewsletterListMutation,
  useUnsubscribeFromNewsletterListMutation,
} from '@wepublish/website/api';
import {
  BuilderContainerProps,
  BuilderNewsletterListProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';

export type NewsletterListContainerProps = BuilderContainerProps &
  Partial<Pick<BuilderNewsletterListProps, 'subscribeUrl'>>;

export function NewsletterListContainer({
  className,
  subscribeUrl = '/mitmachen',
}: NewsletterListContainerProps) {
  const { NewsletterList } = useWebsiteBuilder();
  const { data, loading, error } = useMyNewsletterListsQuery();
  const [subscribe] = useSubscribeToNewsletterListMutation();
  const [unsubscribe] = useUnsubscribeFromNewsletterListMutation();

  return (
    <NewsletterList
      data={data}
      loading={loading}
      error={error}
      className={className}
      subscribeUrl={subscribeUrl}
      onSubscribe={async listId => {
        await subscribe({ variables: { listId } });
      }}
      onUnsubscribe={async listId => {
        await unsubscribe({ variables: { listId } });
      }}
    />
  );
}
