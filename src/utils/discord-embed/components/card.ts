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
  type StringSelectMenuBuilder,
} from 'discord.js';
import { bold, subtext, title as heading, truncate } from '../markdown';
import dayjs from '@/utils/dayjs';
import type { ConfigType } from 'dayjs';
import { LIMIT, NOTICE_RESERVE } from '../constants';
import {
  Accent,
  type Block,
  type CardInput,
  type Child,
  type Line,
} from '../types';

export const accentFor = (expiry: ConfigType, soonMinutes = 30) => {
  const left = dayjs(expiry).diff(dayjs(), 'minute');
  if (left < 0) return Accent.Muted;
  return left <= soonMinutes ? Accent.Soon : Accent.Default;
};

export const kept = (values: Line[]) =>
  values.filter((value): value is string => Boolean(value));

/** 넘치면 초과분이 잘리는 게 아니라 메시지가 통째로 400으로 거절된다 */
export const text = (content: string) =>
  new TextDisplayBuilder().setContent(truncate(content, LIMIT.content));

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

const groupChildren = (group: Block[]) => {
  const children: Child[] = [];
  let merged: Block[] = [];
  const flush = () => {
    const content = renderGroup(merged);
    merged = [];
    if (content) children.push(text(content));
  };

  for (const block of group) {
    const accessory =
      typeof block === 'object'
        ? (block?.button ?? block?.thumbnail)
        : undefined;
    const content = accessory ? renderBlock(block) : '';
    // 글이 빈 Section은 디스코드가 거절한다 — 액세서리만 남기느니 합치는 쪽으로 떨어뜨린다
    if (!accessory || !content) {
      merged.push(block);
      continue;
    }
    flush();
    const section = new SectionBuilder().addTextDisplayComponents(
      text(content),
    );
    children.push(
      typeof accessory === 'string'
        ? section.setThumbnailAccessory(
            new ThumbnailBuilder().setURL(accessory),
          )
        : section.setButtonAccessory(accessory),
    );
  }
  flush();

  return children;
};

/** 40개 한도는 중첩까지 합산한다 — 버튼 5개짜리 행은 6개다 */
const cost = (child: Child) => {
  if (child instanceof ActionRowBuilder) return 1 + child.components.length;
  if (child instanceof MediaGalleryBuilder) return 1 + child.items.length;
  // Section = 자기 자신 + TextDisplay 하나 + 액세서리 하나
  if (child instanceof SectionBuilder) return 3;
  return 1;
};

/** 4000자는 TextDisplay 하나가 아니라 메시지 합이다 */
const contentLength = (child: Child) => {
  const json = child.toJSON() as {
    content?: string;
    // Section의 본문은 자기 자신이 아니라 자식 TextDisplay에 있다
    components?: { content?: string }[];
  };
  return (
    (json.content?.length ?? 0) +
    (json.components ?? []).reduce(
      (sum, inner) => sum + (inner.content?.length ?? 0),
      0,
    )
  );
};

export const assemble = (accent: Accent, children: Child[]) => {
  const fitted: Child[] = [];
  let used = 0;
  let chars = 0;
  for (const child of children) {
    used += cost(child);
    chars += contentLength(child);
    if (used > LIMIT.components - 1) break;
    if (chars > LIMIT.content - NOTICE_RESERVE) break;
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

export const card = ({
  accent = Accent.Default,
  title,
  subtitle,
  thumbnail,
  image,
  blocks,
  buttons,
  select,
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

  if (image?.length)
    children.push(
      new MediaGalleryBuilder().addItems(
        ...[image]
          .flat()
          .map((url) => new MediaGalleryItemBuilder().setURL(url)),
      ),
    );

  for (const group of blocks) {
    const rendered = groupChildren(group);
    if (rendered.length) children.push(divider(), ...rendered);
  }

  if (buttons?.length)
    children.push(
      divider(),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons),
    );

  if (select)
    children.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    );

  if (footer) children.push(text(subtext(footer)));

  return assemble(accent, children);
};
