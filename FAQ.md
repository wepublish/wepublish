#### Q: How do i generate a token for the playground?
A: When working in the admin-view of the GraphQL-Playground (`http://localhost:4000/admin`), you are required to be authenticated. In order to do so, you have to create a session-token. You can do this in the following way: 

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

#### Q: What do I do if I receive the error `MongoError: Collection migrations already exists. Currently in strict mode` in the terminal?
A: Basically this error means that you have a conflict in your database caused by installing two different (incompatible) branches. 

You can solve this issue by running `docker-compose down` followed by `yarn clean`. These commands will delete the current database and remove any residuals. 

By then running `yarn dev` you can then setup the database from scratch and everything should be running again. 
