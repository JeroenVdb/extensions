import {
  ActionPanel,
  CopyToClipboardAction,
  List,
  OpenInBrowserAction,
  showToast,
  ToastStyle,
  randomId,
  PushAction,
  Detail,
  ImageMask,
  FormTextField,
  Icon,
  ListItem,
  Color
} from "@raycast/api";
import { useState, useEffect, useRef } from "react";

import { pullRequestsGetQuery } from "./queries";
import { PullRequest } from "./interface";
import { Json } from "../../helpers/types";

interface State {
  pullRequests?: PullRequest[];
  error?: Error;
}

export function SearchPullRequests(): JSX.Element {
  const [state, setState] = useState<State>({});

  useEffect(() => {
    async function fetchPRs() {
      try {
        const response = await pullRequestsGetQuery()

        if (!response.ok) return Promise.reject(response.statusText);

        const prsJson = (await response.json()).values as Json[];

        const prs = prsJson.map((pr: any) => {
          console.log(pr);
          return {
            id: pr.id as number,
            title: pr.title as string,
            repo: {
              name: pr.destination.repository.name as string,
              fullName: pr.destination.repository.full_name as string,
            },
            commentCount: pr.comment_count as number,
            author: {
              url: pr.author.links.avatar.href as string,
              nickname: pr.author.nickname as string
            }
          };
        });
        setState({ pullRequests: prs });
      } catch (error) {
        setState({ error: error instanceof Error ? error : new Error("Something went wrong") });
      }
    }

    fetchPRs();
  }, []);

  if (state.error) {
    showToast(ToastStyle.Failure, "Failed loading repositories", state.error.message);
  }

  return (
    <List isLoading={!state.pullRequests && !state.error} searchBarPlaceholder="Search by name...">
      <List.Section title="Open Pull Requests" subtitle={state.pullRequests?.length + ""}>
        {state.pullRequests?.map((pr) => (
          <List.Item
            key={pr.id}
            title={pr.title}
            subtitle={pr.repo?.fullName}
            accessoryTitle={`${pr.commentCount} 💬  ·  Created by ${pr.author.nickname}`}
            accessoryIcon={{ source: pr.author.url, mask: ImageMask.Circle }}
            icon={{ source: 'icon-pr.png', tintColor: Color.PrimaryText }}
            actions={
              <ActionPanel>
                <ActionPanel.Section>

                  <OpenInBrowserAction
                    title="Open PR in Browser"
                    url={`https://bitbucket.org/${pr.repo.fullName}/pull-requests/${pr.id}`}
                  />

                </ActionPanel.Section>
              </ActionPanel>

            }
          />
        ))}
      </List.Section>
    </List>
  );
}