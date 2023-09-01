import {useUser} from '@wepublish/authentication/website'
import {
  UpdatePasswordMutationVariables,
  UpdateUserMutationVariables,
  useUpdatePasswordMutation,
  useUpdateUserMutation,
  useUploadImageMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {ChangeEvent} from 'react'

export type PersonalDataFormContainerProps = {
  mediaEmail?: string
} & BuilderContainerProps

export function PersonalDataFormContainer({className, mediaEmail}: PersonalDataFormContainerProps) {
  const {PersonalDataForm} = useWebsiteBuilder()
  const {user} = useUser()

  const [uploadImage] = useUploadImageMutation()
  const [updatePassword] = useUpdatePasswordMutation()
  const [updateUser] = useUpdateUserMutation()

  const handleOnImageUpload = async (input: ChangeEvent<HTMLInputElement> | null) => {
    await uploadImage({
      variables: {
        uploadImageInput: input ? {file: input.target?.files![0] as File} : null
      }
    })
  }

  const handleOnUpdate = async (
    variables: UpdateUserMutationVariables['input'] & Partial<UpdatePasswordMutationVariables>
  ) => {
    const {password, passwordRepeated, ...userInput} = variables
    const updates = [
      updateUser({
        variables: {
          input: userInput
        }
      })
    ] as Promise<unknown>[]

    console.log(password, passwordRepeated, userInput)

    if (password && passwordRepeated) {
      updates.push(
        updatePassword({
          variables: {
            password,
            passwordRepeated
          }
        })
      )
    }

    await Promise.all(updates)
  }

  if (!user) {
    return
  }

  return (
    <PersonalDataForm
      className={className}
      initialUser={user}
      onImageUpload={handleOnImageUpload}
      onUpdate={handleOnUpdate}
      mediaEmail={mediaEmail}
    />
  )
}
