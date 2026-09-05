import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
} from 'discord.js';
import { bold, subtext, title, truncate } from './markdown';
import { Accent, LIMIT } from './types';

/**
 * 없는 값을 그대로 넘겨도 된다 — 걸러져 사라진다.
 * API 응답은 필드가 제각각이라 "있는 것만 순서대로 쌓는" 게 유일한 안전책이다.
 */
type Line = string | false | null | undefined;

type Component =
  | TextDisplayBuilder
  | SectionBuilder
  | SeparatorBuilder
  | MediaGalleryBuilder
  | ActionRowBuilder<ButtonBuilder>;
type Child = Component | false | null | undefined;

const present = <T>(values: (T | false | null | undefined)[]) =>
  values.filter((value): value is T => Boolean(value));

/** 줄 묶음 하나. 남는 줄이 없으면 컴포넌트를 아예 만들지 않는다 */
export const text = (...values: Line[]) => {
  const content = present(values).join('\n');
  return content
    ? new TextDisplayBuilder().setContent(truncate(content, LIMIT.content))
    : undefined;
};

/**
 * 오른쪽에 썸네일(url) 또는 버튼을 붙인 줄 묶음.
 * 액세서리 없는 Section은 API가 거절하므로 그때는 평범한 text로 떨어진다.
 */
export const section = (
  accessory: string | ButtonBuilder | undefined,
  ...values: Line[]
) => {
  const body = text(...values);
  if (!body || !accessory) return body;

  const built = new SectionBuilder().addTextDisplayComponents(body);
  return typeof accessory === 'string'
    ? built.setThumbnailAccessory(new ThumbnailBuilder().setURL(accessory))
    : built.setButtonAccessory(accessory);
};

/** 큰 이미지. 모드 카드처럼 세로로 긴 그림은 80px 썸네일에 넣으면 읽히지 않는다 */
export const image = (url?: string) =>
  url
    ? new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(url),
      )
    : undefined;

/** 구분선. 계층·순서는 번호 이모지가 아니라 이걸로 표현한다 */
export const divider = (large = false) =>
  new SeparatorBuilder().setSpacing(
    large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small,
  );

export const button = (
  customId: string,
  label: string,
  style: ButtonStyle = ButtonStyle.Secondary,
  // 정원 마감·빈 파티처럼 "지금은 누르면 안 되는" 상태를 표현하는 유일한 수단
  disabled = false,
) =>
  new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);

/** 위키 등 외부 링크. 상호작용이 없어 customId가 없다 */
export const linkButton = (label: string, url: string) =>
  new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(label).setURL(url);

export const buttons = (
  ...list: (ButtonBuilder | false | null | undefined)[]
) => {
  const kept = present<ButtonBuilder>(list);
  return kept.length
    ? new ActionRowBuilder<ButtonBuilder>().addComponents(kept)
    : undefined;
};

/**
 * 헤더 + 목록. 항목 0개인 그룹은 만들지 않고, 넘치는 만큼은 "…and N more"로 접는다 —
 * 목록 길이는 API가 주는 대로라 접지 않으면 40개·4000자 한도를 목록 하나가 뚫는다.
 */
export const group = (name: string, items: Line[], max = 3) => {
  const kept = present<string>(items);
  if (!kept.length) return undefined;

  const hidden = kept.length - max;
  return text(
    bold(`${name} (${kept.length})`),
    ...kept.slice(0, max),
    hidden > 0 && subtext(`…and ${hidden} more`),
  );
};

/**
 * 40개 한도는 중첩까지 합산한다 — 버튼 5개짜리 행은 1개가 아니라 6개다.
 * 자식 수만 세면 세다가 통과하고 서버가 메시지를 거절한다.
 */
const size = (child: Component) => {
  if (child instanceof ActionRowBuilder) return 1 + child.components.length;
  if (child instanceof MediaGalleryBuilder) return 1 + child.items.length;
  // Section = 자기 자신 + TextDisplay 하나 + 액세서리 하나
  if (child instanceof SectionBuilder) return 3;
  return 1;
};

/** 컨테이너 1개 = 메시지 1개. 자식은 넘긴 순서대로 쌓인다 */
export const container = (accent: Accent, ...children: Child[]) => {
  const kept = present<Component>(children);

  // 한도를 넘기면 메시지가 통째로 거절된다 — 넘친 만큼은 버리되 버렸다는 사실은 남긴다
  const fitted: Component[] = [];
  let used = 0;
  for (const child of kept) {
    used += size(child);
    if (used > LIMIT.components - 1) break; // 마지막 한 칸은 안내용으로 비워둔다
    fitted.push(child);
  }
  if (fitted.length < kept.length)
    fitted.push(
      new TextDisplayBuilder().setContent(
        subtext(`${kept.length - fitted.length} more hidden`),
      ),
    );

  return new ContainerBuilder()
    .setAccentColor(accent)
    .spliceComponents(0, 0, ...fitted);
};

/** 빈 상태·에러는 어느 커맨드에서 나오든 같은 모양이라 즉시 구분된다 */
const notice = (
  accent: Accent,
  headline: string,
  reason: string,
  hint?: string,
) => container(accent, text(title(headline), reason, hint && subtext(hint)));

/** 항목 0개. 사과문이 아니라 안내로 쓴다 — 이게 기본 화면인 커맨드도 있다 */
export const emptyState = (headline: string, reason: string, hint?: string) =>
  notice(Accent.Muted, headline, reason, hint);

export const errorState = (headline: string, reason: string, hint?: string) =>
  notice(Accent.Error, headline, reason, hint);

/**
 * 보낼 수 있는 형태로 감싼다. 플래그를 빼면 컴포넌트가 통째로 무시되고,
 * 이 플래그가 붙으면 content·embeds를 같이 못 보낸다.
 */
export const payload = (view: ContainerBuilder, ephemeral = false) => ({
  components: [view],
  flags: ephemeral
    ? MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    : MessageFlags.IsComponentsV2,
});
