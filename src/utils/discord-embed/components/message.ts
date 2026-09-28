import {
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  StringSelectMenuBuilder,
  type ContainerBuilder,
} from 'discord.js';
import { subtext } from '../markdown';
import { PUSH_MAX_LINES } from '../constants';
import { Accent } from '../types';
import { text } from './card';

export const button = (
  customId: string,
  label: string,
  style: ButtonStyle = ButtonStyle.Secondary,
  disabled = false,
) =>
  new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);

export const select = (
  customId: string,
  placeholder: string,
  options: { label: string; value: string; description?: string }[],
  // 고른 값을 default로 남겨야 placeholder로 되돌아가지 않는다
  current?: string,
) =>
  new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder(placeholder)
    .addOptions(
      options.map((option) => ({
        ...option,
        default: option.value === current,
      })),
    );

export const linkButton = (label: string, url: string) =>
  new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(label).setURL(url);

/** 이 플래그가 없으면 컴포넌트가 무시되고, 있으면 content·embeds를 못 쓴다 */
export const payload = (view: ContainerBuilder) => ({
  components: [view],
  flags: MessageFlags.IsComponentsV2 as const,
});

/** 공용 카드의 버튼이 카드를 갈아끼우면 다른 사람 화면도 바뀐다 — 개인 응답은 이걸로 */
export const ephemeral = (view: ContainerBuilder) => ({
  components: [view],
  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
});

/** 조회 뷰를 발송용으로 바꾼다 — 헤더 줄과 주황 accent가 없으면 조회 결과와 구분되지 않는다 */
export const asPush = (
  view: ContainerBuilder,
  header: string,
  footer?: string,
  path?: string,
) => {
  view
    .setAccentColor(Accent.Soon)
    .spliceComponents(0, 0, text(subtext(header)));

  // 자식 통째로 센다 — TextDisplay 안을 자르면 굵게·목록 같은 마크다운이 반쪽이 난다
  const children = view.toJSON().components as { content?: string }[];
  let lines = 0;
  const cut = children.findIndex((child) => {
    lines += child.content?.split('\n').length ?? 1;
    return lines > PUSH_MAX_LINES;
  });

  if (cut > 0)
    view.spliceComponents(
      cut,
      children.length - cut,
      text(
        subtext(
          ['Trimmed for the alarm', path && `${path} for the full card`]
            .filter(Boolean)
            .join(' · '),
        ),
      ),
    );

  if (footer) view.addTextDisplayComponents(text(subtext(footer)));
  return view;
};
