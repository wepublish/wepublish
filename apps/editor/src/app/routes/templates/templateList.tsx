import { TypedDocumentNode } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { Button, IconButton } from '@mui/material';
import {
  ConfirmActionModal,
  DataTable,
  enqueueSnackbar,
  IconButtonTooltip,
  InfoTooltip,
  Link,
  ListViewActions,
  ListViewContainer,
  ListViewHeader,
  PageTitle,
  Pagination,
  PermissionControl,
  TableWrapper,
} from '@wepublish/ui/editor';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdAdd, MdContentCopy, MdDelete } from 'react-icons/md';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

export type TemplateRow = { id: string; blockTemplate: { name: string } };

type TemplateListVariables = {
  take?: number | null;
  skip?: number | null;
};

export type TemplateListProps<Data> = {
  listDocument: TypedDocumentNode<Data, TemplateListVariables>;
  deleteDocument: TypedDocumentNode<unknown, { id: string }>;
  selectTemplates(
    data: Data | undefined
  ): { nodes: TemplateRow[]; totalCount: number } | undefined;
  /** e.g. `/articles/templates`; rows link to `${basePath}/edit/:id`. */
  basePath: string;
  permissions: { create: string; delete: string };
  /** Translation namespace with `list.*` and `delete.*` keys. */
  i18nPrefix: string;
};

const onErrorToast = (error: Error) => {
  if (error?.message) {
    enqueueSnackbar(error.message, { variant: 'error' });
  }
};

export function TemplateList<Data>({
  listDocument,
  deleteDocument,
  selectTemplates,
  basePath,
  permissions,
  i18nPrefix,
}: TemplateListProps<Data>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templateDelete, setTemplateDelete] = useState<TemplateRow | undefined>(
    undefined
  );
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  const [deleteTemplate] = useMutation(deleteDocument, {
    onError: onErrorToast,
    onCompleted: () =>
      enqueueSnackbar(t('toast.deletedSuccess'), { variant: 'success' }),
  });

  const { data, loading, refetch, error } = useQuery(listDocument, {
    variables: {
      take: limit,
      skip: (page - 1) * limit,
    },
    fetchPolicy: 'cache-and-network',
  });
  const templates = selectTemplates(data);

  useEffect(() => {
    if (error) {
      onErrorToast(error);
    }
  }, [error]);

  return (
    <>
      <ListViewContainer>
        <ListViewHeader>
          <PageTitle>{t(`${i18nPrefix}.list.title`)}</PageTitle>

          <InfoTooltip text={t(`${i18nPrefix}.list.info`)} />
        </ListViewHeader>

        <PermissionControl qualifyingPermissions={[permissions.create]}>
          <ListViewActions>
            <Button
              component={RouterLink}
              to={`${basePath}/create`}
              variant="contained"
              startIcon={<MdAdd />}
              disabled={loading}
            >
              {t(`${i18nPrefix}.list.newTemplate`)}
            </Button>
          </ListViewActions>
        </PermissionControl>
      </ListViewContainer>

      <TableWrapper>
        <DataTable
          storageKey={`${i18nPrefix}-templates`}
          data={templates?.nodes ?? []}
          loading={loading}
          columns={[
            {
              id: 'name',
              alwaysVisible: true,
              label: t(`${i18nPrefix}.list.name`),
              width: 240,
              render: rowData => (
                <Link to={`${basePath}/edit/${rowData.id}`}>
                  {rowData.blockTemplate.name || t(`${i18nPrefix}.list.noName`)}
                </Link>
              ),
            },
            {
              id: 'action',
              label: t(`${i18nPrefix}.list.action`),
              width: 100,
              align: 'center',
              fixed: true,
              render: template => (
                <>
                  <PermissionControl
                    qualifyingPermissions={[permissions.create]}
                  >
                    <IconButtonTooltip caption={t(`${i18nPrefix}.list.copy`)}>
                      <IconButton
                        aria-label={t(`${i18nPrefix}.list.copy`)}
                        size="small"
                        onClick={() =>
                          navigate(
                            `${basePath}/create?copyFrom=${encodeURIComponent(template.id)}`
                          )
                        }
                      >
                        <MdContentCopy />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>

                  <PermissionControl
                    qualifyingPermissions={[permissions.delete]}
                  >
                    <IconButtonTooltip caption={t('delete')}>
                      <IconButton
                        aria-label={t('delete')}
                        color="error"
                        size="small"
                        onClick={() => setTemplateDelete(template)}
                      >
                        <MdDelete />
                      </IconButton>
                    </IconButtonTooltip>
                  </PermissionControl>
                </>
              ),
            },
          ]}
        />

        <Pagination
          state={{
            page,
            limit,
            setPage,
            setLimit,
          }}
          totalCount={templates?.totalCount ?? 0}
        />
      </TableWrapper>

      {templateDelete && (
        <ConfirmActionModal
          title={t(`${i18nPrefix}.delete.title`)}
          message={t(`${i18nPrefix}.delete.body`, {
            name: templateDelete.blockTemplate.name,
          })}
          onConfirm={async () => {
            await deleteTemplate({
              variables: { id: templateDelete.id },
            });
            setTemplateDelete(undefined);
            refetch();
          }}
          onClose={() => setTemplateDelete(undefined)}
        />
      )}
    </>
  );
}
