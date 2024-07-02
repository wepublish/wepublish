const {setFailed, warning, debug, info} = require('@actions/core')
const axios = require('axios')

if (!process.env.JIRA_BASE_URL) throw new Error('Please specify JIRA_BASE_URL env')
if (!process.env.JIRA_API_TOKEN) throw new Error('Please specify JIRA_API_TOKEN env')
if (!process.env.JIRA_USER_EMAIL) throw new Error('Please specify JIRA_USER_EMAIL env')

const config = {
    baseUrl: process.env.JIRA_BASE_URL,
    token: process.env.JIRA_API_TOKEN,
    email: process.env.JIRA_USER_EMAIL
}

function getJiraCommentBody() {
    const {BRANCH_NAME, PR_NUMBER, API_URL, EDITOR_URL, WEBSITE_URL, MEDIA_SERVER_URL, PROJECTS} = process.env

    const urls = [
        {
            name: 'Website',
            url: WEBSITE_URL
        },
        {
            name: 'Editor',
            url: EDITOR_URL
        },
        {
            name: 'Public API',
            url: `${API_URL}/v1`
        },
        {
            name: 'Private API',
            url: `${API_URL}/v1/admin`
        },
        {
            name: 'Media',
            url: MEDIA_SERVER_URL
        }
    ]

    const projects = JSON.parse(PROJECTS);
    for (const project of projects.target) {
        urls.push({
            name: `${project}`,
            url: `https://${project}${PROJECT_URL_SUFFIX}`
        })
    }

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

function getJiraTicket(prefixes) {
    const {BRANCH_NAME, PR_TITLE, PR_BODY} = process.env

    let issues= []

    for(const prefix of prefixes) {
        const regex = new RegExp(`${prefix}-[0-9]+`,'gim')
        const [branchIssue] = BRANCH_NAME.match(regex) || []
        const [prTitleIssue] = PR_TITLE.match(regex) || []
        const [prBodyIssue] = PR_BODY.match(regex) || []

        const issue = branchIssue ?? prTitleIssue ?? prBodyIssue
        if(issue) {
            issues.push(issue.toLocaleLowerCase())
        }
    }
    return issues
}

function getHttpOptions() {
    return {
        headers: {
            Authorization: `Basic ${Buffer.from(`${config.email}:${config.token}`).toString('base64')}`
        }
    }
}

async function getPrefixes() {
    const httpOptions = {
        headers: {
            Authorization: `Basic ${Buffer.from(`${config.email}:${config.token}`).toString('base64')}`
        }
    }

    const data = await axios.get(`${config.baseUrl}/rest/api/2/project/search`, getHttpOptions())
    return data.data.values.map(project => project.key)
}

async function main() {
    const prefixes = await getPrefixes()
    debug(`Found prefixes: ${prefixes}`)
    const issues = getJiraTicket(prefixes)
    debug(`Found issues: ${issues}`)


    if (issues.length === 0) {
        warning('No Jira issue found, skipping!')
        return
    }

    let errors = []
    for (const issue of issues) {
        try {
            const {
                data: {comments}
            } = await axios.get(`${config.baseUrl}/rest/api/3/issue/${issue}/comment`, getHttpOptions())
            const oldComment = comments.find(({author: {emailAddress}}) => emailAddress === config.email)

            if (oldComment?.id) {
                await axios.put(
                  `${config.baseUrl}/rest/api/3/issue/${issue}/comment/${oldComment.id}`,
                  {body: getJiraCommentBody()},
                  getHttpOptions()
                )
                info(`Updated comment for ${issue}`)
            } else {
                await axios.post(
                  `${config.baseUrl}/rest/api/3/issue/${issue}/comment`,
                  {body: getJiraCommentBody()},
                  getHttpOptions()
                )
                info(`Created comment for ${issue}`)
            }
        } catch (e) {
            errors.push(e)
            warning(e.response?.data ?? e)
        }
    }
    if(errors.length === issues.length) {
        throw errors[0]
    }
}

main().catch(error => {
    setFailed(error.response?.data ?? error)
})
