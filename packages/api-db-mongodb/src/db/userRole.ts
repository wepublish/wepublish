import {DBUserRoleAdapter, CreateUserRoleArgs, OptionalUserRole, UserRole} from '@wepublish/api'

import {Collection, Db} from 'mongodb'

import {CollectionName, DBUserRole} from './schema'
import {isNonNull} from '../utility'

export class MongoDBUserRoleAdapter implements DBUserRoleAdapter {
  private userRoles: Collection<DBUserRole>

  constructor(db: Db) {
    this.userRoles = db.collection(CollectionName.UserRoles)
  }

  async createUserRole(args: CreateUserRoleArgs): Promise<OptionalUserRole> {
    const {insertedId: id} = await this.userRoles.insertOne({
      createdAt: new Date(),
      modifiedAt: new Date(),
      name: args.name,
      description: args.description || '',
      systemRole: false, //always False because only the system can create system roles
      permissionIDs: args.permissionIDs
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
