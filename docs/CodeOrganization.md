# Code Organization

## Content
- Folder structure
- Naming conventions for folders and files
- Cheat sheet with the most important commands

TBW

## GraphQL-API v2

The top level libs folder contains the global container modules, like
`membership`, where all member and subscription related features are contained,
and `editor`, where all code related to the text editor are bundled.

Inside the container modules, in the folder `api/src/lib`, the actual
implementations are stored in their own folders. This includes GraphQL types,
resolvers, and any additional logic used in the feature.

### Adding features

To add a new feature, do the following:

* Decide which top-level module your feature belongs to. Is it related to the
memberships, the editor, or something else?
* Select a name for your feature, e.g. `profile-page`.
* Create the folder `profile-page` in `libs/membership/api/src/lib`.
* Place all your files inside this newly created folder.
* Create a module inside your feature folder. The module needs to define your
newly created classes as `providers`. Name it `profile-page.module.ts`.
* Add your module to the imports in
`libs/membership/api/src/lib/membership.module.ts`, to make them available to
the other modules.
