import * as AWS from 'aws-sdk'
import * as core from '@actions/core'
import * as github from '@actions/github'
import * as path from 'path'
import * as utils from '@actions/utils'
import simpleGit, {SimpleGit} from 'simple-git'

async function getFileCommit(git: SimpleGit, file: string): Promise<string | undefined> {
  const commit = (await git.log({file})).latest

  if (!commit) {
    return
  }

  return commit.hash
}

async function putSDBAttributes(sdb: AWS.SimpleDB, domain, spec: string, attributes: Map<string, string>): Promise<void> {
  const itemName = path.join(github.context.repo.owner, github.context.repo.repo, github.context.ref, spec)
  core.debug(`Writing to SimpleDB domain "${domain}", key "${itemName}": ${attributes}`)

  return new Promise(resolve => {
    for (const [Name, Value] of attributes) {
      sdb.putAttributes({
          DomainName: domain,
          ItemName: itemName,
          Attributes: [
            {
              Name,
              Value,
              Replace: true
            }
          ],
        },
        function (err: AWS.AWSError) {
          if (err) {
            throw new Error(`Error getting package info: ${err.stack}`)
          }
          resolve()
        }
      )
    }
  })
}

async function run(): Promise<void> {
  try {
    const specs = utils.getInputAsArray('spec')
    const sdbDomain = utils.getInputAsString('sdb-domain')

    const workingDir = process.env['GITHUB_WORKSPACE'] ? process.env['GITHUB_WORKSPACE'] : process.cwd()
    const git = simpleGit({baseDir: workingDir})
    const simpleDB = new AWS.SimpleDB()

    for (const spec of specs) {
      const specHash = await getFileCommit(git, spec)
      if (!specHash) {
        core.setFailed(`Failed to retrieve commit hash for "${spec}"`)
        continue
      }
      core.debug(`File commit hash for "${spec}": ${specHash}`)

      await putSDBAttributes(simpleDB, sdbDomain, spec, new Map<string, string>([
        ["commit_sha", specHash],
      ]))
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

void run()
