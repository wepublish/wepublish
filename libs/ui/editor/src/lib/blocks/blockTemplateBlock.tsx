import { useQuery } from '@apollo/client/react';
import styled from '@emotion/styled';
import {
  Button,
  Card as MuiCard,
  CardContent,
  IconButton,
  Stack,
} from '@mui/material';
import {
  BlockTemplateDocument,
  BlockTemplateListDocument,
  FullBlockFragment,
} from '@wepublish/editor/api';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdEdit, MdOutput, MdRefresh } from 'react-icons/md';
import { SelectPicker } from 'rsuite';

import { BlockMapType, BlockProps } from '../atoms/blockList';
import { IconButtonTooltip } from '../atoms/iconButtonTooltip';
import { ConfirmActionModal } from '../atoms/notification/confirmActionModal';
import { BlockMap } from './blockMap';
import { blockForQueryBlock, BlockTemplateBlockValue } from './types';

const Wrapper = styled.div`
  display: grid;
  gap: 12px;
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 12px;
`;

const Preview = styled.div`
  display: grid;
  gap: 12px;
  pointer-events: none;
  user-select: none;
`;

const PreviewItem = styled(MuiCard)`
  padding: 0;
  background-color: var(--rs-bg-well);
`;

const PreviewLabel = styled.div`
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rs-border-primary);
  color: var(--rs-text-secondary);
`;

const PreviewBlock = styled.div`
  padding: 12px;
`;

export const BlockTemplateBlock = ({
  value: { template },
  onChange,
  onReplace,
  disabled,
}: BlockProps<BlockTemplateBlockValue>) => {
  const { t } = useTranslation();
  const blockMap = BlockMap as BlockMapType;
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const { data, loading, refetch } = useQuery(BlockTemplateListDocument, {
    variables: { take: 100 },
    fetchPolicy: 'cache-and-network',
  });

  const templates = useMemo(
    () => data?.blockTemplates.nodes ?? [],
    [data?.blockTemplates.nodes]
  );

  const { data: templateData } = useQuery(BlockTemplateDocument, {
    variables: { id: template?.id ?? '' },
    skip: !template?.id,
    fetchPolicy: 'cache-and-network',
  });

  const fullTemplate =
    templates.find(({ id }) => id === template?.id) ??
    templateData?.blockTemplate;
  const selectedTemplate = fullTemplate ?? template;

  const blocks = useMemo(
    () =>
      (fullTemplate?.blocks ?? []).map(block =>
        blockForQueryBlock(block as FullBlockFragment)
      ),
    [fullTemplate]
  );

  return (
    <Wrapper>
      <Toolbar>
        <SelectPicker
          block
          cleanable
          virtualized
          disabled={disabled}
          loading={loading}
          data={templates.map(({ id, name }) => ({ value: id, label: name }))}
          value={selectedTemplate?.id ?? null}
          placeholder={t('blocks.blockTemplate.select')}
          onChange={id =>
            onChange({
              template: templates.find(template => template.id === id) ?? null,
            })
          }
        />

        <Stack
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap' }}
        >
          <IconButtonTooltip caption={t('blocks.blockTemplate.reload')}>
            <IconButton
              aria-label={t('blocks.blockTemplate.reload')}
              onClick={event => {
                refetch();
                event.preventDefault();
              }}
            >
              <MdRefresh />
            </IconButton>
          </IconButtonTooltip>
          <Button
            variant="outlined"
            startIcon={<MdEdit />}
            disabled={!selectedTemplate}
            href={
              selectedTemplate ?
                `/block-content/templates/edit/${selectedTemplate.id}`
              : ''
            }
            target="_blank"
          >
            {t('blocks.blockTemplate.editTemplate')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<MdOutput />}
            disabled={disabled || !onReplace || !blocks.length}
            onClick={() => setConfirmOpen(true)}
          >
            {t('blocks.blockTemplate.useContent')}
          </Button>
        </Stack>
      </Toolbar>

      {!!selectedTemplate && (
        <Preview>
          {blocks
            // hidden blocks of the template are not rendered on the website
            .filter(block => !block.value.disabled)
            .map(block => {
              const { field, label, icon } = blockMap[block.type];

              return (
                <PreviewItem key={block.key}>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <PreviewLabel>
                      {icon}
                      <span>{t(label)}</span>
                    </PreviewLabel>

                    <PreviewBlock>
                      {field({
                        value: block.value,
                        onChange: () => undefined,
                        disabled: true,
                      })}
                    </PreviewBlock>
                  </CardContent>
                </PreviewItem>
              );
            })}
        </Preview>
      )}

      {isConfirmOpen && (
        <ConfirmActionModal
          title={t('blocks.blockTemplate.useContentConfirmTitle')}
          message={t('blocks.blockTemplate.useContentConfirmMessage')}
          onConfirm={() => {
            setConfirmOpen(false);
            onReplace?.(blocks);
          }}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </Wrapper>
  );
};
