import {GraphQLNonNull, GraphQLObjectType} from 'graphql'
import {Context} from '../context'
import {GraphQLUploadImageInput} from './image'
import {GraphQLPublicUser, GraphQLPublicUserInput} from './user'
import {updatePublicUser, uploadPublicUserProfileImage} from './user/user.public-mutation'

export const GraphQLPublicMutation = new GraphQLObjectType<undefined, Context>({
  name: 'Mutation',
  fields: {
    updateUser: {
      type: GraphQLPublicUser,
      args: {
        input: {type: new GraphQLNonNull(GraphQLPublicUserInput)}
      },
      description:
        "This mutation allows to update the user's data by taking an input of type UserInput.",
      resolve: (root, {input}, {authenticateUser, mediaAdapter, prisma: {user, image}}) =>
        updatePublicUser(input, authenticateUser, mediaAdapter, user, image)
    },

    uploadUserProfileImage: {
      type: GraphQLPublicUser,
      args: {
        uploadImageInput: {type: GraphQLUploadImageInput}
      },
      description: "This mutation allows to upload and update the user's profile image.",
      resolve: (
        root,
        {uploadImageInput},
        {authenticateUser, mediaAdapter, prisma: {image, user}}
      ) =>
        uploadPublicUserProfileImage(uploadImageInput, authenticateUser, mediaAdapter, image, user)
    }
  }
})
