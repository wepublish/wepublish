# Deployments

## Always-there-instances
This is controlled via flux and our infrastructure repository. There are image automation rules which picks up new docker images and deploy those to k8s cluster.

### demo (latest stable version)
- demo.wepublish.media
- editor.demo.wepublish.media
- api.demo.wepublish.media
- media.demo.wepublish.media
- 
### next (latest alpha version)
- next.wepublish.media
- editor.next.wepublish.media
- api.next.wepublish.media
- media.next.wepublish.media
- 
### dev (latest master)
- dev.wepublish.media
- editor.dev.wepublish.media
- api.dev.wepublish.media
- media.dev.wepublish.media


## Ephemeral instances
Deployments managed via github workflows.
 
### PR-related instances
- These deployments are initiated with first pull-request related commit.
- Each commit creates replaces previous deployments using the same address.
- Address is generated based on branch-name and is added as comment to pull-request.
- These are removed when pull-request is merged/closed.
