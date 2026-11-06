import { useMutation } from '@apollo/client/react';
import { CreateCrowdfundingDocument } from '@wepublish/editor/api';
import { FormPage, useCreateForm } from '@wepublish/form/editor';

import { toCrowdfundingInput } from './crowdfunding.schema';
import { crowdfundingView } from './crowdfunding.view';

export const CreateCrowdfundingForm = () => {
  const [createCrowdfunding] = useMutation(CreateCrowdfundingDocument);
  const crowdfunding = useCreateForm(crowdfundingView, {
    title: 'crowdfunding.create.title',
    save: async values => {
      const { data } = await createCrowdfunding({
        variables: { input: toCrowdfundingInput(values) },
      });

      return data?.createCrowdfunding.id;
    },
  });

  return <FormPage controller={crowdfunding} />;
};
