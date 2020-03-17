

Setup Hydra

```
docker run -it --rm --network="host" oryd/hydra:latest migrate sql --yes "postgres://wepublish:1234@localhost:5432/oauth?sslmode=disable"
docker run -it --rm -e HYDRA_ADMIN_URL=http://localhost:4011 --network="host" oryd/hydra:latest clients create --skip-tls-verify --id mike --secret some-secret --grant-types authorization_code,refresh_token,client_credentials,implicit --response-types token,code,id_token --scope openid,email,profile --callbacks http://localhost:4000/auth/wepublish --token-endpoint-auth-method client_secret_basic
```