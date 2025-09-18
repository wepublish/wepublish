import { Reflector, ModuleRef } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../database/prisma.module';
import { OneOfGuard } from './one-of.guard';
import {
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { of, Observable } from 'rxjs';
import { ONE_OF_METADATA_KEY } from './one-of.decorator';

export class MockTrueGuard implements CanActivate {
  public canActivate(context: ExecutionContext): Observable<boolean> {
    return of(true);
  }
}

export class MockFalseGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    return false;
  }
}

export class MockThrowGuard implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    throw new UnauthorizedException();
  }
}

describe('OneOfGuard', () => {
  let reflector: Reflector;
  let guard: OneOfGuard;
  let moduleRef: ModuleRef;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [OneOfGuard],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
    moduleRef = module.get<ModuleRef>(ModuleRef);
    guard = new OneOfGuard(reflector, moduleRef);

    jest.spyOn(moduleRef, 'get').mockImplementation((guardReference: any) => {
      return new guardReference();
    });
  });

  it('should return false if no guards are set', async () => {
    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(reflectorSpy).toHaveBeenCalledWith(ONE_OF_METADATA_KEY, [{}, {}]);
  });

  it('should return true if the guard returns true', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([MockTrueGuard]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(ONE_OF_METADATA_KEY, [{}, {}]);
  });

  it('should return true if one of the guards returns true', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([MockFalseGuard, MockTrueGuard]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledWith(ONE_OF_METADATA_KEY, [{}, {}]);
  });

  it('should return false no guard returns true', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([MockFalseGuard]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(ONE_OF_METADATA_KEY, [{}, {}]);
  });

  it('should return false if the guard throws unauthorized', async () => {
    const spy = jest
      .spyOn(reflector, 'getAllAndMerge')
      .mockReturnValue([MockThrowGuard]);
    const mockContext = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    const result = await guard.canActivate(mockContext);
    expect(result).toBeFalsy();
    expect(spy).toHaveBeenCalledWith(ONE_OF_METADATA_KEY, [{}, {}]);
  });
});
