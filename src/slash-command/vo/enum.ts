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
