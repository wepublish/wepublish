import { ApolloError } from '@apollo/client';
import {
  FullNewsletterListFragment,
  useNewsletterListQuery,
  useUpdateNewsletterListMutation,
} from '@wepublish/editor/api';
import {
  CanGetNewsletterSubscribers,
  CanUpdateNewsletterList,
  CanUpdateNewsletterSubscribers,
} from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
  useAuthorisation,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Message, Nav, Panel, Schema, toaster } from 'rsuite';
import {
  NewsletterListForm,
  NewsletterListFormData,
  newsletterListAccessError,
  toNewsletterListMutationArgs,
} from './newsletter-list-form';
import { NewsletterListBackfill } from './newsletter-list-backfill';
import { NewsletterSubscriberList } from './newsletter-subscriber-list';

type NewsletterListTab = 'settings' | 'subscribers';

const onErrorToast = (error: ApolloError) => {
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

const toFormData = ({
  memberPlans,
  ...list
}: FullNewsletterListFragment): Partial<NewsletterListFormData> => ({
  ...list,
  memberPlans,
  memberPlanIds: memberPlans.map(({ id }) => id),
});

const NewsletterListEditView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const listId = id as string;
  const closePath = './../..';
  const canGetSubscribers = useAuthorisation(CanGetNewsletterSubscribers.id);
  const canUpdateSubscribers = useAuthorisation(
    CanUpdateNewsletterSubscribers.id
  );
  const [tab, setTab] = useState<NewsletterListTab>('settings');

  const [list, setList] = useState<Partial<NewsletterListFormData>>();
  const [savedRequiresSubscription, setSavedRequiresSubscription] =
    useState(false);

  const { loading: dataLoading } = useNewsletterListQuery({
    variables: { id: listId },
    onError: onErrorToast,
    onCompleted: data => {
      setList(toFormData(data.newsletterList));
      setSavedRequiresSubscription(data.newsletterList.requiresSubscription);
    },
  });

  const [updateNewsletterList, { loading: updateLoading }] =
    useUpdateNewsletterListMutation({
      onError: onErrorToast,
      onCompleted: data => {
        if (shouldClose) {
          navigate(closePath);
        } else {
          setList(toFormData(data.updateNewsletterList));
          setSavedRequiresSubscription(
            data.updateNewsletterList.requiresSubscription
          );
        }
      },
    });

  const loading = dataLoading || updateLoading;

  const onSubmit = () => {
    if (!list || newsletterListAccessError(list)) {
      return;
    }

    updateNewsletterList({
      variables: { id: listId, ...toNewsletterListMutationArgs(list) },
    });
  };

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('newsletter.form.nameRequired')),
    slug: StringType().isRequired(t('newsletter.form.slugRequired')),
  });

  if (!list) {
    return null;
  }

  return (
    <>
      <Form
        fluid
        formValue={list}
        model={validationModel}
        disabled={loading}
        onSubmit={validationPassed => validationPassed && onSubmit()}
      >
        <SingleViewTitle
          loading={loading}
          title={t('newsletter.form.editTitle', { list: list.name })}
          loadingTitle={t('loading')}
          saveBtnTitle={t('save')}
          saveAndCloseBtnTitle={t('saveAndClose')}
          closePath={closePath}
          setCloseFn={setShouldClose}
        />

        {canGetSubscribers && (
          <Nav
            appearance="tabs"
            activeKey={tab}
            onSelect={key => key && setTab(key as NewsletterListTab)}
          >
            <Nav.Item eventKey="settings">
              {t('newsletter.tabs.settings')}
            </Nav.Item>
            <Nav.Item eventKey="subscribers">
              {t('newsletter.tabs.subscribers')}
            </Nav.Item>
          </Nav>
        )}

        {tab === 'settings' && (
          <>
            <NewsletterListForm
              list={list}
              onChange={changes =>
                setList(oldList => ({ ...oldList, ...changes }))
              }
            />

            {savedRequiresSubscription && canUpdateSubscribers && (
              <Panel
                bordered
                header={t('newsletter.backfill.title')}
              >
                <NewsletterListBackfill listId={listId} />
              </Panel>
            )}
          </>
        )}
      </Form>

      {tab === 'subscribers' && (
        <NewsletterSubscriberList
          listId={listId}
          requiresSubscription={savedRequiresSubscription}
        />
      )}
    </>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanUpdateNewsletterList.id,
])(NewsletterListEditView);

export { CheckedPermissionComponent as NewsletterListEditView };
