import { useQuery } from '@apollo/client/react';
import { PageListDocument, PageSort, SortOrder } from '@wepublish/editor/api';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SelectPicker } from 'rsuite';

import { humanizeError } from '../../humanizeError';
import { enqueueSnackbar } from '../../snackbar';

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
  const showErrors = (error: Error): void => {
    enqueueSnackbar(humanizeError(error), {
      variant: 'error',
      autoHideDuration: 8000,
    });
  };

  /**
   * Loading page
   */

  const {
    data: pageData,
    error: pageListError,
    refetch,
  } = useQuery(PageListDocument, {
    variables: {
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 200,
    },
    fetchPolicy: 'no-cache',
  });

  useEffect(() => {
    if (pageListError) {
      showErrors(pageListError);
    }
  }, [pageListError]);

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
