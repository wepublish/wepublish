# Customer Deployments

## Deployment Configuration

In every project that needs to be deployed there is a file called ``deployment.config.json``:
````
{
  "frontend": {
    "production": {
      "deployment": true,
      "env": {
        "MAILCHIMP_POPUP_SCRIPT_URL": "XXXX",
      },
      "secret_env": ["MAILCHIMP_API_KEY"]
    },
    "staging": {
      "deployment": true,
      "env": {
        "MAILCHIMP_POPUP_SCRIPT_URL": "XXXX",
      },
      "secret_env": ["MAILCHIMP_API_KEY"]
    },
    "review": {
      "deployment": true,
      "env": {
        "MAILCHIMP_POPUP_SCRIPT_URL": "XXX",
      },
      "secret_env": ["MAILCHIMP_API_KEY"]
    }
  }
}
````
This file consists out of 3 main sections (staging,production,review). Every section configures the deployment of the stage it describes with the follwing settings:

### deployment
Can be set to true or false and determines if on the given stage the frontend is deployed or not.

### env
Are all the env variables for the frontend that need to be passed on build/runtime and can be public. Are defined as "Key": "Value" => Key=Value. If possible they should be defined here.

### secret_env
Are the env variables that should not be public and needs to stay secure they are defined as an array in the config file and then need to be set as github action secret in the github repository config (https://github.com/wepublish/wepublish/settings/secrets/actions). The secret env variables in the github config need to be prefixed with "DEPLOYMENT_${Project name upper case}_" eg. MAILCHIMP_API_KEY in the config file of tsri needs to be DEPLOYMENT_TSRI_MAILCHIMP_API_KEY in the github action config.

## Review
Review is always created and deployed on any pr.  
It's possible to copy staging database of a customer to a review build by using manual action "Setup database for review build" action (https://github.com/wepublish/wepublish/actions/workflows/on-demand-deploy-project-database.yml) you need to pass project name of the project you want to copy eg. bajour and pr number eg. 12345.

## Staging
Master is always deployed to all staging environments no action is required.

## Production
