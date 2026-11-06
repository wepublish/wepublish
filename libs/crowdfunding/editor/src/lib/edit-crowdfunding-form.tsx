import { useMutation } from '@apollo/client/react';
import {
  CrowdfundingDocument,
  UpdateCrowdfundingDocument,
} from '@wepublish/editor/api';
import { FormPage, useEditForm, useQueryLoader } from '@wepublish/form/editor';
import { useParams } from 'react-router-dom';

import {
  editTitleParams,
  fromCrowdfunding,
  toCrowdfundingInput,
} from './crowdfunding.schema';
import { crowdfundingView } from './crowdfunding.view';

type EditCrowdfundingViewProps = {
  crowdfundingId: string;
};

export const EditCrowdfundingView = ({
  crowdfundingId,
}: EditCrowdfundingViewProps) => {
  const load = useQueryLoader(
    CrowdfundingDocument,
    { id: crowdfundingId },
    data => fromCrowdfunding(data.crowdfunding)
  );
  const [updateCrowdfunding] = useMutation(UpdateCrowdfundingDocument);
  const crowdfunding = useEditForm(crowdfundingView, {
    title: 'crowdfunding.edit.title',
    titleParams: editTitleParams,
    load,
    save: values =>
      updateCrowdfunding({
        variables: {
          input: { ...toCrowdfundingInput(values), id: crowdfundingId },
        },
      }),
  });

  return <FormPage controller={crowdfunding} />;
};

export const EditCrowdfundingForm = () => {
  const { id = '' } = useParams();

  return (
    <EditCrowdfundingView
      key={id}
      crowdfundingId={id}
    />
  );
};
