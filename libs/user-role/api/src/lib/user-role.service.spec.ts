import {Test, TestingModule} from '@nestjs/testing'
import {UserRoleService} from './user-role.service'
import {PrismaClient} from '@prisma/client'
import {UserRoleDataloader} from './user-role.dataloader'

describe('UserRoleService', () => {
  let service: UserRoleService
  let dataloader: {[method in keyof UserRoleDataloader]?: jest.Mock}
  let prismaMock: any

  beforeEach(async () => {
    prismaMock = {
      userRole: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn()
      }
    }

    dataloader = {
      prime: jest.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        {provide: UserRoleDataloader, useValue: dataloader},
        {provide: PrismaClient, useValue: prismaMock}
      ]
    }).compile()

    service = module.get<UserRoleService>(UserRoleService)
  })

  it('should get a user role by id', async () => {
    prismaMock.userRole.findUnique.mockResolvedValueOnce({
      id: '123',
      name: 'updatedRole',
      description: 'updatedDescription',
      permissionIDs: []
    })
    await service.getUserRoleById('123')
    expect(prismaMock.userRole.findUnique).toHaveBeenCalled()
    expect(prismaMock.userRole.findUnique.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should get user roles with pagination', async () => {
    prismaMock.userRole.count.mockResolvedValueOnce(2)
    prismaMock.userRole.findMany.mockResolvedValueOnce([
      {
        id: '123',
        name: 'updatedRole',
        description: 'updatedDescription',
        permissionIDs: []
      },
      {
        id: '234',
        name: 'updatedRoleAnother',
        description: 'updatedDescriptionAnother',
        permissionIDs: []
      }
    ])
    const args = {filter: {name: 'Create'}, skip: 0, take: 2}
    await service.getUserRoles(args)
    expect(prismaMock.userRole.count).toHaveBeenCalled()
    expect(prismaMock.userRole.findMany).toHaveBeenCalled()
    expect(prismaMock.userRole.findMany.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should create a user role', async () => {
    const userRole = {name: 'testRole', description: 'testDescription', permissionIDs: []}
    prismaMock.userRole.create.mockResolvedValueOnce(userRole)
    await service.createUserRole(userRole)
    expect(prismaMock.userRole.create).toHaveBeenCalled()
    expect(prismaMock.userRole.create.mock.calls[0]).toMatchSnapshot()
  })

  it('should update a user role', async () => {
    const userRole = {
      id: '123',
      name: 'updatedRole',
      description: 'updatedDescription',
      permissionIDs: []
    }
    prismaMock.userRole.findUnique.mockResolvedValueOnce({systemRole: false})
    prismaMock.userRole.update.mockResolvedValueOnce({...userRole, systemRole: false})
    await service.updateUserRole(userRole)
    expect(prismaMock.userRole.findUnique).toHaveBeenCalled()
    expect(prismaMock.userRole.update).toHaveBeenCalled()
    expect(prismaMock.userRole.update.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).toHaveBeenCalled()
  })

  it('should throw error when trying to update a system role', async () => {
    const userRole = {
      id: '123',
      name: 'updatedRole',
      description: 'updatedDescription',
      permissionIDs: []
    }
    prismaMock.userRole.findUnique.mockResolvedValueOnce({systemRole: true})
    await expect(service.updateUserRole(userRole)).rejects.toThrow('Cannot change SystemRoles')
  })

  it('should delete a user role by id', async () => {
    prismaMock.userRole.findUnique.mockResolvedValueOnce({systemRole: false})
    prismaMock.userRole.delete.mockResolvedValueOnce({})
    await service.deleteUserRoleById('123')
    expect(prismaMock.userRole.findUnique).toHaveBeenCalled()
    expect(prismaMock.userRole.delete).toHaveBeenCalled()
    expect(prismaMock.userRole.delete.mock.calls[0]).toMatchSnapshot()
    expect(dataloader.prime).not.toHaveBeenCalled()
  })

  it('should throw error when trying to delete a system role', async () => {
    prismaMock.userRole.findUnique.mockResolvedValueOnce({systemRole: true})
    await expect(service.deleteUserRoleById('123')).rejects.toThrow('Cannot delete SystemRoles')
  })
})
