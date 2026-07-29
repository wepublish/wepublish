# collaboration-api

Real-time collaboration backend for We.Publish. It exposes a
[Yjs](https://github.com/yjs/yjs) `y-websocket` server implemented as a NestJS
WebSocket gateway (`CollaborationGateway`), backed by the reference
`setupWSConnection` handler from `y-websocket/bin/utils`.

## Usage

`CollaborationGateway` uses the raw `ws` platform, so the consuming Nest
application must register the `ws` adapter during bootstrap:

```ts
import { WsAdapter } from '@nestjs/platform-ws';

const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new WsAdapter(app));
```

Then import the module:

```ts
import { CollaborationModule } from '@wepublish/collaboration/api';

@Module({ imports: [CollaborationModule] })
export class AppModule {}
```

The gateway listens on its own websocket port (`COLLABORATION_WS_PORT`, default
`4100`), separate from the application's HTTP port. The articleId is the URL
path (`ws://host:4100/<articleId>`), so each article is its own Yjs document and
document content **and** presence are scoped to that article. A `y-websocket`
client connects like:

```ts
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
// connects to ws://localhost:4100/article-42
const provider = new WebsocketProvider('ws://localhost:4100', 'article-42', doc);
```

## Presence

Presence uses Yjs [awareness](https://docs.yjs.dev/getting-started/adding-awareness)
— no extra server code. Because each article is its own document, awareness is
already scoped to the article:

```ts
// when an editor opens the article:
provider.awareness.setLocalStateField('user', { id: currentUserId });

// everyone currently on this article:
const users = [...provider.awareness.getStates().values()]
  .map((state) => state.user?.id)
  .filter(Boolean);

// react to people joining / leaving:
provider.awareness.on('change', () => {
  /* recompute users */
});
```

## Running unit tests

Run `nx test collaboration-api` to execute the unit tests via [Jest](https://jestjs.io).
