import { useQuery } from '@apollo/client/react';
import { Autocomplete, TextField } from '@mui/material';
import { PageListDocument, PageSort, SortOrder } from '@wepublish/editor/api';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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

  const { data: pageData, refetch } = useQuery(PageListDocument, {
    variables: {
      sort: PageSort.PublishedAt,
      order: SortOrder.Ascending,
      take: 200,
    },
    fetchPolicy: 'no-cache',
  });

  /**
   * Prepare available page
   */
  const availablePages = useMemo(() => {
    if (!pageData?.pages?.nodes) {
      return [];
    }

    return pageData.pages.nodes.map(page => ({
      label: page.latest.title || t('pages.overview.untitled'),
      value: page.id,
    }));
  }, [pageData]);

  return (
    <Autocomplete
      disabled={disabled}
      className={className}
      options={availablePages.map(page => page.value)}
      getOptionLabel={id =>
        availablePages.find(page => page.value === id)?.label ?? id
      }
      filterOptions={options => options}
      onInputChange={(_event, title) => refetch({ filter: { title } })}
      value={selectedPage ?? null}
      onChange={(_event, value) => setSelectedPage(value)}
      renderInput={params => (
        <TextField
          {...params}
          name={name}
        />
      )}
      fullWidth
    />
  );
}
