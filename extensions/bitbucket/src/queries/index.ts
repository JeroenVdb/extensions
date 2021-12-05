import { Bitbucket } from 'bitbucket'
import { preferences } from "../helpers/preferences";

const clientOptions = {
  baseUrl: 'https://api.bitbucket.org/2.0',
  auth: {
    username: preferences.accountName,
    password: preferences.appPassword,
  },
  notice: false
}

const defaults = {
  workspace: preferences.workspace,
}

const bitbucket = new Bitbucket(clientOptions)

export async function getRepositories(): Promise<any> {
  return await bitbucket.repositories.list({
    ...defaults,
    pagelen: 50,
    sort: '-updated_on',
  })
}

export async function pipelinesGetQuery(repoSlug: string, pageNumber: number): Promise<any> {
  return await bitbucket.pipelines.list({
    ...defaults,
    repo_slug: repoSlug,
    pagelen: 15,
    page: pageNumber + '',
    sort: '-created_on',
    // https://developer.atlassian.com/cloud/bitbucket/rest/intro/#fields-parameter-syntax
    // "+": Pulling in additional fields not normally returned by an endpoint, while still getting all the default fields
    fields: `
      +values.target.commit.message,
      +values.target.selector.type+values.target.selector.pattern+values.target.commit.summary.html,
      +values.target.*,
      +values.*,
      +page,
      +size,
    `.replace(/(\r\n|\n|\r| )/gm, "")
  })
}

export async function getCommitNames(repoSlug: string): Promise<any> {
  return await bitbucket.pipelines.list({
    ...defaults,
    pagelen: 20,
    sort: '-created_on',
    repo_slug: repoSlug
  })
}

export async function getMyOpenPullRequests(): Promise<any> {
  return await bitbucket.pullrequests.listPullrequestsForUser({
    ...defaults,
    pagelen: 20,
    sort: '-created_on',
    selected_user: preferences.accountName,
    // fields: `values.uuid,
    //   values.build_number,
    //   values.state,
    //   values.creator.links.avatar.href,
    //   values.trigger.name,
    //   values.target.commit
    // `.replace(/(\r\n|\n|\r| )/gm, "")
  })
}

