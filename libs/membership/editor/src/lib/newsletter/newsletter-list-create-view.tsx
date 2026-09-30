import { ApolloError } from '@apollo/client';
import {
  NewsletterListLockedDisplay,
  useCreateNewsletterListMutation,
} from '@wepublish/editor/api';
import { CanCreateNewsletterList } from '@wepublish/permissions';
import {
  createCheckedPermissionComponent,
  SingleViewTitle,
} from '@wepublish/ui/editor';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Form, Message, Schema, toaster } from 'rsuite';
import {
  NewsletterListForm,
  NewsletterListFormData,
  newsletterListAccessError,
  toNewsletterListMutationArgs,
} from './newsletter-list-form';

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

const NewsletterListCreateView = () => {
  const { t } = useTranslation();
  const [shouldClose, setShouldClose] = useState(false);
  const navigate = useNavigate();
  const closePath = './..';

  const [list, setList] = useState<Partial<NewsletterListFormData>>({
    name: '',
    slug: '',
    active: true,
    requiresSubscription: false,
    anyMemberPlan: false,
    autoSubscribe: true,
    lockedDisplay: NewsletterListLockedDisplay.Teaser,
    memberPlanIds: [],
  });

  const [createNewsletterList, { loading }] = useCreateNewsletterListMutation({
    onError: onErrorToast,
    onCompleted: data => {
      if (shouldClose) {
        navigate(closePath);
      } else {
        navigate(`./../edit/${data.createNewsletterList.id}`);
      }
    },
  });

  const onSubmit = () => {
    if (newsletterListAccessError(list)) {
      return;
    }

    createNewsletterList({ variables: toNewsletterListMutationArgs(list) });
  };

  const { StringType } = Schema.Types;
  const validationModel = Schema.Model({
    name: StringType().isRequired(t('newsletter.form.nameRequired')),
    slug: StringType().isRequired(t('newsletter.form.slugRequired')),
  });

  return (
    <Form
      fluid
      formValue={list}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}
    >
      <SingleViewTitle
        loading={loading}
        title={t('newsletter.form.createTitle')}
        loadingTitle={t('loading')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <NewsletterListForm
        list={list}
        onChange={changes => setList(oldList => ({ ...oldList, ...changes }))}
      />
    </Form>
  );
};

const CheckedPermissionComponent = createCheckedPermissionComponent([
  CanCreateNewsletterList.id,
])(NewsletterListCreateView);

export { CheckedPermissionComponent as NewsletterListCreateView };
