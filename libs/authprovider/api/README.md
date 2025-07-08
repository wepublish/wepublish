# AuthProvider API

This library provides OAuth authentication provider functionality for the WePublish platform.

## Features

- OAuth provider discovery and authentication URL generation
- GraphQL queries for available auth providers
- Configurable with dynamic module pattern

## Usage

```typescript
// In your app module
import { AuthProviderModule } from '@wepublish/authprovider-api';

@Module({
  imports: [
    AuthProviderModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        // Get your OAuth providers configuration
        return {
          oauth2ProvidersFactory: async () => {
            // Return your OAuth2 clients
          }
        }
      }
    })
  ]
})
export class AppModule {}
```
