Wir sind ein Unternehmen, das folgende Technologien bevorzugt. Orientiere dich bei allen Code-Vorschlägen, Architekturempfehlungen und technischen Lösungen immer an diesem Stack, es sei denn, es wird explizit etwas anderes verlangt.

## Frontend

- Next.js mit TypeScript (Pages Router, kein App Router)
- React
- React Icons für Icons
- Storybook für Komponentenentwicklung
- Zod für Schema-Validierung
- React Hook Form für Formulare
- Material UI (MUI) als UI-Komponentenbibliothek – Styling über Template String Notation (`styled()` mit Tagged Template Literals)
- Apollo Client für GraphQL-Kommunikation

## Backend

- Nx als Monorepo-Build-System
- NestJS als Framework
- PostgreSQL als Datenbank
- Prisma als ORM für Datenbankabfragen und Schema-Management
- Apollo Server für GraphQL

## API-Kommunikation

- GraphQL ist der Standard für alle Anwendungen
- Einzige Ausnahme: Für die Anbindung an das We.Publish CMS werden REST APIs verwendet

## Cloud & Hosting

- OpenShift (self-hosted)

## CI/CD

- GitHub Actions für alle Build-, Test- und Deployment-Pipelines

## Versionierung

- GitHub als Plattform für Versionskontrolle und Zusammenarbeit

## Containerisierung

- Docker für die lokale Entwicklungsumgebung
- Alle Production-, Staging- und Review-Builds als Docker-Container, kompatibel mit OpenShift

## Infrastructure as Code

- Terraform für die Infrastrukturverwaltung
- Argo CD und Flux für Helm-Chart-Management und GitOps-basierte Deployments

## Coding Conventions for UI

- Use styled components over inline-styles
- avoid inline-styles
- don't useEffect hooks at all or try to avoid it
- use css grid in combination with styled components.

## Texts and Translations

- Always provide translations in en.json, de.json and fr.json
- The translation key must beginn with its file name. example
  filename: myFile.tsx
  translation within myFile.tsx: {t('myFile.title')}

## Form Validation

- use zod for form validation
- use the following example form validation as an example

      import { zodResolver } from '@hookform/resolvers/zod';

      import { Controller, useForm } from 'react-hook-form';
      import { z } from 'zod';

      import { Button, TextField } from '@mui/material';

      const validationSchema = z.object({
        v0: z.object({
          apiKey: z.string().optional(),
          systemPromp: z.string().optional(),
        }),
        mailChimp: z.object({
          apiKey: z.string().optional(),
          region: z.string().optional(),
        }),
      });

      export const Example = () => {
        const { control, handleSubmit } = useForm<z.infer<typeof validationSchema>>({
          resolver: zodResolver(validationSchema),
          mode: 'onTouched',
          reValidateMode: 'onChange',
        });

        const onSubmit = handleSubmit(console.info, console.warn);

        return (
          <form
            onSubmit={onSubmit}
            noValidate
          >
            {/* if you split these up into smaller components, pass down control */}
            <div>
              <Controller
                name={'v0.apiKey'}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name={'v0.systemPromp'}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    multiline
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                name={'mailChimp.apiKey'}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name={'mailChimp.region'}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <Button
              size={'large'}
              type="submit"
            >
              Submit
            </Button>
          </form>
        );
      };
