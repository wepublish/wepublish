import {
  CreateCrowdfundingGoalInput,
  UpdateCrowdfundingInput,
  getApiClientV2,
  useCrowdfundingQuery,
  useUpdateCrowdfundingMutation
} from '@wepublish/editor/api-v2'
import {useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {useNavigate, useParams} from 'react-router-dom'
import {CrowdfundingForm} from './crowdfunding-form'
import {SingleViewTitle} from '@wepublish/ui/editor'
import {Form, Schema} from 'rsuite'

export const EditCrowdfundingForm = () => {
  const {id} = useParams()
  const crowdfundingId = id!
  const navigate = useNavigate()
  const {t} = useTranslation()

  const closePath = '/crowdfundings'

  const [crowdfunding, setCrowdfunding] = useState<UpdateCrowdfundingInput>({
    id: crowdfundingId,
    name: ''
  })

  const client = useMemo(() => getApiClientV2(), [])
  useCrowdfundingQuery({
    client,
    variables: {
      id: id!
    },
    skip: !id,
    onCompleted: data => {
      const {__typename, activeCrowdfundingGoal, ...inputWithoutTypename} = data.crowdfunding
      setCrowdfunding(inputWithoutTypename)
    }
  })

  const {StringType} = Schema.Types
  const validationModel = Schema.Model({
    name: StringType().isRequired()
  })

  const [shouldClose, setShouldClose] = useState(false)

  const [updateCrowdfunding, {loading}] = useUpdateCrowdfundingMutation({
    client,
    onError: (error: any) => {
      console.log(error)
    },
    onCompleted: () => {
      if (shouldClose) {
        navigate(closePath)
      }
    }
  })

  const onSubmit = () => {
    const processedCrowdfunding = {
      ...crowdfunding,
      goals: crowdfunding.goals?.map(removeIdAndTypename),
      memberPlans: crowdfunding.memberPlans?.map(removeTypename)
    }
    updateCrowdfunding({variables: {input: processedCrowdfunding}})
  }

  const removeIdAndTypename = (goal: CreateCrowdfundingGoalInput) => {
    const {id, __typename, ...goalCleaned} = goal as any
    return goalCleaned
  }

  const removeTypename = (page: any) => {
    const {__typename, ...pageCleaned} = page
    return pageCleaned
  }

  const handleAddGoal = (goal: CreateCrowdfundingGoalInput) => {
    const {...goalWithoutTypename} = goal
    setCrowdfunding({
      ...crowdfunding,
      goals: [...(crowdfunding.goals || []), goal]
    })
  }

  const handleRemoveGoal = (index: number) => {
    setCrowdfunding({
      ...crowdfunding,
      goals: crowdfunding.goals?.filter((_, i) => i !== index) || []
    })
  }

  return (
    <Form
      fluid
      formValue={crowdfunding}
      model={validationModel}
      disabled={loading}
      onSubmit={validationPassed => validationPassed && onSubmit()}>
      <SingleViewTitle
        loading={loading}
        title={t('crowdfunding.edit.title')}
        loadingTitle={t('crowdfunding.edit.title')}
        saveBtnTitle={t('save')}
        saveAndCloseBtnTitle={t('saveAndClose')}
        closePath={closePath}
        setCloseFn={setShouldClose}
      />

      <CrowdfundingForm
        crowdfunding={crowdfunding}
        onChange={changes => setCrowdfunding({...changes, id: crowdfunding.id})}
        onAddGoal={handleAddGoal}
        onRemoveGoal={handleRemoveGoal}
      />
    </Form>
  )
}
