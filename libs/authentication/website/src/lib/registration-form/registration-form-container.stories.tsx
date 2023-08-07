import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {StoryObj} from '@storybook/react'
import {ChallengeDocument, RegisterDocument} from '@wepublish/website/api'
import {RegistrationFormContainer} from './registration-form-container'
import * as registrationFormStories from './registration-form.stories'
import {ApolloError} from '@apollo/client'
import {useUser} from '../session.context'
import {waitFor, within} from '@storybook/testing-library'
import {challenge} from '@wepublish/testing/fixtures/graphql'

export default {
  title: 'Container/Registration Form',
  component: RegistrationFormContainer
}

const registerVariables = {
  name: 'Bar',
  email: 'foobar@email.com',
  challengeAnswer: {
    challengeSolution: '1',
    challengeID: challenge.challengeID
  },
  firstName: 'Foo',
  address: {streetAddress: 'Musterstrasse 1', zipCode: '8047', city: 'Zürich', country: 'Schweiz'},
  password: '12345678'
}

export const Filled: StoryObj = {
  render: function Render(args) {
    const {user} = useUser()

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <RegistrationFormContainer {...args} />
      </>
    )
  },
  args: {
    onRegister: action('onRegister'),
    onChallengeQuery: action('onChallengeQuery')
  },
  play: async ctx => {
    const canvas = within(ctx.canvasElement)
    await waitFor(() => canvas.getByLabelText('Captcha'))

    await registrationFormStories.Filled.play?.(ctx)
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {challenge}
          }
        },
        {
          request: {
            query: RegisterDocument,
            variables: registerVariables
          },
          result: {
            data: {
              registerMember: {
                session: {
                  createdAt: new Date(),
                  expiresAt: new Date(),
                  token: '1234-1234'
                },
                user: {
                  id: '1234-1234',
                  firstName: 'Foo',
                  name: 'Bar',
                  email: 'foobar@example.com',
                  oauth2Accounts: [],
                  paymentProviderCustomers: [],
                  properties: []
                }
              }
            }
          }
        }
      ]
    }
  }
}

export const WithChallengeError: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    onChallengeQuery: action('onChallengeQuery')
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            errors: [new ApolloError({errorMessage: 'Something went wrong.'})]
          }
        },
        {
          request: {
            query: RegisterDocument
          },
          result: {
            data: {}
          }
        }
      ]
    }
  }
}

export const WithRegisterError: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    onChallengeQuery: action('onChallengeQuery')
  },
  play: Filled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {challenge}
          }
        },
        {
          request: {
            query: RegisterDocument,
            variables: registerVariables
          },
          result: {
            errors: [new ApolloError({errorMessage: 'Email already in use.'})]
          }
        },
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {
              challenge: {
                ...challenge,
                challenge: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0,0,200,200"><rect width="100%" height="100%" fill="#ffffff"/><path fill="#7de2af" d="M75.33 119.88L75.33 116.06L83.60 116.16L83.62 89.86L76.98 89.72L77.08 86.85L76.96 86.73Q79.46 86.31 81.28 85.67L81.30 85.69L81.30 85.69Q83.19 85.12 84.64 84.22L84.53 84.11L88.13 84.17L88.22 116.19L95.53 116.11L95.60 119.98L75.31 119.86Z"/><path d="M4 3 C85 105,91 137,182 27" stroke="#dfdf3e" fill="none"/><path d="M17 120 C120 43,121 144,194 20" stroke="#5757da" fill="none"/><path fill="#8cdf70" d="M113.23 120.64L113.21 120.62L113.27 120.68Q107.73 120.57 104.71 115.76L104.64 115.69L104.73 115.78Q101.61 110.87 101.61 101.85L101.63 101.87L101.70 101.94Q101.64 92.86 104.66 88.16L104.81 88.30L104.68 88.18Q107.81 83.58 113.24 83.58L113.27 83.60L113.14 83.48Q118.52 83.49 121.55 88.19L121.53 88.17L121.51 88.15Q124.64 92.96 124.64 101.97L124.61 101.94L124.51 101.85Q124.60 110.95 121.58 115.77L121.47 115.66L121.56 115.75Q118.62 120.66 113.25 120.66ZM113.08 116.80L113.17 116.88L113.23 116.94Q114.77 116.91 116.03 116.05L116.08 116.09L115.92 115.94Q117.27 115.16 118.20 113.34L118.25 113.40L118.21 113.36Q119.16 111.56 119.66 108.73L119.69 108.75L119.63 108.70Q120.17 105.91 120.17 101.99L120.08 101.90L120.15 101.97Q120.18 98.07 119.67 95.27L119.59 95.19L119.65 95.25Q119.18 92.48 118.25 90.72L118.11 90.58L118.12 90.59Q117.28 88.90 116.02 88.06L116.02 88.06L116.04 88.09Q114.64 87.11 113.07 87.11L113.25 87.28L113.12 87.15Q111.56 87.16 110.27 88.00L110.35 88.08L110.41 88.14Q109.07 88.92 108.14 90.69L108.17 90.72L108.07 90.62Q107.24 92.47 106.74 95.27L106.60 95.13L106.65 95.19Q106.17 98.01 106.17 101.93L106.24 102.00L106.18 101.95Q106.16 109.76 108.09 113.31L108.11 113.33L108.09 113.31Q110.07 116.92 113.21 116.92Z"/><path d="M6 44 C99 155,100 189,180 160" stroke="#76dfaa" fill="none"/><path d="M20 44 C98 157,81 46,184 18" stroke="#8be8a2" fill="none"/><path fill="#68a5e3" d="M129.42 97.17L129.37 93.66L153.36 93.62L153.40 97.13L129.48 97.24ZM129.48 109.16L129.49 105.70L153.40 105.59L153.36 109.02L129.49 109.18Z"/><path fill="#aadf75" d="M54.81 114.14L54.73 103.14L44.63 103.23L44.51 99.65L54.75 99.69L54.76 88.78L58.34 88.72L58.40 99.70L68.68 99.79L68.53 103.11L58.43 103.20L58.34 114.03L54.81 114.14Z"/><path d="M18 89 C102 139,112 11,183 24" stroke="#88f1f1" fill="none"/><path fill="#56eb56" d="M170.88 108.90L166.74 108.79L166.76 108.80Q166.34 106.54 166.82 104.78L166.91 104.87L166.99 104.94Q167.30 103.02 168.14 101.54L168.14 101.53L168.29 101.68Q169.10 100.17 170.19 98.88L170.26 98.95L170.21 98.90Q171.29 97.60 172.24 96.34L172.25 96.35L172.30 96.40Q173.17 95.06 173.82 93.77L173.90 93.85L173.74 93.70Q174.39 92.41 174.39 90.89L174.52 91.03L174.48 90.99Q174.38 88.65 173.01 87.05L173.10 87.14L173.16 87.20Q171.67 85.49 168.98 85.49L168.94 85.45L169.09 85.60Q167.17 85.53 165.52 86.40L165.46 86.34L165.55 86.43Q163.95 87.35 162.67 88.86L162.53 88.72L159.87 86.29L159.99 86.42Q161.78 84.39 164.07 83.08L164.03 83.03L164.00 83.00Q166.33 81.72 169.35 81.72L169.25 81.62L169.40 81.76Q173.62 81.62 176.23 84.00L176.39 84.16L176.35 84.12Q178.97 86.52 178.97 90.72L178.96 90.71L178.94 90.69Q178.97 92.57 178.30 94.08L178.26 94.05L178.22 94.01Q177.54 95.50 176.56 96.85L176.65 96.94L176.61 96.90Q175.55 98.17 174.46 99.48L174.57 99.59L174.52 99.55Q173.49 100.92 172.57 102.32L172.43 102.19L172.51 102.27Q171.51 103.58 171.00 105.18L171.16 105.34L171.17 105.35Q170.49 106.76 170.71 108.72L170.82 108.83ZM165.53 117.04L165.65 117.16L165.51 117.02Q165.60 115.49 166.55 114.51L166.57 114.52L166.62 114.57Q167.49 113.51 168.89 113.51L168.95 113.57L168.91 113.53Q170.28 113.50 171.26 114.48L171.36 114.58L171.29 114.51Q172.26 115.48 172.26 117.10L172.36 117.20L172.35 117.19Q172.30 118.66 171.32 119.64L171.29 119.61L171.37 119.69Q170.29 120.57 168.89 120.57L168.89 120.57L168.93 120.60Q167.50 120.58 166.55 119.60L166.64 119.69L166.46 119.51Q165.58 118.60 165.58 117.08Z"/><path fill="#bce594" d="M15.91 115.62L18.08 112.42L18.22 112.56Q19.87 114.27 22.03 115.55L22.05 115.57L21.97 115.50Q24.07 116.73 27.27 116.73L27.27 116.74L27.29 116.76Q30.54 116.76 32.61 114.99L32.61 114.99L32.68 115.07Q34.69 113.23 34.69 110.21L34.69 110.21L34.70 110.22Q34.69 108.65 34.10 107.33L34.10 107.32L34.16 107.38Q33.56 106.05 32.21 105.10L32.23 105.12L32.08 104.97Q30.80 104.08 28.62 103.58L28.57 103.54L28.61 103.57Q26.43 103.07 23.24 103.07L23.24 103.07L23.23 99.53L23.24 99.55Q26.13 99.58 28.07 99.08L28.07 99.08L28.03 99.04Q29.95 98.53 31.15 97.63L31.19 97.67L31.10 97.58Q32.37 96.75 32.87 95.51L32.84 95.48L32.83 95.48Q33.43 94.34 33.43 92.94L33.41 92.91L33.49 92.99Q33.43 90.30 31.78 88.79L31.79 88.81L31.73 88.74Q30.01 87.16 27.15 87.16L27.23 87.24L27.17 87.18Q25.00 87.25 23.13 88.26L23.14 88.27L23.15 88.29Q21.34 89.36 19.72 90.98L19.71 90.97L17.08 87.90L17.11 87.93Q19.34 86.12 21.83 84.86L21.73 84.76L21.71 84.74Q24.29 83.57 27.48 83.57L27.32 83.41L27.49 83.58Q29.75 83.49 31.71 84.10L31.82 84.21L31.68 84.07Q33.72 84.77 35.15 85.92L35.08 85.85L35.07 85.84Q36.58 87.07 37.37 88.75L37.25 88.64L37.36 88.75Q38.18 90.47 38.18 92.65L38.20 92.67L38.07 92.54Q38.11 95.83 36.32 97.90L36.37 97.94L36.27 97.85Q34.55 99.99 31.63 101.11L31.52 101.00L31.72 101.41L31.58 101.28Q33.16 101.63 34.56 102.38L34.69 102.51L34.70 102.52Q36.00 103.18 37.06 104.33L37.08 104.34L37.19 104.45Q38.22 105.57 38.81 107.08L38.72 106.99L38.67 106.94Q39.29 108.48 39.29 110.33L39.43 110.48L39.41 110.45Q39.39 112.78 38.46 114.69L38.43 114.65L38.36 114.58Q37.52 116.57 35.92 117.88L35.90 117.86L35.90 117.87Q34.22 119.09 32.09 119.79L32.10 119.80L32.19 119.89Q30.04 120.57 27.58 120.57L27.51 120.50L27.67 120.67Q25.51 120.63 23.74 120.21L23.71 120.18L23.76 120.22Q21.95 119.76 20.49 119.06L20.55 119.12L20.47 119.04Q19.06 118.38 17.91 117.49L17.94 117.51L17.90 117.48Q16.67 116.50 15.78 115.49L15.80 115.51Z"/></svg>`
              }
            }
          }
        }
      ]
    }
  }
}

export const WithClassName: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    onChallengeQuery: action('onChallengeQuery'),
    className: 'extra-classname'
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {challenge}
          }
        }
      ]
    }
  }
}

export const WithEmotion: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    onChallengeQuery: action('onChallengeQuery'),
    css: css`
      background-color: #eee;
    `
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument
          },
          result: {
            data: {challenge}
          }
        }
      ]
    }
  }
}
