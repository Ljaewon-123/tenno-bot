export enum VoidTier {
  Lith = 'Lith',
  Meso = 'Meso',
  Neo = 'Neo',
  Axi = 'Axi',
  Requiem = 'Requiem',
  Omnia = 'Omnia',
}

export enum Enemy {
  Grineer = 'Grineer',
  Corpus = 'Corpus',
  Infested = 'Infested',
  Sentient = 'Sentient',
  Techrot = 'Techrot',
  Scladra = 'Scladra',
  Murmur = 'Murmur',
  Narmer = 'Narmer',
  Orokin = 'Orokin',
}

export enum ArchonBoss {
  Boreal = 'Archon Boreal',
  Amar = 'Archon Amar',
  Nira = 'Archon Nira',
}

export const ArchonReward = {
  [ArchonBoss.Boreal]: 'Azure',
  [ArchonBoss.Amar]: 'Crimson',
  [ArchonBoss.Nira]: 'Amber',
};

/**
 * 임베드용 CDN imageName. wfcd items에 집정관 본체 이미지가 없어
 * 보스는 모드 세트 헤더(집정관 마스크 엠블럼)로 대신한다.
 */
export const ArchonImage = {
  [ArchonBoss.Boreal]: {
    boss: 'BorealHeader.png',
    shard: 'ArchonShardBoreal.png',
  },
  [ArchonBoss.Amar]: { boss: 'AmarHeader.png', shard: 'ArchonShardAmar.png' },
  [ArchonBoss.Nira]: { boss: 'NiraHeader.png', shard: 'ArchonShardNira.png' },
};

/** 보이드 상인 본인 이미지 — 아이템이 아니라 글리프 이미지를 쓴다 */
export const VOID_TRADER_IMAGE = 'BaroKiteerAvatar.png';
