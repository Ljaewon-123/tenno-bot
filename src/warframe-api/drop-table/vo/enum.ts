/** DropSource.category — all.json의 섹션을 검색 관점으로 묶은 분류 */
export enum DropCategory {
  /** missionRewards */
  Mission = 'mission',
  /** relics */
  Relic = 'relic',
  /** transientRewards (레일잭 등 특수 목표) */
  Transient = 'transient',
  /** modLocations + blueprintLocations (몹 드랍, metadata.type으로 구분) */
  Enemy = 'enemy',
  /** sortieRewards */
  Sortie = 'sortie',
  /** keyRewards */
  Key = 'key',
  /** cetus/solaris/deimos/zariman/entratiLab/hex 바운티 */
  Bounty = 'bounty',
  /** syndicates */
  Syndicate = 'syndicate',
  /** resource/sigil/additionalItemByAvatar */
  Avatar = 'avatar',
  /** 바로 키티어 상점. all.json에 없어 @wfcd/items에서 채운다 — 확률이 아니라 두캇 값이다 */
  Trader = 'trader',
}

/** customId로 돌아온 값. 우리가 심은 것이지만 구버전 메시지의 버튼도 눌린다 */
export const isDropCategory = (value: string): value is DropCategory =>
  (Object.values(DropCategory) as string[]).includes(value);
