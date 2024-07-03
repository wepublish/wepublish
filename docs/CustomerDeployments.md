# Customer Deployments

## Deployment Configuration

Every project that needs to be deployed should have a `deployment.config.json` file. This file is structured as follows:

```json
{
  "frontend": {
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
