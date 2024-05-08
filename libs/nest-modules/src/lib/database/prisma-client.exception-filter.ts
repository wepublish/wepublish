import {Catch} from '@nestjs/common'
import {GqlExceptionFilter} from '@nestjs/graphql'
import {Prisma} from '@prisma/client'
import {UserInputError} from '@nestjs/apollo'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements GqlExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError): any {
    switch (exception.code) {
      case 'P2002':
      case 'P2003':
      case 'P2025':
        return new UserInputError(exception.message)
      default:
        break
    }
    return exception
  }
}
