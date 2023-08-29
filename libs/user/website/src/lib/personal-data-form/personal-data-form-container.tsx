import {MutationResult} from '@apollo/client'
import {useUser} from '@wepublish/authentication/website'
import {
  FullImageFragment,
  UpdatePasswordMutation,
  UpdatePasswordMutationVariables,
  UpdateUserMutation,
  UpdateUserMutationVariables,
  UploadImageInput,
  UploadImageMutation,
  useUpdatePasswordMutation,
  useUpdateUserMutation,
  useUploadImageMutation
} from '@wepublish/website/api'
import {BuilderContainerProps, useWebsiteBuilder} from '@wepublish/website/builder'
import {useEffect} from 'react'

export type PersonalDataFormContainerProps = {
  onUpdate?: (
    mutationResult: Pick<MutationResult<UpdateUserMutation>, 'data' | 'loading' | 'error'> &
      Pick<MutationResult<UpdatePasswordMutation>, 'data' | 'loading' | 'error'> &
      Pick<MutationResult<UploadImageMutation>, 'data' | 'loading' | 'error'>
  ) => void
} & BuilderContainerProps

export function PersonalDataFormContainer({onUpdate, className}: PersonalDataFormContainerProps) {
  const {PersonalDataForm} = useWebsiteBuilder()
  const {user} = useUser()

  const [uploadImage, uploadImageData] = useUploadImageMutation({
    onCompleted(data) {
      console.log('data', data)
    }
  })

  const [updatePassword, updatePasswordData] = useUpdatePasswordMutation({
    onCompleted(data) {
      console.log('data', data)
    }
  })

  const [updateUser, updateUserData] = useUpdateUserMutation({
    onCompleted(data) {
      console.log('data', data)
    }
  })

  useEffect(() => {
    if (updateUserData.called || updatePasswordData.called || uploadImageData.called) {
      onUpdate?.(updateUserData)
      onUpdate?.(updatePasswordData)
      onUpdate?.(uploadImageData)
    }
  }, [updateUserData, updatePasswordData, uploadImageData, onUpdate])

  const handleOnImageUpload = (input: UploadImageInput) => {
    uploadImage({
      variables: {
        uploadImageInput: input
      }
    })
  }

  const handleOnUpdate = (
    variables: UpdateUserMutationVariables['input'] & Partial<UpdatePasswordMutationVariables>
  ) => {
    const {password, passwordRepeated, ...userInput} = variables

    try {
      if (password && passwordRepeated) {
        updatePassword({
          variables: {
            password,
            passwordRepeated
          }
        })
      }

      updateUser({
        variables: {
          input: userInput
        }
      })
    } catch (err) {
      console.log('err', err)
    }
  }

  if (!user) {
    return
  }

  return (
    <PersonalDataForm
      className={className}
      initialUser={user as UpdateUserMutationVariables['input'] & {image?: FullImageFragment}}
      update={updateUserData}
      onImageUpload={handleOnImageUpload}
      onUpdate={handleOnUpdate}
    />
  )
}
