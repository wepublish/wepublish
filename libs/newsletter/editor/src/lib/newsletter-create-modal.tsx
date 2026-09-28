import {
  NewsletterSummaryFragment,
  useCreateNewsletterMutation,
} from '@wepublish/editor/api';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Message, Modal, Toggle, toaster } from 'rsuite';

type NewsletterCreateModalProps = {
  open: boolean;
  /** The most recently modified newsletter, offered as the starting point. */
  latest?: NewsletterSummaryFragment;
  onClose(): void;
};

/**
 * A new issue starts from the previous one's structure by default: masthead,
 * intro, rubric order are the same every week, so an editor edits rather
 * than assembles.
 */
export function NewsletterCreateModal({
  open,
  latest,
  onClose,
}: NewsletterCreateModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [copyLatest, setCopyLatest] = useState(true);

  const [createNewsletter, { loading }] = useCreateNewsletterMutation({
    onError: error => {
      toaster.push(
        <Message
          type="error"
          showIcon
          closable
          duration={4000}
        >
          {error.message}
        </Message>
      );
    },
    onCompleted: data => {
      onClose();
      navigate(`/newsletters/edit/${data.createNewsletter.id}`);
    },
  });

  const submit = () => {
    if (!title.trim()) {
      return;
    }

    void createNewsletter({
      variables: {
        input: {
          title: title.trim(),
          fromNewsletterId: copyLatest && latest ? latest.id : undefined,
        },
      },
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Modal.Header>
        <Modal.Title>{t('newsletter.create.title')}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form
          fluid
          onSubmit={submit}
        >
          <Form.Group controlId="newsletter-title">
            <Form.ControlLabel>{t('newsletter.create.name')}</Form.ControlLabel>
            <Form.Control
              name="title"
              value={title}
              placeholder={t('newsletter.create.namePlaceholder')}
              autoFocus
              onChange={(value: string) => setTitle(value)}
            />
          </Form.Group>
          {latest ?
            <Form.Group controlId="newsletter-copy">
              <Form.ControlLabel>
                {t('newsletter.create.copyLatest', { title: latest.title })}
              </Form.ControlLabel>
              <Toggle
                checked={copyLatest}
                onChange={setCopyLatest}
              />
            </Form.Group>
          : null}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          appearance="primary"
          loading={loading}
          disabled={!title.trim()}
          onClick={submit}
        >
          {t('newsletter.create.create')}
        </Button>
        <Button
          appearance="subtle"
          onClick={onClose}
        >
          {t('cancel')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
