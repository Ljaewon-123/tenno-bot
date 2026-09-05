import {
  ActionRowBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type ButtonBuilder,
} from 'discord.js';
import { bold, subtext, title as heading, truncate } from '../markdown';
import { Accent, LIMIT } from '../types';

/**
 * 없는 값을 그대로 넘겨도 된다 — 걸러져 사라진다.
 * API 응답은 필드가 제각각이라 "있는 것만 순서대로 쌓는" 게 유일한 안전책이다.
 */
export type Line = string | false | null | undefined;

/** 헤딩 + 목록 + 접힌 개수. 문자열 하나만 넘겨도 된다 */
export type Block = Line | { heading?: string; lines: Line[]; more?: string };

export type CardInput = {
  /** 기본 Accent.Default. 만료가 있으면 accentFor(expiry)를 그대로 넘긴다 */
  accent?: Accent;
  title: string;
  /** 남은 시간 자리 — relative(expiry) */
  subtitle?: Line;
  /** 80px. 세로로 긴 그림(모드 카드)은 여기 넣으면 읽히지 않는다 */
  thumbnail?: string;
  image?: string;
  /**
   * 바깥 배열은 구분선으로, 안쪽은 빈 줄로 나뉜다.
   * 디자인이 쓰는 구분은 이 둘뿐이다 — 소티 미션 3개는 빈 줄, 균열 티어 6개는 구분선.
   */
  blocks: Block[][];
  buttons?: ButtonBuilder[];
  /** 데이터 신선도·단위 표기. footer는 마크다운이 안 먹어 V2에서는 -# 줄이 대신한다 */
  footer?: Line;
};

export type Child =
  | TextDisplayBuilder
  | SectionBuilder
  | SeparatorBuilder
  | MediaGalleryBuilder
  | ActionRowBuilder<ButtonBuilder>;

export const kept = (values: Line[]) =>
  values.filter((value): value is string => Boolean(value));

/** 넘치면 초과분이 잘리는 게 아니라 메시지가 통째로 400으로 거절된다 */
export const text = (content: string) =>
  new TextDisplayBuilder().setContent(truncate(content, LIMIT.content));

/** 계층·순서는 번호 이모지가 아니라 이걸로 표현한다 */
export const divider = () =>
  new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small);

const renderBlock = (block: Block) => {
  if (!block) return '';
  if (typeof block === 'string') return block;
  return kept([
    block.heading && bold(block.heading),
    ...block.lines,
    block.more && subtext(block.more),
  ]).join('\n');
};

const renderGroup = (group: Block[]) =>
  kept(group.map(renderBlock)).join('\n\n');

/**
 * 40개 한도는 중첩까지 합산한다 — 버튼 5개짜리 행은 1개가 아니라 6개다.
 * 자식 수만 세면 세다가 통과하고 서버가 메시지를 거절한다.
 */
const cost = (child: Child) => {
  if (child instanceof ActionRowBuilder) return 1 + child.components.length;
  if (child instanceof MediaGalleryBuilder) return 1 + child.items.length;
  // Section = 자기 자신 + TextDisplay 하나 + 액세서리 하나
  if (child instanceof SectionBuilder) return 3;
  return 1;
};

/** 컨테이너 1개 = 메시지 1개. 넘친 만큼은 버리되 버렸다는 사실은 남긴다 */
export const assemble = (accent: Accent, children: Child[]) => {
  const fitted: Child[] = [];
  let used = 0;
  for (const child of children) {
    used += cost(child);
    if (used > LIMIT.components - 1) break; // 마지막 한 칸은 안내용으로 비워둔다
    fitted.push(child);
  }
  if (fitted.length < children.length)
    fitted.push(
      text(subtext(`${children.length - fitted.length} more hidden`)),
    );

  return new ContainerBuilder()
    .setAccentColor(accent)
    .spliceComponents(0, 0, ...fitted);
};

/**
 * 원형 A(단일 이벤트) · B(그룹 목록) · C(상태 타일).
 * 셋은 슬롯이 같다 — 헤더 / 본문 블록 / 버튼 / -# 푸터. 커맨드마다 다시 그리지 않는다.
 */
export const card = ({
  accent = Accent.Default,
  title,
  subtitle,
  thumbnail,
  image,
  blocks,
  buttons,
  footer,
}: CardInput) => {
  const head = text(
    kept([heading(title), subtitle && subtext(subtitle)]).join('\n'),
  );

  const children: Child[] = [
    // V2에는 썸네일 슬롯이 없다 — Section 우측 액세서리가 유일한 자리다
    thumbnail
      ? new SectionBuilder()
          .addTextDisplayComponents(head)
          .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnail))
      : head,
  ];

  if (image)
    children.push(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(image),
      ),
    );

  for (const group of blocks) {
    const content = renderGroup(group);
    // 항목 0개인 그룹은 구분선까지 통째로 만들지 않는다 — 빈 칸이 남으면 데이터가 빠진 것처럼 읽힌다
    if (content) children.push(divider(), text(content));
  }

  if (buttons?.length)
    children.push(
      divider(),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons),
    );

  if (footer) children.push(text(subtext(footer)));

  return assemble(accent, children);
};
