import { ApolloError } from '@apollo/client';
import {
  getApiClientV2,
  PageSort,
  SortOrder,
  usePageListQuery,
} from '@wepublish/editor/api-v2';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Message, SelectPicker, toaster } from 'rsuite';

interface SelectPageProps {
  className?: string;
  disabled?: boolean;
  name?: string;
  selectedPage?: string | null;
  setSelectedPage(page: string | null): void;
}

export function SelectPage({
  className,
  disabled,
  name,
  selectedPage,
  setSelectedPage,
}: SelectPageProps) {
  const { t } = useTranslation();

  /**
   * Error handling
   * @param error
   */
  const showErrors = (error: ApolloError): void => {
    toaster.push(
      <Message
        type="error"
        showIcon
        closable
        duration={3000}
      >
        {error.message}
      </Message>
    );
  };

  /**
   * Loading page
   */
  const client = getApiClientV2();
  const { data: pageData, refetch } = usePageListQuery({
    client,
    variables: {
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 200,
    },
    fetchPolicy: 'no-cache',
    onError: showErrors,
  });

  /**
   * Prepare available page
   */
  const availablePages = useMemo(() => {
    if (!pageData?.pages?.nodes) {
      return [];
    }

    return pageData.pages.nodes.map(page => ({
      label: page.latest.title || <i>{t('pages.overview.untitled')}</i>,
      value: page.id,
    }));
  }, [pageData]);

  return (
    <SelectPicker
      block
      disabled={disabled}
      className={className}
      name={name}
      value={selectedPage}
      data={availablePages}
      onSearch={word => {
        refetch({
          filter: {
            title: word,
          },
        });
      }}
      onChange={(value, item) => setSelectedPage(value)}
    />
  );
}
