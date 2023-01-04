const {setFailed, warning} = require('@actions/core')
const axios = require('axios')
const {GITHUB_REF_SHORT} = require('./notify-utils')

if (!process.env.JIRA_BASE_URL) throw new Error('Please specify JIRA_BASE_URL env')
if (!process.env.JIRA_API_TOKEN) throw new Error('Please specify JIRA_API_TOKEN env')
if (!process.env.JIRA_USER_EMAIL) throw new Error('Please specify JIRA_USER_EMAIL env')

const config = {
  baseUrl: process.env.JIRA_BASE_URL,
  token: process.env.JIRA_API_TOKEN,
  email: process.env.JIRA_USER_EMAIL
}

function getJiraCommentBody() {
  const {BRANCH_NAME, PR_NUMBER} = process.env

  const urls = [
    {
      name: 'Website',
      url: `https://${GITHUB_REF_SHORT}.wepublish.dev`
    },
    {
      name: 'Editor',
      url: `https://editor.${GITHUB_REF_SHORT}.wepublish.dev`
    },
    {
      name: 'Public API',
      url: `https://api.${GITHUB_REF_SHORT}.wepublish.dev`
    },
    {
      name: 'Private API',
      url: `https://api.${GITHUB_REF_SHORT}.wepublish.dev/admin`
    },
    {
      name: 'Media',
      url: `https://media.${GITHUB_REF_SHORT}.wepublish.dev`
    }
  ]

  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: `PR ${PR_NUMBER}`,
            marks: [
              {
                type: 'link',
                attrs: {
                  href: `https://github.com/wepublish/wepublish/pull/${PR_NUMBER}`
                }
              }
            ]
          },
          {type: 'text', text: ' with branch '},
          {
            type: 'text',
            text: `${BRANCH_NAME}`,
            marks: [{type: 'code'}]
          },
          {type: 'text', text: ' has been deployed to:'}
        ]
      },
      {
        type: 'bulletList',
        content: urls.map(({name, url}) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: name,
                  marks: [
                    {
                      type: 'link',
                      attrs: {
                        href: url
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }))
      }
    ]
  }
}

function getJiraTicket() {
  const {BRANCH_NAME, PR_TITLE, PR_BODY} = process.env

  const [branchIssue] = BRANCH_NAME.match(/WPC-[0-9]+/gim) || []
  const [prTitleIssue] = PR_TITLE.match(/WPC-[0-9]+/gim) || []
  const [prBodyIssue] = PR_BODY.match(/WPC-[0-9]+/gim) || []

  const issue = branchIssue ?? prTitleIssue ?? prBodyIssue

  return issue?.toLocaleUpperCase()
}

async function main() {
  const issue = getJiraTicket()

  if (!issue) {
    warning('No Jira issue found, skipping!')
    return
  }

  const httpOptions = {
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.email}:${config.token}`).toString('base64')}`
    }
  }

  const {
    data: {comments}
  } = await axios.get(`${config.baseUrl}/rest/api/3/issue/${issue}/comment`, httpOptions)

  const oldComment = comments.find(({author: {emailAddress}}) => emailAddress === config.email)

  if (oldComment?.id) {
    await axios.put(
      `${config.baseUrl}/rest/api/3/issue/${issue}/comment/${oldComment.id}`,
      {body: getJiraCommentBody()},
      httpOptions
    )
  } else {
    await axios.post(
      `${config.baseUrl}/rest/api/3/issue/${issue}/comment`,
      {body: getJiraCommentBody()},
      httpOptions
    )
  }
}

main().catch(error => {
  setFailed(error.response?.data ?? error)
})
