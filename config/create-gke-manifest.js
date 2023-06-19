const fs = require('fs')
const {exec} = require('child_process')
const {slugify} = require('./utilities')

try {
  require('dotenv').config()
} catch (e) {}

const {GITHUB_REF, PROJECT_ID, BRANCH_NAME, WEPUBLISH_IMAGE} = process.env

let ENVIRONMENT_NAME = 'development'
if ((GITHUB_REF === 'refs/heads/master' || GITHUB_REF === 'master') && !BRANCH_NAME) {
  ENVIRONMENT_NAME = 'production'
}

const GITHUB_REF_SHORT = slugify(
  !BRANCH_NAME
    ? GITHUB_REF.substring(GITHUB_REF.lastIndexOf('/') + 1)
    : BRANCH_NAME.substring(0, 12)
)

const NAMESPACE = envSwitch(ENVIRONMENT_NAME, 'wepublish', 'wepublish-dev')

const domain = 'demo.wepublish.media'
const devDomain = `${GITHUB_REF_SHORT}.wepublish.dev`
const domainCn = envSwitch(ENVIRONMENT_NAME, `${domain}`, `${devDomain}`)
const domainSan = envSwitch(ENVIRONMENT_NAME, `www.${domain}`, `www.${devDomain}`)

const domainMedia = envSwitch(ENVIRONMENT_NAME, `media.${domain}`, `media.${devDomain}`)
const domainAPI = envSwitch(ENVIRONMENT_NAME, `api.${domain}`, `api.${devDomain}`)
const domainEditor = envSwitch(ENVIRONMENT_NAME, `editor.${domain}`, `editor.${devDomain}`)

const databaseURL = `postgresql://postgres@${GITHUB_REF_SHORT}-postgres-${ENVIRONMENT_NAME}:5432/wepublish?schema=public`

const image = `${WEPUBLISH_IMAGE}`

const certificateSecretName = `${ENVIRONMENT_NAME}-${GITHUB_REF_SHORT}-wildcard-tls`

const mediaAppName = `${GITHUB_REF_SHORT}-media-${ENVIRONMENT_NAME}`
const mediaPort = 4100

main().catch(e => {
  process.stderr.write(e.toString())
  process.exit(1)
})

async function main() {
  if (ENVIRONMENT_NAME === 'development') {
    await applyCertificate()
  }
  await applyWebsite()
  await applyMediaServer()
  await applyApiServer()
  await applyEditor()
  await applyPostgres()
}

async function applyCertificate() {
  const certName = `${GITHUB_REF_SHORT}-wildcard-certificate-${ENVIRONMENT_NAME}`

  const certificate = {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: {
      name: certName,
      namespace: NAMESPACE
    },
    spec: {
      secretName: certificateSecretName,
      duration: '2160h',
      renewBefore: '360h',
      subject: {
        organizations: ['wepublish']
      },
      isCA: false,
      privateKey: {
        algorithm: 'RSA',
        encoding: 'PKCS1',
        size: 2048
      },
      usages: ['server auth', 'client auth'],
      dnsNames: [`*.${domainCn}`, domainCn],
      issuerRef: {
        name: 'wepublish-dev-prod-issuer',
        kind: 'Issuer'
      }
    }
  }

  await applyConfig(`certificate-wildcard`, certificate)
}

async function applyWebsite() {
  const servicePort = 8000
  const app = 'website'
  const appName = `${GITHUB_REF_SHORT}-${app}-${ENVIRONMENT_NAME}`

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: appName,
      namespace: NAMESPACE
    },
    spec: {
      ports: [
        {
          name: 'http',
          port: servicePort,
          protocol: 'TCP',
          targetPort: servicePort
        }
      ],
      selector: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      sessionAffinity: 'None',
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  function getRule(host) {
    return {
      host,
      http: {
        paths: [
          {
            backend: {
              service: {
                name: appName,
                port: {
                  number: servicePort
                }
              }
            },
            pathType: 'Prefix',
            path: '/'
          }
        ]
      }
    }
  }

  let rules = [getRule(domainCn)]
  let hosts = [domainCn]
  if (domainSan) {
    const domains = domainSan.split(',')
    rules = rules.concat(domains.map(domain => getRule(domain)))
    hosts = hosts.concat(domains)
  }

  const ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '1m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        ...envSwitch(
          ENVIRONMENT_NAME,
          {
            'cert-manager.io/cluster-issuer': 'letsencrypt-production'
          },
          {
            'cert-manager.io/acme-challenge-type': 'dns01',
            'cert-manager.io/acme-dns01-provider': 'cloudDNS'
          }
        )
      }
    },
    spec: {
      rules,
      tls: [
        {
          hosts,
          secretName: envSwitch(ENVIRONMENT_NAME, `${appName}-tls`, certificateSecretName)
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)

  // Info Resources: https://github.com/kubernetes/community/blob/master/contributors/design-proposals/node/resource-qos.md
  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app,
          slug: GITHUB_REF_SHORT,
          release: ENVIRONMENT_NAME
        }
      },
      strategy: {
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0
        },
        type: 'RollingUpdate'
      },
      template: {
        metadata: {
          name: appName,
          labels: {
            app,
            slug: GITHUB_REF_SHORT,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image,
              command: [
                'sh',
                '-c',
                'npx nx build website-example --prod && npx next start dist/apps/website-example/ -p 8000'
              ],
              env: [
                {
                  name: 'NODE_ENV',
                  value: `production`
                },
                {
                  name: 'API_URL',
                  value: `https://${domainAPI}`
                }
              ],
              ports: [
                {
                  containerPort: servicePort,
                  protocol: 'TCP'
                }
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                requests: {
                  cpu: '0m',
                  memory: envSwitch(ENVIRONMENT_NAME, '128Mi', '128Mi')
                }
              },
              readinessProbe: {
                httpGet: {
                  httpHeaders: [
                    {
                      name: 'Host',
                      value: domainCn
                    }
                  ],
                  path: '/',
                  port: servicePort,
                  scheme: 'HTTP'
                },
                initialDelaySeconds: 5,
                successThreshold: 1,
                timeoutSeconds: 60
              },
              livenessProbe: {
                httpGet: {
                  httpHeaders: [
                    {
                      name: 'Host',
                      value: domainCn
                    }
                  ],
                  path: '/',
                  port: servicePort,
                  scheme: 'HTTP'
                },
                initialDelaySeconds: 60,
                periodSeconds: 60,
                successThreshold: 1,
                timeoutSeconds: 60
              }
            }
          ]
        }
      }
    }
  }
  await applyConfig(`deployment-${app}`, deployment)
}

async function applyMediaServer() {
  const app = 'media'
  const appName = mediaAppName
  const appPort = mediaPort
  const mediaImage = 'ghcr.io/wepublish/karma-media-server:latest'

  const pvc = {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: `${GITHUB_REF_SHORT}-media-server`,
      namespace: NAMESPACE
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: envSwitch(ENVIRONMENT_NAME, '30Gi', '1Gi')
        }
      }
    }
  }

  await applyConfig(`pvc-${app}`, pvc)

  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app,
          slug: GITHUB_REF_SHORT,
          release: ENVIRONMENT_NAME
        }
      },
      strategy: {
        type: 'Recreate'
      },
      template: {
        metadata: {
          name: appName,
          labels: {
            app,
            slug: GITHUB_REF_SHORT,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: mediaImage,
              env: [
                {
                  name: 'NODE_ENV',
                  value: `production`
                },
                {
                  name: 'STORAGE_PATH',
                  value: '/home/node/wepublish/.media'
                },
                {
                  name: 'NUM_CLUSTERS',
                  value: '1'
                },
                {
                  name: 'TOKEN',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'media_server_token'
                    }
                  }
                }
              ],
              ports: [
                {
                  containerPort: appPort,
                  protocol: 'TCP'
                }
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                requests: {
                  cpu: '0m',
                  memory: '128Mi'
                }
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
              volumeMounts: [
                {
                  name: 'media-volume',
                  mountPath: '/home/node/wepublish/.media'
                }
              ]
            }
          ],
          dnsPolicy: 'ClusterFirst',
          restartPolicy: 'Always',
          schedulerName: 'default-scheduler',
          terminationGracePeriodSeconds: 30,
          securityContext: {
            fsGroup: 1000
          },
          volumes: [
            {
              name: 'media-volume',
              persistentVolumeClaim: {
                claimName: `${GITHUB_REF_SHORT}-media-server`
              }
            }
          ]
        }
      }
    }
  }
  await applyConfig(`deployment-${app}`, deployment)

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: appName,
      namespace: NAMESPACE
    },
    spec: {
      ports: [
        {
          name: 'http',
          port: appPort,
          protocol: 'TCP',
          targetPort: appPort
        }
      ],
      selector: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  const ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '20m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        ...envSwitch(
          ENVIRONMENT_NAME,
          {
            'cert-manager.io/cluster-issuer': 'letsencrypt-production'
          },
          {
            'cert-manager.io/acme-challenge-type': 'dns01',
            'cert-manager.io/acme-dns01-provider': 'cloudDNS'
          }
        )
      }
    },
    spec: {
      rules: [
        {
          host: domainMedia,
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: appName,
                    port: {
                      number: appPort
                    }
                  }
                },
                pathType: 'Prefix',
                path: '/'
              }
            ]
          }
        }
      ],
      tls: [
        {
          hosts: [domainMedia],
          secretName: envSwitch(ENVIRONMENT_NAME, `${appName}-tls`, certificateSecretName)
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)
}

async function applyApiServer() {
  const app = 'api'
  const appName = `${GITHUB_REF_SHORT}-${app}-${ENVIRONMENT_NAME}`
  const appPort = 8000

  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app,
          slug: GITHUB_REF_SHORT,
          release: ENVIRONMENT_NAME
        }
      },
      strategy: {
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0
        },
        type: 'RollingUpdate'
      },
      template: {
        metadata: {
          name: appName,
          labels: {
            app,
            slug: GITHUB_REF_SHORT,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          volumes: [
            {
              name: 'google-cloud-key',
              secret: {
                secretName: 'log-the-things'
              }
            }
          ],
          containers: [
            {
              name: appName,
              image,
              command: ['/bin/sh'],
              args: ['-c', 'npm run migrate && node dist/apps/api-example/main.js'],
              volumeMounts: [
                {
                  name: 'google-cloud-key',
                  mountPath: '/var/secrets/google'
                }
              ],
              env: [
                {
                  name: 'NODE_ENV',
                  value: `production`
                },
                {
                  name: 'GOOGLE_APPLICATION_CREDENTIALS',
                  value: '/var/secrets/google/key.json'
                },
                {
                  name: 'MEDIA_SERVER_URL',
                  value: `https://${domainMedia}`
                },
                {
                  name: 'MEDIA_SERVER_INTERNAL_URL',
                  value: `http://${mediaAppName}.${NAMESPACE}.svc.cluster.local:${mediaPort}`
                },
                {
                  name: 'MEDIA_ADDRESS',
                  value: `${domainMedia}`
                },
                {
                  name: 'MEDIA_PORT',
                  value: '443'
                },
                // {
                //   name: 'HOST_ENV',
                //   value: envSwitch(ENVIRONMENT_NAME, 'production', 'staging')
                // },
                // {
                //   name: 'CANONICAL_HOST',
                //   value: envSwitch(
                //     ENVIRONMENT_NAME,
                //     'https://demo.wepublish.media',
                //     'https://staging.demo.wepublish.media'
                //   )
                // },
                {
                  name: 'DATABASE_URL',
                  value: databaseURL
                },
                {
                  name: 'HOST_URL',
                  value: `https://${domainAPI}`
                },
                {
                  name: 'WEBSITE_URL',
                  value: envSwitch(ENVIRONMENT_NAME, `https://${domain}`, `https://${devDomain}`)
                },
                {
                  name: 'MEDIA_SERVER_TOKEN',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'media_server_token'
                    }
                  }
                },
                {
                  name: 'MAILGUN_API_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'mailgun_api_key'
                    }
                  }
                },
                {
                  name: 'MAILGUN_BASE_DOMAIN',
                  value: 'api.eu.mailgun.net'
                },
                {
                  name: 'MAILGUN_MAIL_DOMAIN',
                  value: 'mg.wepublish.media'
                },
                {
                  name: 'MAILGUN_WEBHOOK_SECRET',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'mailgun_webhook_secret'
                    }
                  }
                },
                {
                  name: 'JWT_SECRET_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'jwt_secret_key'
                    }
                  }
                },
                {
                  name: 'STRIPE_SECRET_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'stripe_secret_key'
                    }
                  }
                },
                {
                  name: 'STRIPE_WEBHOOK_SECRET',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'stripe_webhook_secret'
                    }
                  }
                },
                {
                  name: 'STRIPE_CHECKOUT_WEBHOOK_SECRET',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'stripe_checkout_webhook_secret'
                    }
                  }
                },
                {
                  name: 'PAYREXX_INSTANCE_NAME',
                  value: 'tsridev'
                },
                {
                  name: 'PAYREXX_WEBHOOK_SECRET',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'payrexx_api_secret'
                    }
                  }
                },
                {
                  name: 'PAYREXX_API_SECRET',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'payrexx_api_secret'
                    }
                  }
                },
                {
                  name: 'SENTRY_DSN',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'sentry_dsn'
                    }
                  }
                },
                {
                  name: 'SENTRY_ENV',
                  value: envSwitch(ENVIRONMENT_NAME, 'production', 'staging')
                },
                {
                  name: 'GOOGLE_PROJECT',
                  value: PROJECT_ID
                },
                {
                  name: 'RESET_PASSWORD_JWT_EXPIRES_MIN',
                  value: '1440'
                },
                {
                  name: 'SEND_LOGIN_JWT_EXPIRES_MIN',
                  value: '10080'
                },
                {
                  name: 'ENABLE_ANONYMOUS_COMMENTS',
                  value: 'false'
                },
                {
                  name: 'PEERING_TIMEOUT_IN_MS',
                  value: '3000'
                }
              ],
              ports: [
                {
                  containerPort: appPort,
                  protocol: 'TCP'
                }
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                requests: {
                  cpu: '0m',
                  memory: '128Mi'
                }
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File'
            }
          ]
        }
      }
    }
  }
  await applyConfig(`deployment-${app}`, deployment)

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: appName,
      namespace: NAMESPACE
    },
    spec: {
      ports: [
        {
          name: 'http',
          port: appPort,
          protocol: 'TCP',
          targetPort: appPort
        }
      ],
      selector: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  const ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '10m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        ...envSwitch(
          ENVIRONMENT_NAME,
          {
            'cert-manager.io/cluster-issuer': 'letsencrypt-production'
          },
          {
            'cert-manager.io/acme-challenge-type': 'dns01',
            'cert-manager.io/acme-dns01-provider': 'cloudDNS'
          }
        )
      }
    },
    spec: {
      rules: [
        {
          host: domainAPI,
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: appName,
                    port: {
                      number: appPort
                    }
                  }
                },
                pathType: 'Prefix',
                path: '/'
              }
            ]
          }
        }
      ],
      tls: [
        {
          hosts: [domainAPI],
          secretName: envSwitch(ENVIRONMENT_NAME, `${appName}-tls`, certificateSecretName)
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)
}

async function applyEditor() {
  const app = 'editor'
  const appName = `${GITHUB_REF_SHORT}-${app}-${ENVIRONMENT_NAME}`
  const appPort = 8000

  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app,
          slug: GITHUB_REF_SHORT,
          release: ENVIRONMENT_NAME
        }
      },
      strategy: {
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0
        },
        type: 'RollingUpdate'
      },
      template: {
        metadata: {
          name: appName,
          labels: {
            app,
            slug: GITHUB_REF_SHORT,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image,
              command: ['node', 'dist/apps/editor/main.js'],
              env: [
                {
                  name: 'NODE_ENV',
                  value: `production`
                },
                {
                  name: 'API_URL',
                  value: `https://${domainAPI}`
                },
                {
                  name: 'PEER_BY_DEFAULT',
                  value: 'true'
                },
                {
                  name: 'IMG_MIN_SIZE_TO_COMPRESS',
                  value: '10'
                }
              ],
              ports: [
                {
                  containerPort: appPort,
                  protocol: 'TCP'
                }
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                requests: {
                  cpu: '0m',
                  memory: '128Mi'
                }
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File'
            }
          ],
          dnsPolicy: 'ClusterFirst',
          restartPolicy: 'Always',
          schedulerName: 'default-scheduler',
          terminationGracePeriodSeconds: 30
        }
      }
    }
  }
  await applyConfig(`deployment-${app}`, deployment)

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: appName,
      namespace: NAMESPACE
    },
    spec: {
      ports: [
        {
          name: 'http',
          port: appPort,
          protocol: 'TCP',
          targetPort: appPort
        }
      ],
      selector: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  const ingress = {
    apiVersion: 'networking.k8s.io/v1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '20m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        ...envSwitch(
          ENVIRONMENT_NAME,
          {
            'cert-manager.io/cluster-issuer': 'letsencrypt-production'
          },
          {
            'cert-manager.io/acme-challenge-type': 'dns01',
            'cert-manager.io/acme-dns01-provider': 'cloudDNS'
          }
        )
      }
    },
    spec: {
      rules: [
        {
          host: domainEditor,
          http: {
            paths: [
              {
                backend: {
                  service: {
                    name: appName,
                    port: {
                      number: appPort
                    }
                  }
                },
                pathType: 'Prefix',
                path: '/'
              }
            ]
          }
        }
      ],
      tls: [
        {
          hosts: [domainEditor],
          secretName: envSwitch(ENVIRONMENT_NAME, `${appName}-tls`, certificateSecretName)
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)
}

async function applyPostgres() {
  const app = 'postgres'
  const port = 5432
  const appName = `${GITHUB_REF_SHORT}-${app}-${ENVIRONMENT_NAME}`

  const pvc = {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: `${GITHUB_REF_SHORT}-postgres-data`,
      namespace: NAMESPACE
    },
    spec: {
      accessModes: ['ReadWriteOnce'],
      resources: {
        requests: {
          storage: envSwitch(ENVIRONMENT_NAME, '30Gi', '1Gi')
        }
      }
    }
  }

  await applyConfig(`pvc-${app}`, pvc)

  const deployment = {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app,
          slug: GITHUB_REF_SHORT,
          release: ENVIRONMENT_NAME
        }
      },
      strategy: {
        type: 'Recreate'
      },
      template: {
        metadata: {
          name: appName,
          labels: {
            app,
            slug: GITHUB_REF_SHORT,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: 'bitnami/postgresql:14',
              env: [
                {
                  name: 'POSTGRESQL_DATABASE',
                  value: 'wepublish'
                },
                {
                  name: 'ALLOW_EMPTY_PASSWORD',
                  value: 'yes'
                }
              ],
              ports: [
                {
                  containerPort: port,
                  protocol: 'TCP'
                }
              ],
              imagePullPolicy: 'IfNotPresent',
              resources: {
                requests: {
                  cpu: '0m',
                  memory: '128Mi'
                }
              },
              terminationMessagePath: '/dev/termination-log',
              terminationMessagePolicy: 'File',
              volumeMounts: [
                {
                  name: 'postgres-volume',
                  mountPath: '/bitnami/postgresql'
                }
              ]
            }
          ],
          initContainers: [
            {
              name: 'postgres-data-permission-fix',
              image: 'busybox',
              command: ['/bin/chmod', '-R', '777', '/bitnami/postgresql'],
              volumeMounts: [
                {
                  name: 'postgres-volume',
                  mountPath: '/bitnami/postgresql'
                }
              ]
            }
          ],
          dnsPolicy: 'ClusterFirst',
          restartPolicy: 'Always',
          schedulerName: 'default-scheduler',
          terminationGracePeriodSeconds: 30,
          volumes: [
            {
              name: 'postgres-volume',
              persistentVolumeClaim: {
                claimName: `${GITHUB_REF_SHORT}-postgres-data`
              }
            }
          ]
        }
      }
    }
  }
  await applyConfig(`deployment-${app}`, deployment)

  const service = {
    apiVersion: 'v1',
    kind: 'Service',
    metadata: {
      name: appName,
      namespace: NAMESPACE
    },
    spec: {
      ports: [
        {
          name: 'http',
          port,
          protocol: 'TCP',
          targetPort: port
        }
      ],
      selector: {
        app,
        slug: GITHUB_REF_SHORT,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)
}

async function applyConfig(name, obj) {
  const configPath = 'kubernetesConfigs'
  try {
    await execCommand(`mkdir ${configPath}`)
  } catch (e) {}
  const filename = `./${configPath}/${name}.json`
  await writeFile(filename, obj)
}

function writeFile(filePath, json) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(filePath, JSON.stringify(json, null, 2), function (error) {
      if (error) {
        return reject(error)
      } else {
        resolve(true)
      }
    })
  })
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, function (error, stdout, stderr) {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

function envSwitch(env, prod, staging) {
  return env === 'production' ? prod : staging
}
