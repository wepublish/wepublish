import {ComponentProps, useReducer, useState} from 'react'
import {StandardForm} from './standard'
import {StepLabel, Stepper, Step, Box, Typography} from '@mui/material'
import {Button} from '../button/button'
import {z} from 'zod'

export const MultistepForm = <
  Step extends {
    title: string
    optional?: boolean
  } & Omit<ComponentProps<typeof StandardForm>, 'renderAfter' | 'onSubmit'>,
  Steps extends readonly Step[],
  StepData extends z.infer<Step['schema']>,
  Data extends Array<StepData | undefined>
>({
  steps,
  onSubmit
}: {
  steps: Steps
  onSubmit: (data: Data) => void
}) => {
  const [stepData, setStepData] = useReducer(
    (state: Data, action: {step: number; data: StepData}) => {
      const newState = [...state] as Data
      newState[action.step] = action.data

      return newState
    },
    new Array(steps.length).fill(undefined) as Data
  )
  const [activeStep, setActiveStep] = useState(0)

  return (
    <>
      <Stepper activeStep={activeStep}>
        {steps.map((step, index) => (
          <Step key={step.title} completed={!!stepData[index]}>
            <StepLabel
              optional={step.optional && <Typography variant="caption">Optional</Typography>}>
              {step.title}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{p: 2}}>
        <StandardForm
          {...steps[activeStep]}
          // Without setting the key React would re-use the component.
          // Unfortunately this does not work and each Form should have a stable schema
          key={steps[activeStep].title}
          defaultValues={{
            ...steps[activeStep].defaultValues,
            ...stepData[activeStep]
          }}
          onSubmit={data => {
            setStepData({step: activeStep, data})

            if (steps.length > activeStep + 1) {
              setActiveStep(activeStep + 1)
            } else {
              onSubmit([...stepData.slice(0, -1), data] as Data)
            }
          }}
          renderAfter={() => (
            <Box sx={{display: 'flex', width: '100%', flexDirection: 'row', mt: 2, gap: 1}}>
              {!!activeStep && (
                <Button color="secondary" onClick={() => setActiveStep(activeStep - 1)}>
                  Back
                </Button>
              )}

              <Box sx={{flex: '1 1 auto'}} />

              {steps[activeStep].optional && (
                <Button color="secondary" onClick={() => setActiveStep(activeStep + 1)}>
                  Skip
                </Button>
              )}

              <Button type="submit">{activeStep === steps.length - 1 ? 'Finish' : 'Next'}</Button>
            </Box>
          )}
        />
      </Box>
    </>
  )
}
