import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type EmbedBuilder,
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

/** 구분선. 계층·순서는 번호 이모지가 아니라 이걸로 표현한다 */
export const divider = (large = false) =>
  new SeparatorBuilder().setSpacing(
    large ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small,
  );

export const button = (
  customId: string,
  label: string,
  style: ButtonStyle = ButtonStyle.Secondary,
) => new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);

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

/** 컨테이너 1개 = 메시지 1개. 자식은 넘긴 순서대로 쌓인다 */
export const container = (accent: Accent, ...children: Child[]) => {
  const kept = present<Component>(children);
  // 한도를 넘기면 메시지가 통째로 거절된다 — 넘친 만큼은 버리되 버렸다는 사실은 남긴다
  const fitted =
    kept.length > LIMIT.components
      ? [
          ...kept.slice(0, LIMIT.components - 1),
          new TextDisplayBuilder().setContent(
            subtext(`${kept.length - LIMIT.components + 1} more hidden`),
          ),
        ]
      : kept;

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
 * ponytail: 레거시 EmbedBuilder도 받아 넘긴다 — 커맨드를 하나씩 옮기는 동안만. 다 옮기면 분기를 지운다
 */
export const payload = (view: ContainerBuilder | EmbedBuilder) =>
  view instanceof ContainerBuilder
    ? { components: [view], flags: MessageFlags.IsComponentsV2 }
    : { embeds: [view] };
