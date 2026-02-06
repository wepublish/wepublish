import styled from '@emotion/styled';
import {
  MutationCreateTagArgs,
  MutationUpdateTagArgs,
} from '@wepublish/editor/api-v2';
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
  grid-template-columns: 1fr 1fr;
  align-items: start;
  gap: 12px;
`;

export const TagForm = ({ tag, onChange }: TagFormProps) => {
  const { t } = useTranslation();

  return (
    <TagFormWrapper>
      <Panel bordered>
        <Form.Group controlId="name">
          <Form.ControlLabel>{t('tags.overview.name')}</Form.ControlLabel>
          <Form.Control
            name="name"
            value={tag.tag ?? ''}
            onChange={(tag: string) => onChange({ tag })}
          />
        </Form.Group>
        <Form.Group controlId="color">
          <Form.ControlLabel>{t('tags.overview.color')}</Form.ControlLabel>
          <ColorPicker
            setColor={color => {
              onChange({ color: color });
            }}
            currentColor={tag.color || '#000000'}
          />
        </Form.Group>

        <Form.Group controlId="description">
          <Form.ControlLabel>
            {t('tags.overview.description')}
          </Form.ControlLabel>
          <Panel bordered>
            <Form.Control
              name="description"
              value={tag.description || []}
              onChange={(description: RichTextBlockValue['richText']) =>
                onChange({ description })
              }
              accepter={RichTextBlock}
            />
          </Panel>
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
      </Panel>
    </TagFormWrapper>
  );
};
