import { ActionPanel, Color, ImageMask, List, OpenInBrowserAction, showToast, ToastStyle, getLocalStorageItem, setLocalStorageItem } from "@raycast/api";
import useSWR, { SWRConfig } from "swr";
import { Schema } from "bitbucket";

import { getRepositories } from "../../queries";
import { Repository } from "./interface";
import { icon } from "../../helpers/icon";
import { cacheConfig, REPOSITORIES_CACHE_KEY } from "../../helpers/cache";
import { ShowPipelinesActions } from "./actions";
import { useEffect, useState } from "react";

const RECENTS_CACHE_KEY = 'RECENTS3';

export function SearchRepositories() {
  return (
    <SWRConfig value={cacheConfig}>
      <SearchList />
    </SWRConfig>
  );
}

async function setMostRecent(str: string) {
  let resp = await getLocalStorageItem(RECENTS_CACHE_KEY);
  if (resp) {
    resp = JSON.parse(resp)
    resp.push(str)
    await setLocalStorageItem(RECENTS_CACHE_KEY, JSON.stringify(resp))
  } else {
    await setLocalStorageItem(RECENTS_CACHE_KEY, JSON.stringify([str]))
  }
}

function SearchList(): JSX.Element {
  const [recentRepos, setRecentRepos] = useState([])
  const { data, error, isValidating } = useSWR(REPOSITORIES_CACHE_KEY, getRepositories);

  useEffect(() => {
    async function fetchMostRecent() {
      let resp = await getLocalStorageItem(RECENTS_CACHE_KEY);
      console.log(resp)
      console.log(typeof resp)
      if (resp) {
        resp = JSON.parse(resp)
        setRecentRepos(resp)
      }
    }

    fetchMostRecent()
  }, []);

  if (error) {
    showToast(ToastStyle.Failure, "Failed loading repositories", error.message);
  }

  return (
    <List isLoading={isValidating} searchBarPlaceholder="Search by name...">
      <List.Section title="Recently Used Repositories" subtitle={recentRepos?.length.toString()}>
        {recentRepos?.map((repo: Repository) => (
          <SearchListItem key={repo.uuid} repo={repo} />
        ))}
      </List.Section>
      <List.Section title="Repositories" subtitle={data?.length.toString() + ' ' + recentRepos?.length}>
        {data?.map(toRepository).map((repo: Repository) => (
          <SearchListItem key={repo.uuid} repo={repo} />
        ))}
      </List.Section>
    </List>
  );
}

function toRepository(repo: Schema.Repository): Repository {
  return {
    name: repo.name as string,
    uuid: repo.uuid as string,
    slug: repo.slug as string,
    fullName: repo.full_name as string,
    avatarUrl: repo.links?.avatar?.href as string,
    description: (repo.description as string) || "",
    url: `https://bitbucket.org/${repo.full_name}`,
  };
}

function SearchListItem({ repo }: { repo: Repository }): JSX.Element {
  return (
    <List.Item
      title={repo.name}
      subtitle={repo.description}
      icon={{ source: repo.avatarUrl, mask: ImageMask.RoundedRectangle }}
      actions={
        <ActionPanel>
          <ActionPanel.Section title="Browser actions">
            <OpenInBrowserAction
              title="Open Repository in Browser"
              url={repo.url}
              icon={{ source: icon.code, tintColor: Color.PrimaryText }}
              onOpen={ () => { setMostRecent(repo) } }
            />
            <OpenInBrowserAction
              title="Open Branches in Browser"
              url={repo.url + "/branches"}
              icon={{ source: icon.branch, tintColor: Color.PrimaryText }}
            />
            <OpenInBrowserAction
              title="Open Pull Requests in Browser"
              url={repo.url + "/pull-requests"}
              icon={{ source: icon.pr, tintColor: Color.PrimaryText }}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
            <OpenInBrowserAction
              title="Open Pipelines in Browser"
              url={repo.url + "/addon/pipelines/home"}
              icon={{ source: icon.pipeline.self, tintColor: Color.PrimaryText }}
            />
          </ActionPanel.Section>
          <ActionPanel.Section title="Details">
            <ShowPipelinesActions repo={repo} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
