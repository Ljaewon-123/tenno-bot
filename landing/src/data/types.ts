// 컴포넌트와 데이터가 서로 참조할 때 타입만 공유하는 자리.
// data/*는 components/*를 import하면 안 된다(컴포넌트→데이터 단방향) — 그런데 Chip 톤이나
// 네비/푸터 링크 모양은 둘 다한테 필요해서, 그 타입만 여기 두고 양쪽이 가져다 쓴다.

export type ChipTone = 'intel' | 'loot' | 'ops' | 'comms' | 'squad' | 'common' | 'uncommon' | 'rare' | 'muted';

export interface FooterLink {
  href: string;
  label: string;
}

export interface NavLink {
  href: string;
  label: string;
}
