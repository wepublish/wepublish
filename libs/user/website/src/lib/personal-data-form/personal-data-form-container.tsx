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
  const [updateUser, updateUserData] = useUpdateUserMutation()

  const handleOnImageUpload = async (input: ChangeEvent<HTMLInputElement> | null) => {
    uploadImage({
      variables: {
        uploadImageInput: {file: input?.target?.files![0] as File} || null
      }
    })
  }

  const handleOnUpdate = async (
    variables: UpdateUserMutationVariables['input'] & Partial<UpdatePasswordMutationVariables>
  ) => {
    const {password, passwordRepeated, ...userInput} = variables

    await Promise.all([
      password && passwordRepeated
        ? updatePassword({
            variables: {
              password,
              passwordRepeated
            }
          })
        : Promise.resolve(),
      updateUser({
        variables: {
          input: userInput
        }
      })
    ])
  }

  if (!user) {
    return
  }

  return (
    <PersonalDataForm
      className={className}
      initialUser={user}
      update={updateUserData}
      onImageUpload={handleOnImageUpload}
      onUpdate={handleOnUpdate}
      mediaEmail={mediaEmail}
    />
  )
}
