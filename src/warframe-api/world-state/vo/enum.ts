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

/**
 * 시간대가 게임플레이를 바꾸는 오픈월드만. 지구(pc/earthCycle)는 조명만 바뀌어 뺐다.
 * 값이 그대로 `pc/{name}Cycle` 경로가 된다.
 */
export enum CycleName {
  Cetus = 'cetus',
  Vallis = 'vallis',
  Cambion = 'cambion',
}

/**
 * 오픈월드 이름 + 행성. 허브 이름(Cetus/Fortuna/Necralisk)은 뺐다 — 셋을 다 적으면 길다.
 * 행성을 붙이는 이유: 오픈월드 이름보다 "지구/금성/데이모스"로 기억하는 사람이 많다.
 */
export const CycleLabel = {
  [CycleName.Cetus]: 'Plains of Eidolon (Earth)',
  [CycleName.Vallis]: 'Orb Vallis (Venus)',
  [CycleName.Cambion]: 'Cambion Drift (Deimos)',
};
