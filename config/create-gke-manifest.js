const fs = require('fs')
const { spawn, exec } = require('child_process')
try {
  require('dotenv').config()
} catch (e) { }

let {
  GITHUB_SHA,
  GITHUB_REPOSITORY,
  GITHUB_REF,
  PROJECT_ID
} = process.env

const ENVIRONMENT_NAME = 'production'
/*if (GITHUB_REF === 'refs/heads/production' || GITHUB_REF === 'production') {
  ENVIRONMENT_NAME = 'production'
}*/
const GOOGLE_REGISTRY_HOST_NAME = 'eu.gcr.io'
const NAMESPACE = 'wepublish'

const domain = 'demo.wepublish.media'
const domainCn = envSwitch(ENVIRONMENT_NAME, `${domain}`, `staging.website.${domain}`)
const domainSan = envSwitch(
  ENVIRONMENT_NAME,
  `www.${domain}`,
  'staging.website.34.65.204.205.nip.io'
)

const domainMedia = envSwitch(ENVIRONMENT_NAME, `media.${domain}`, `staging.media.${domain}`)
const domainAPI = envSwitch(ENVIRONMENT_NAME, `api.${domain}`, `staging.api.${domain}`)
const domainEditor = envSwitch(ENVIRONMENT_NAME, `editor.${domain}`, `staging.editor.${domain}`)


main().catch(e => {
  process.stderr.write(e.toString())
  process.exit(1)
})

async function main() {
  await applyNamespace()
  await applyWebsite()
  await applyMediaServer()
  await applyApiServer()
  await applyEditor()
  await applyMongo()
}

async function applyNamespace() {
  let namespace = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
      name: NAMESPACE,
      labels: {
        name: NAMESPACE
      }
    }
  }
  await applyConfig('namespace', namespace)
}


async function applyWebsite() {
  const servicePort = 5000
  const app = 'website'
  const appName = `${app}-${ENVIRONMENT_NAME}`

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
        app: app,
        release: ENVIRONMENT_NAME
      },
      sessionAffinity: 'None',
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  function getRule(host) {
    return {
      host: host,
      http: {
        paths: [
          {
            backend: {
              serviceName: appName,
              servicePort: servicePort
            },
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

  let ingress = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '1m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        'cert-manager.io/cluster-issuer': 'letsencrypt-production'
      }
    },
    spec: {
      rules: rules,
      tls: [
        {
          hosts: hosts,
          secretName: `${appName}-tls`
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)

  const image = `${GOOGLE_REGISTRY_HOST_NAME}/${PROJECT_ID}/${GITHUB_REPOSITORY}/website:${GITHUB_SHA}`
  // Info Resources: https://github.com/kubernetes/community/blob/master/contributors/design-proposals/node/resource-qos.md
  const deployment = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: app,
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
            app: app,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: image,
              env: [
                {
                  name: 'NODE_ENV',
                  value: `production`
                },
                {
                  name: 'HOST_ENV',
                  value: envSwitch(ENVIRONMENT_NAME, 'production', 'staging')
                },
                {
                  name: 'CANONICAL_HOST',
                  value: envSwitch(
                    ENVIRONMENT_NAME,
                    'https://demo.wepublish.media',
                    'https://staging.website.bajour.ch'
                  )
                },
                {
                  name: 'API_URL',
                  value: `https://${domainAPI}`
                },
                {
                  name: 'ALLOWED_HOSTS',
                  value: `${domainCn},${domainSan}`
                },
                {
                  name: 'ADDRESS',
                  value: '0.0.0.0'
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
                  memory: envSwitch(ENVIRONMENT_NAME, '128Mi', '256Mi')
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
  const image = `${GOOGLE_REGISTRY_HOST_NAME}/${PROJECT_ID}/${GITHUB_REPOSITORY}/media:${GITHUB_SHA}`
  const app = 'media'
  const appName = `${app}-${ENVIRONMENT_NAME}`
  const appPort = 3004

  const deployment = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: app,
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
            app: app,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: image,
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
                  value: "1"
                },
                {
                  name: 'TOKEN',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'wepublish-secrets',
                      key: 'media_server_token'
                    }
                  }
                },
                {
                  name: 'ADDRESS',
                  value: '0.0.0.0'
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
              gcePersistentDisk: {
                fsType: 'ext4',
                pdName: envSwitch(
                  ENVIRONMENT_NAME,
                  'wepublish-media-production',
                  'wepublish-media-staging'
                )
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
        app: app,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  let ingress = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '20m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        'cert-manager.io/cluster-issuer': 'letsencrypt-production'
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
                  serviceName: appName,
                  servicePort: appPort
                },
                path: '/'
              }
            ]
          }
        }
      ],
      tls: [
        {
          hosts: [domainMedia],
          secretName: `${appName}-tls`
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)
}

async function applyApiServer() {
  const image = `${GOOGLE_REGISTRY_HOST_NAME}/${PROJECT_ID}/${GITHUB_REPOSITORY}/api:${GITHUB_SHA}`
  const app = 'api'
  const appName = `${app}-${ENVIRONMENT_NAME}`
  const appPort = 3005

  const deployment = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: app,
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
            app: app,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: image,
              env: [
                {
                  name: 'NODE_ENV',
                  value: `production`
                },
                {
                  name: 'MEDIA_SERVER_URL',
                  value: `https://${domainMedia}`
                },
                {
                  name: 'MEDIA_ADDRESS',
                  value: '${domainMedia}'
                },
                {
                  name: 'MEDIA_PORT',
                  value: '443'
                },
                {
                  name: 'ADDRESS',
                  value: '0.0.0.0'
                },
                {
                  name: 'PORT',
                  value: '3005'
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
                  name: 'MONGO_URL',
                  value: envSwitch(
                    ENVIRONMENT_NAME,
                    'mongodb://mongo-production:27017/wepublish',
                    'mongodb://mongo-staging:27017/wepublish'
                  )
                },
                {
                  name: 'MONGO_LOCALE',
                  value: 'de'
                },
                {
                  name: 'MEDIA_SERVER_TOKEN',
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
        app: app,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  let ingress = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '10m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        'cert-manager.io/cluster-issuer': 'letsencrypt-production'
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
                  serviceName: appName,
                  servicePort: appPort
                },
                path: '/'
              }
            ]
          }
        }
      ],
      tls: [
        {
          hosts: [domainAPI],
          secretName: `${appName}-tls`
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)
}

async function applyEditor() {
  const image = `${GOOGLE_REGISTRY_HOST_NAME}/${PROJECT_ID}/${GITHUB_REPOSITORY}/editor:${GITHUB_SHA}`
  const app = 'editor'
  const appName = `${app}-${ENVIRONMENT_NAME}`
  const appPort = 3006

  const deployment = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: app,
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
            app: app,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: image,
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
                  name: 'PORT',
                  value: '3006'
                },{
                  name: 'ADDRESS',
                  value: '0.0.0.0'
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
        app: app,
        release: ENVIRONMENT_NAME
      },
      type: 'ClusterIP'
    }
  }
  await applyConfig(`service-${app}`, service)

  let ingress = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      },
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
        'nginx.ingress.kubernetes.io/proxy-body-size': '20m',
        'nginx.ingress.kubernetes.io/proxy-read-timeout': '30',
        'cert-manager.io/cluster-issuer': 'letsencrypt-production'
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
                  serviceName: appName,
                  servicePort: appPort
                },
                path: '/'
              }
            ]
          }
        }
      ],
      tls: [
        {
          hosts: [domainEditor],
          secretName: `${appName}-tls`
        }
      ]
    }
  }
  await applyConfig(`ingress-${app}`, ingress)
}

async function applyMongo() {
  const app = 'mongo'
  const port = 27017
  const appName = `${app}-${ENVIRONMENT_NAME}`

  const deployment = {
    apiVersion: 'extensions/v1beta1',
    kind: 'Deployment',
    metadata: {
      name: appName,
      namespace: NAMESPACE,
      labels: {
        app: app,
        release: ENVIRONMENT_NAME
      }
    },
    spec: {
      replicas: 1,
      selector: {
        matchLabels: {
          app: app,
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
            app: app,
            release: ENVIRONMENT_NAME
          }
        },
        spec: {
          containers: [
            {
              name: appName,
              image: 'mongo:4.2.3-bionic',
              env: [],
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
                  name: 'mongo-volume',
                  mountPath: '/data/db'
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
              name: 'mongo-volume',
              gcePersistentDisk: {
                fsType: 'ext4',
                pdName: envSwitch(
                  ENVIRONMENT_NAME,
                  'wepublish-mongo-production',
                  'wepublish-mongo-staging'
                )
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
          port: port,
          protocol: 'TCP',
          targetPort: port
        }
      ],
      selector: {
        app: app,
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
  } catch (e) { }
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
