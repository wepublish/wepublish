# zettelkasten-api

Read access from the We.Publish API to a knowledge provider, today the
Zettelkasten, through its REST door (`wepublish-rest/1`).

- `ZettelkastenConfig` loads the editor's knowledge provider setting
  (`settings.knowledgeprovider`, one row with id `zettelkasten`), decrypts the
  token with `SecretCrypto` and caches the result in the ttl cache. The
  settings service resets that namespace on every update.
- `ZettelkastenClientService` calls one tool as one path:
  `GET <url>/api/v1/mandanten/<tenant>/<tool>?<params>` with the token as
  bearer. The tenant always comes from the setting, never from a request.
  Errors of the door (`{"fehler": {"code", "meldung"}}`) become a
  `ZettelkastenError` with the code in the GraphQL extensions.
- `ZettelkastenResolver` exposes six queries for everyone who may create
  articles: `zettelkastenEnabled`, `zettelkastenSearch`, `zettelkastenPage`,
  `zettelkastenEvidence`, `zettelkastenArchive`, `zettelkastenDailyReport`.
  Payloads pass through unchanged as `JSON`, so the evidence of every fact
  (`beleg`, `quelle`) survives the way into the editor.

Nothing here needs a Helm value or an environment variable: the feature is
active for a medium as soon as its setting is enabled and complete.

```bash
npx vitest run --config libs/zettelkasten/api/vitest.config.ts
```
