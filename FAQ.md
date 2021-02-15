#### Q: How do i generate a token for the playground?
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

#### Q: What do I do if I receive the error `MongoError: Collection migrations already exists. Currently in strict mode` in the terminal?
A: Basically this error means that you have a conflict in your database caused by working on two different branches with different migration states. 

You can solve this issue by stopping everything, running `docker-compose down` followed by `yarn clean && yarn build`. These commands will delete the current database and remove any residuals. 

Now if you start your database up and run `yarn watch` you'll get a fresh new database. and everything should be running again. 

## Windows Specific Problem 
#### Q: What do I do if I'm using Windows and 'examples/media' doesn't run and I receive the error `Error: Cannot find module '../build/Release/magic'` in the terminal and I receive an error when trying to install this module?
A: If you are using Windows then run this command after checking that you can reach the “MSBuild.exe” file. 
`npm config set msbuild_path "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe"`

Now you can go in the terminal to examples/media and run `yarn` and the magic module should be installed successfully. 
