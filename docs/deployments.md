# Customer Deployments
About the deployment of We.Publish Hosting customer.

Numerous media already entrust us with hosting the We.Publish CMS. We are also happy to take care of your hosting.
[Further information on our project website.](https://wepublish.ch)

## Deployment Configuration

Every project that needs to be deployed should have a `deployment.config.json` file. This file is structured as follows:

```json
{
  "website": {
    "production": {
      "deployment": true,
      "env": {
        "MAILCHIMP_POPUP_SCRIPT_URL": "XXX"
      },
      "secret_env": ["MAILCHIMP_API_KEY"]
    },
    "staging": {
      "deployment": true,
      "env": {
        "MAILCHIMP_POPUP_SCRIPT_URL": "XXX"
      },
      "secret_env": ["MAILCHIMP_API_KEY"]
    },
    "review": {
      "deployment": true,
      "env": {
        "MAILCHIMP_POPUP_SCRIPT_URL": "XXX"
      },
      "secret_env": ["MAILCHIMP_API_KEY"]
    }
  }
}
```

### Configuration Sections

The configuration file contains three main sections: `production`, `staging`, and `review`. Each section configures the deployment settings for its respective stage:

### `deployment`
- **Type:** Boolean (`true` or `false`)
- **Description:** Determines if the frontend should be deployed for the given stage.

### `env`
- **Type:** Object
- **Description:** Contains environment variables that are public and needed at build/runtime. Defined as `"Key": "Value"` (e.g., `Key=Value`). Public environment variables should be placed here if possible.

### `secret_env`
- **Type:** Array
- **Description:** Lists environment variables that should remain secure and not be public. These variables are defined in the config file and must be set as GitHub Action secrets in the repository settings.
    - **GitHub Configuration:** The secret environment variables in the GitHub settings must be prefixed with `DEPLOYMENT_${PROJECT_NAME_UPPERCASE}_`. For example, `MAILCHIMP_API_KEY` in the `deployment.config.json` file for the `tsri` project should be set as `DEPLOYMENT_TSRI_MAILCHIMP_API_KEY` in the GitHub Action secrets. [Set the secrets here.](https://github.com/wepublish/wepublish/settings/secrets/actions)

## Review Stage
- **Deployment:** A review environment is created and deployed for every pull request (PR).
- **Database Setup:** To copy a staging database to a review build, use the "Setup database for review build" action.
    - **GitHub Action URL:** [Setup database for review build](https://github.com/wepublish/wepublish/actions/workflows/on-demand-deploy-project-database.yml)
    - **Parameters:** Provide the project name (e.g., `bajour`) and PR number (e.g., `12345`).

## Staging Stage
- **Deployment:** The `master` branch is automatically deployed to all staging environments. No manual action is required.

## Production Stage
- **Deployment:**
    1. Check out the commit or branch you want to deploy to production (e.g., `master`).
    2. Run the following command:
       ```sh
       npm run deploy:production ${project_name}
       ```
       For example, to deploy the `bajour` project:
       ```sh
       npm run deploy:production bajour
       ```
  The deployment process will then be automated.

# Public deployments
About public demo deployments.

## Always-there-instances
This is controlled via flux and our infrastructure repository. There are image automation rules which picks up new docker images and deploy those to k8s cluster.

### demo (latest stable version)
- [demo.wepublish.media](https://demo.wepublish.media)
- [editor.demo.wepublish.media](https://editor.demo.wepublish.media)
- [api.demo.wepublish.media](https://api.demo.wepublish.media)
- [media.demo.wepublish.media](https://media.demo.wepublish.media)

### next (latest alpha version)
- [next.wepublish.media](https://next.wepublish.media)
- [editor.next.wepublish.media](https://editor.next.wepublish.media)
- [api.next.wepublish.media](https://api.next.wepublish.media)
- [media.next.wepublish.media](https://media.next.wepublish.media)
 
### dev (latest master)
- [dev.wepublish.media](https://dev.wepublish.media)
- [editor.dev.wepublish.media](https://editor.dev.wepublish.media)
- [api.dev.wepublish.media](https://api.dev.wepublish.media)
- [media.dev.wepublish.media](https://media.dev.wepublish.media)


## Ephemeral instances
Deployments managed via github workflows.
 
### PR-related instances
- These deployments are initiated with first pull-request related commit.
- Each commit creates replaces previous deployments using the same address.
- Address is generated based on branch-name and is added as comment to pull-request.
- These are removed when pull-request is merged/closed.
