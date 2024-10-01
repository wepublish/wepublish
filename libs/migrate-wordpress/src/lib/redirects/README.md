This is a script to convert redirects from Wordpress (with the plugin https://de.wordpress.org/plugins/redirection/) and articles from a Wordpress instance
into key-value object saved in a JSON file.
The output JSON file can then be used to write e.g. custom NextJS middleware. See middleware.ts in the mannschaft project for an example.

How it works
- set the desired constants in index.ts
- execute the file: `npx tsx --tsconfig ./libs/migrate-wordpress/tsconfig.json ./libs/migrate-wordpress/src/lib/redirects/index.ts`

The script will read an import file (export the redirects as JSON in Wordpress), convert them to a key-value (source-destination) object and save it to a JSON file.
In addition, the script reads all articles from Wordpress and creates proper redirects for We.Publish (from /:slug to /a/:slug) and saves them to the same JSON file.
