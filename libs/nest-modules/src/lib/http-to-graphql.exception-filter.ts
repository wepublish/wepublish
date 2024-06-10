import {Catch, HttpException} from '@nestjs/common'
import {GqlExceptionFilter} from '@nestjs/graphql'
import {UserInputError} from '@nestjs/apollo'

@Catch(HttpException)
export class HttpToGraphql implements GqlExceptionFilter {
  catch(exception: HttpException): any {
    if (exception instanceof HttpException) {
      if (exception.getStatus() >= 400 && exception.getStatus() < 500) {
        return new UserInputError(exception.message)
      }
    }
    return exception
  }
}
