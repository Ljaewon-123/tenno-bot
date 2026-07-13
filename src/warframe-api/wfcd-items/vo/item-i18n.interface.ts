export interface ItemAbility {
  uniqueName: string;
  name: string;
  description: string;
  imageName: string;
}

export interface ItemLevelStat {
  stats: string[];
}

export interface ItemI18n {
  name: string;
  description: string;
  passiveDescription?: string;
  abilities?: ItemAbility[];
  trigger?: string;
  systemName?: string;
  levelStats: ItemLevelStat[];
}
