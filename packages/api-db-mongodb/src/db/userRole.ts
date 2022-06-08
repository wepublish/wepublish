import {
  CreateUserRoleArgs,
  DBUserRoleAdapter,
  DeleteUserRoleArgs,
  OptionalUserRole,
  UpdateUserRoleArgs,
  UserRole
} from '@wepublish/api'
import {Collection, Db} from 'mongodb'
import {isNonNull} from '../utility'
import {CollectionName, DBUserRole} from './schema'

export class MongoDBUserRoleAdapter implements DBUserRoleAdapter {
  private userRoles: Collection<DBUserRole>

  constructor(db: Db) {
    this.userRoles = db.collection(CollectionName.UserRoles)
  }

  async createUserRole({input}: CreateUserRoleArgs): Promise<OptionalUserRole> {
    const {insertedId: id} = await this.userRoles.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: input.name,
      description: input.description || '',
      systemRole: false, // always False because only the system can create system roles
      permissionIDs: input.permissionIDs // Test if they exist
    })

    const userRole = await this.userRoles.findOne({_id: id})
    if (!userRole) {
      throw new Error('Could not create UserRole')
    }
    return {
      id: userRole._id,
      name: userRole.name,
      description: userRole.description,
      systemRole: userRole.systemRole,
      permissionIDs: userRole.permissionIDs
    }
  }

  async updateUserRole({id, input}: UpdateUserRoleArgs): Promise<OptionalUserRole> {
    const userRole = await this.getUserRoleByID(id)
    if (userRole?.systemRole) {
      throw new Error('Can not change SystemRoles')
    }
    const {value} = await this.userRoles.findOneAndUpdate(
      {_id: id},
      {
        $set: {
          modifiedAt: new Date(),
          name: input.name,
          description: input.description,
          permissionIDs: input.permissionIDs
        }
      },
      {returnOriginal: false}
    )

    if (!value) return null

    const {_id: outID} = value
    return this.getUserRoleByID(outID)
  }

  async deleteUserRole({id}: DeleteUserRoleArgs): Promise<string | null> {
    const userRole = await this.getUserRoleByID(id)
    if (userRole?.systemRole) {
      throw new Error('Can not delete SystemRoles')
    }
    const {deletedCount} = await this.userRoles.deleteOne({_id: id})
    return deletedCount !== 0 ? id : null
  }

  async getUserRole(name: string): Promise<OptionalUserRole> {
    const userRole = await this.userRoles.findOne({name})
    if (userRole) {
      return {
        id: userRole._id,
        name: userRole.name,
        description: userRole.description,
        systemRole: userRole.systemRole,
        permissionIDs: userRole.permissionIDs
      }
    } else {
      return null
    }
  }

  async getUserRoleByID(id: string): Promise<OptionalUserRole> {
    const userRole = await this.userRoles.findOne({_id: id})
    if (userRole) {
      return {
        id: userRole._id,
        name: userRole.name,
        description: userRole.description,
        systemRole: userRole.systemRole,
        permissionIDs: userRole.permissionIDs
      }
    } else {
      return null
    }
  }

  async getUserRolesByID(ids: string[]): Promise<OptionalUserRole[]> {
    const userRoles = await this.userRoles.find({_id: {$in: ids}}).toArray()

    return userRoles.map<OptionalUserRole>(userRole => ({
      id: userRole._id,
      name: userRole.name,
      description: userRole.description,
      systemRole: userRole.systemRole,
      permissionIDs: userRole.permissionIDs
    }))
  }

  async getNonOptionalUserRolesByID(ids: string[]): Promise<UserRole[]> {
    const roles = await this.getUserRolesByID(ids)
    return roles ? roles.filter(isNonNull) : []
  }
}
