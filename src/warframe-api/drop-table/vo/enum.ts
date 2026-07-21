export enum CacheKey {
  DropTable = 'drop-table',
}

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
}
