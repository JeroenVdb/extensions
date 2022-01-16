import { ActionPanel, Color, ImageMask, List, OpenInBrowserAction, showToast, ToastStyle } from "@raycast/api";
import useSWR, { SWRConfig } from "swr";
import { Schema } from "bitbucket";

import { getRepositories } from "../../queries";
import { Repository } from "./interface";
import { icon } from "../../helpers/icon";
import { cacheConfig, RECENTS_CACHE_KEY, REPOSITORIES_CACHE_KEY } from "../../helpers/cache";
import { MostRecent } from "../../queries/mostRecent"
import { ShowPipelinesActions } from "./actions";

const mostRecentRepositories = new MostRecent(RECENTS_CACHE_KEY)

export function SearchRepositories() {
  return (
    <SWRConfig value={cacheConfig}>
      <SearchList />
    </SWRConfig>
  );
}

function SearchList(): JSX.Element {
  const { data, error, isValidating } = useSWR(REPOSITORIES_CACHE_KEY, getRepositories);
  const { data: mostRecentData, error: mostRecentError, isValidating: isValidatingMostRecent } = useSWR(RECENTS_CACHE_KEY, mostRecentRepositories.getMostRecent);

  if (error) {
    showToast(ToastStyle.Failure, "Failed loading repositories", error.message);
  }

  if (mostRecentError) {
    showToast(ToastStyle.Failure, "Failed loading most recently used repositories", mostRecentError.message);
  }

  return (
    <List isLoading={isValidating || isValidatingMostRecent} searchBarPlaceholder="Search by name...">
      <List.Section title="Recently Used Repositories" subtitle={mostRecentData?.length.toString()}>
        {mostRecentData?.map((repo: Repository) => (
          <SearchListItem key={repo.uuid} repo={repo} />
        ))}
      </List.Section>
      <List.Section title="Repositories" subtitle={data?.length.toString()}>
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
              onOpen={ () => { mostRecentRepositories.addMostRecent(repo) } }
              icon={{ source: icon.code, tintColor: Color.PrimaryText }}
            />
            <OpenInBrowserAction
              title="Open Branches in Browser"
              url={repo.url + "/branches"}
              onOpen={ () => { mostRecentRepositories.addMostRecent(repo) } }
              icon={{ source: icon.branch, tintColor: Color.PrimaryText }}
            />
            <OpenInBrowserAction
              title="Open Pull Requests in Browser"
              url={repo.url + "/pull-requests"}
              onOpen={ () => { mostRecentRepositories.addMostRecent(repo) } }
              icon={{ source: icon.pr, tintColor: Color.PrimaryText }}
              shortcut={{ modifiers: ["cmd"], key: "." }}
            />
            <OpenInBrowserAction
              title="Open Pipelines in Browser"
              url={repo.url + "/addon/pipelines/home"}
              onOpen={ () => { mostRecentRepositories.addMostRecent(repo) } }
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
