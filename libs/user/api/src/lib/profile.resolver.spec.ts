import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock, PartialMocked } from '@wepublish/testing';
import { UserService } from './user.service';
import { ProfileService } from './profile.service';
import { ProfileResolver } from './profile.resolver';

const mockUser = {
  id: 'userId',
  name: 'name',
  firstName: 'firstName',
  birthday: null,
  email: 'email',
  active: true,
  flair: 'flair',
  userImageID: 'userImageId',
  roleIDs: [],
};

const mockUserSession = {
  type: 'user',
  id: '448c86d8-9df1-4836-9ae9-aa2668ef9dcd',
  token: 'some-token',
  user: mockUser,
};

describe('ProfileResolver', () => {
  let app: INestApplication;

  let userService: PartialMocked<UserService>;
  let profileService: PartialMocked<ProfileService>;

  beforeEach(async () => {
    userService = createMock(UserService);
    profileService = createMock(ProfileService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/',
          cache: 'bounded',
          context: {
            req: {
              user: mockUserSession,
            },
          },
        }),
      ],
      providers: [
        ProfileResolver,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: ProfileService,
          useValue: profileService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
});
