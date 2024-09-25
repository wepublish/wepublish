This is a script to convert redirects from Wordpress (with the plugin https://de.wordpress.org/plugins/redirection/) into a NextJS compatible form.

How it works
- set the desired constants in index.ts
- execute the file: npx ts-node ./libs/migrate-wordpress/src/lib/redirects/index.ts

The script reads an import file (export the redirects as JSON in Wordpress), transforms it into a NextJS-compatible version and saves a new JSON file.