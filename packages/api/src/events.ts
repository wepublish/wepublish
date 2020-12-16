import {EventEmitter} from 'events'
import {Context} from './context'
import {User} from './db/user'

const eventEmitter = new EventEmitter()

eventEmitter.on('PostCreateUser', async (context: Context, user: User) => {
  setImmediate(async () => {
    console.log('start of PostCrateUser Event')
    await context.dbAdapter.userRole.createUserRole({
      input: {
        name: `${user.name}-Role`,
        description: `UserRole for ${user.name}`,
        permissionIDs: []
      }
    })
    console.log('end of PostCreateUser Event')
  })
})

export default eventEmitter
