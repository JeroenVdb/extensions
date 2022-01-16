import { getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from "@raycast/api";
import { Repository } from "../components/repository/interface";

export class MostRecent {
  mostRecentCacheKey: string;

  constructor(cacheKey: string) {
    this.mostRecentCacheKey = cacheKey
    this.getMostRecent = this.getMostRecent.bind(this)
  }

  async addMostRecent(repo: Repository): Promise<void> {
    const mostRecents = await this.getMostRecent()
    mostRecents.unshift(repo)
    await setLocalStorageItem(this.mostRecentCacheKey, JSON.stringify(mostRecents))
  }

  async getMostRecent(): Promise<Array<Repository>> {
    const mostRecentsDataItem = await getLocalStorageItem(this.mostRecentCacheKey);
    let mostRecents: Array<Repository> = [];

    if (typeof mostRecentsDataItem !== 'string') {
      return mostRecents;
    }

    mostRecents = JSON.parse(mostRecentsDataItem);
    mostRecents = this.trimMostRecents(mostRecents, 5);
    mostRecents = this.removeDuplicates(mostRecents);

    return mostRecents;
  }

  async clearMostRecent(): Promise<void> {
    await removeLocalStorageItem(this.mostRecentCacheKey);
  }

  private removeDuplicates(arr: Array<Repository>) {
    return [...new Map(arr.map(item => [item['uuid'], item])).values()]
  }

  private trimMostRecents(arr: Array<Repository>, amount = 5) {
    arr.splice(amount);
    return arr;
  }
}
