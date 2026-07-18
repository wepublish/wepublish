import styled from '@emotion/styled';
import {
  MutationCreateTagArgs,
  MutationUpdateTagArgs,
} from '@wepublish/editor/api';
import {
  ColorPicker,
  RichTextBlock,
  RichTextBlockValue,
} from '@wepublish/ui/editor';
import { useTranslation } from 'react-i18next';
import { Checkbox, Form, Panel } from 'rsuite';

type TagFormData = MutationCreateTagArgs | MutationUpdateTagArgs;

type TagFormProps = {
  create?: boolean;
  tag: TagFormData;
  onChange: (changes: Partial<TagFormData>) => void;
};

const TagFormWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: start;
  gap: 12px;
`;

export const TagForm = ({ tag, onChange }: TagFormProps) => {
  const { t } = useTranslation();

  return (
    <TagFormWrapper>
      <Panel bordered>
        <Form.Stack fluid>
          <Form.Group controlId="name">
            <Form.Label>{t('tags.overview.name')}</Form.Label>
            <Form.Control
              name="name"
              value={tag.tag ?? ''}
              onChange={(tag: string) => onChange({ tag })}
            />
          </Form.Group>

          <Form.Group controlId="color">
            <Form.Label>{t('tags.overview.color')}</Form.Label>
            <ColorPicker
              setColor={color => {
                onChange({ color });
              }}
              currentColor={tag.color || '#000000'}
            />
          </Form.Group>

          <Form.Group controlId="description">
            <Form.Label>{t('tags.overview.description')}</Form.Label>

            <Form.Control
              name="description"
              value={tag.description}
              onChange={(description: RichTextBlockValue['richText']) =>
                onChange({ description })
              }
              accepter={RichTextBlock}
            />
          </Form.Group>

          <Form.Group controlId="main">
            <Form.Control
              name="main"
              checked={!!tag.main}
              onChange={() => onChange({ main: !tag.main })}
              accepter={Checkbox}
            >
              {t('tags.overview.markAsMain')}
            </Form.Control>
          </Form.Group>
        </Form.Stack>
      </Panel>
    </TagFormWrapper>
  );
};
