### Q: How do i generate a token for the playground?

A: When working with the GraphQL-API in the GraphQL-Playground (`http://localhost:4000/admin`), you are required to be authenticated. In order to do so, you have to create a session-token. You can do this in the following way:

Create the following query:

```
mutation login($email: String!, $password: String!) {
  createSession(email: $email, password: $password) {
    token
  }
}
```

Insert into the `query variables`-view the following variable-definition:

```
{"email": "dev@wepublish.ch", "password": "123"}
```

Hit the execute-button (that looks like a play-button). You should now see in the right part of the Playground an output that resembles the following:

```
{
  "data": {
    "createSession": {
      "token": "rDFQbOKDLIG2JhDS6RveuIS6rRF7176R"
    }
  }
}
```

Copy the token and switch to the `HTTP Headers`-view. Now paste your token into the following code:

```
{
  "authorization": "Bearer rDFQbOKDLIG2JhDS6RveuIS6rRF7176R"
}
```

As of now you’re good to go the execute queries/mutations in the GraphQL-Playground.

## Installation troubleshooting

### Q: While running `npm install` I get the following error `The engine "node" is incompatible with this module. Expected version "^16.0.0". Got "12.0.0"`. What can I do?

A: Your local node environment is ahead (or behind) of wepublish. If you have [`nvm`](https://github.com/nvm-sh/nvm) installed, you can call `nvm use` to use the correct node version for this project.

### Q: Installation (while running `npm install`) fails because of `sharp` library (exit code 127)

A: You can solve it by running the following commands:

`rm -rf /Users/{username}/.npm/_libvips`

`brew install vips` (eventually install brew first: https://docs.brew.sh/Homebrew-on-Linux)

`npm ci`

### Q: `Couldn't connect to Docker daemon` while running `npm run dev`

A: This may be caused by a permission misconfiguration in your docker installation.
You can solve it by running: `sudo chown $USER /var/run/docker.sock`

### Q: What do I do if I receive the error `P3009` in the terminal by Prisma?

A: You can solve this issue by resetting the database, running `npx prisma migrate reset`. This command will delete the current database and re-create it.

Now if you run `npm run dev` you'll get a fresh new database. and everything should be running again.
