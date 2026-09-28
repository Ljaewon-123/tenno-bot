import type {
  ActionRowBuilder,
  ButtonBuilder,
  MediaGalleryBuilder,
  SectionBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
} from 'discord.js';

/** 같은 색은 항상 같은 뜻 — 커맨드별로 색을 나누지 않는다 */
export enum Accent {
  /** 기본 · 조회 결과 */
  Default = 0x5865f2,
  /** 임박 · 만료 30분 이내 / 사이클 교체 직전 */
  Soon = 0xfaa61a,
  /** 성공 · 등록·삭제 완료, 파티 정원 마감 */
  Success = 0x57f287,
  /** 에러 · API 실패 / 잘못된 인자 */
  Error = 0xed4245,
  /** 종료·없음 · 빈 상태 / 만료된 이벤트 */
  Muted = 0x4e5058,
}

/** falsy 값은 걸러져 사라진다 — API 응답은 필드가 제각각이다 */
export type Line = string | false | null | undefined;

export type Block =
  | Line
  | {
      heading?: string;
      lines: Line[];
      more?: string;
      /** Section으로 떨어져 오른쪽에 아이콘이 붙는다. Section 하나가 3칸이라 개수는 호출단이 센다 */
      thumbnail?: string;
      /** 줄에 딸린 버튼. accessory는 한 칸이라 thumbnail과 같이 주면 버튼이 이긴다 */
      button?: ButtonBuilder;
    };

export type CardInput = {
  accent?: Accent;
  title: string;
  subtitle?: Line;
  /** 80px. 세로로 긴 그림(모드 카드)은 여기 넣으면 읽히지 않는다 */
  thumbnail?: string;
  /** 두 장이면 2칸 갤러리 — 256px 정사각 아트를 풀폭에 넣으면 뭉갠다 */
  image?: string | string[];
  /** 바깥 배열은 구분선, 안쪽은 빈 줄로 나뉜다 */
  blocks: Block[][];
  buttons?: ButtonBuilder[];
  /** 한 행을 통째로 먹어 버튼과 같은 줄에 못 선다 — 카드당 하나 */
  select?: StringSelectMenuBuilder;
  /** footer는 마크다운이 안 먹어 -# 줄로 대신한다 */
  footer?: Line;
};

export type Child =
  | TextDisplayBuilder
  | SectionBuilder
  | SeparatorBuilder
  | MediaGalleryBuilder
  | ActionRowBuilder<ButtonBuilder>
  | ActionRowBuilder<StringSelectMenuBuilder>;

export type ManageRow = { text: string; button?: ButtonBuilder };

export type PagerInput<T> = {
  key: string;
  items: T[];
  /** 버튼에서 온 값. 문자열·NaN·범위 밖 전부 0페이지로 떨어진다 */
  page?: number;
  sort: string;
  size?: number;
};
