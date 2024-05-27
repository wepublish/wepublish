import {Test, TestingModule} from '@nestjs/testing'
import {PrismaService} from '@wepublish/nest-modules'
import {UserRoleService} from './user-role.service'

describe('UserRoleService', () => {
  let service: UserRoleService
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRoleService, {provide: PrismaService, useValue: prismaMock}]
    }).compile()

    service = module.get<UserRoleService>(UserRoleService)
  })

  it('should get a user role by id', async () => {
    prismaMock.userRole.findUnique.mockResolvedValueOnce({})
    await service.getUserRoleById('123')
    expect(prismaMock.userRole.findUnique).toHaveBeenCalled()
    expect(prismaMock.userRole.findUnique.mock.calls[0]).toMatchSnapshot()
  })

  it('should get user roles with pagination', async () => {
    prismaMock.userRole.count.mockResolvedValueOnce(10)
    prismaMock.userRole.findMany.mockResolvedValueOnce([])
    const args = {filter: {name: 'Create'}, skip: 0, take: 10}
    await service.getUserRoles(args)
    expect(prismaMock.userRole.count).toHaveBeenCalled()
    expect(prismaMock.userRole.findMany).toHaveBeenCalled()
    expect(prismaMock.userRole.findMany.mock.calls[0]).toMatchSnapshot()
  })

  it('should create a user role', async () => {
    const userRole = {name: 'testRole', description: 'testDescription', permissionIDs: []}
    prismaMock.userRole.create.mockResolvedValueOnce({})
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
    prismaMock.userRole.update.mockResolvedValueOnce({})
    await service.updateUserRole(userRole)
    expect(prismaMock.userRole.findUnique).toHaveBeenCalled()
    expect(prismaMock.userRole.update).toHaveBeenCalled()
    expect(prismaMock.userRole.update.mock.calls[0]).toMatchSnapshot()
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
  })

  it('should throw error when trying to delete a system role', async () => {
    prismaMock.userRole.findUnique.mockResolvedValueOnce({systemRole: true})
    await expect(service.deleteUserRoleById('123')).rejects.toThrow('Cannot delete SystemRoles')
  })
})
