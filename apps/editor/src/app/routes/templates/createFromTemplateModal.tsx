import { TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy, MdNoteAdd, MdSearch } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

import { EditableTemplate, isPuckTemplate } from '../editorPath';

const Content = styled.div`
  display: grid;
  gap: 12px;
`;

const Options = styled.div`
  display: grid;
  gap: 8px;
  max-height: 50vh;
  overflow-y: auto;
  padding: 4px;
`;

const Option = styled(Button)`
  justify-content: flex-start;
  text-align: left;
`;

const NoResults = styled.p`
  margin: 0;
  text-align: center;
`;

const Loading = styled.div`
  display: flex;
  justify-content: center;
`;

const SEARCH_THRESHOLD = 5;

type TemplateOption = EditableTemplate & { blockTemplate: { name: string } };

export type CreateFromTemplateModalProps<Data> = {
  open: boolean;
  onClose(): void;
  listDocument: TypedDocumentNode<Data, { take?: number | null }>;
  selectTemplates(data: Data | undefined): TemplateOption[] | undefined;
  createPath: string;
  puckCreatePath: string;
  /** Translation namespace with the `title`, `blank`, `search` and `noResults` keys. */
  i18nPrefix: string;
};

export function CreateFromTemplateModal<Data>({
  open,
  onClose,
  listDocument,
  selectTemplates,
  createPath,
  puckCreatePath,
  i18nPrefix,
}: CreateFromTemplateModalProps<Data>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [hasBeenOpened, setHasBeenOpened] = useState(open);

  if (open && !hasBeenOpened) {
    setHasBeenOpened(true);
  }

  const { data, loading } = useQuery(listDocument, {
    variables: { take: 100 },
    skip: !hasBeenOpened,
    fetchPolicy: 'cache-and-network',
  });

  const nodes = selectTemplates(data) ?? [];
  const showSearch = nodes.length > SEARCH_THRESHOLD;
  const query = search.trim().toLowerCase();
  const templates =
    query ?
      nodes.filter(({ blockTemplate }) =>
        blockTemplate.name.toLowerCase().includes(query)
      )
    : nodes;

  const create = (template?: TemplateOption) => {
    onClose();
    navigate(
      template ?
        `${isPuckTemplate(template) ? puckCreatePath : createPath}?templateId=${encodeURIComponent(template.id)}`
      : createPath
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{ transition: { onExited: () => setSearch('') } }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t(`${i18nPrefix}.title`)}</DialogTitle>

      <DialogContent>
        <Content>
          <Option
            variant="outlined"
            startIcon={<MdNoteAdd />}
            onClick={() => create()}
          >
            {t(`${i18nPrefix}.blank`)}
          </Option>

          {showSearch && (
            <TextField
              size="small"
              value={search}
              placeholder={t(`${i18nPrefix}.search`)}
              onChange={event => setSearch(event.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdSearch />
                    </InputAdornment>
                  ),
                },
              }}
              fullWidth
            />
          )}

          <Options>
            {templates.map(template => (
              <Option
                key={template.id}
                variant="outlined"
                startIcon={<MdContentCopy />}
                onClick={() => create(template)}
              >
                {template.blockTemplate.name}
              </Option>
            ))}

            {search && !templates.length && (
              <NoResults>{t(`${i18nPrefix}.noResults`)}</NoResults>
            )}

            {loading && !data && (
              <Loading>
                <CircularProgress size={24} />
              </Loading>
            )}
          </Options>
        </Content>
      </DialogContent>

      <DialogActions>
        <Button
          variant="text"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
