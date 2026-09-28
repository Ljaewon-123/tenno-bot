export enum PartyStatus {
  OPEN = 'open',
  CLOSE = 'close',
}

export enum PartyVisibility {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  CLAN = 'clan',
}

/** 접근 제어가 아니라 호스트 자진신고 라벨이다 — Discord가 친구/클랜 관계를 알려주지 않는다 */
export const PartyVisibilityLabel: Record<PartyVisibility, string> = {
  [PartyVisibility.PUBLIC]: 'Public',
  [PartyVisibility.FRIENDS]: 'Friends only',
  [PartyVisibility.CLAN]: 'Clan only',
};
