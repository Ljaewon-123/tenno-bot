import {
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type ContainerBuilder,
} from 'discord.js';
import { subtext } from '../markdown';
import { Accent } from '../types';
import { text } from './card';

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

/**
 * 보낼 수 있는 형태로 감싼다. 플래그를 빼면 컴포넌트가 통째로 무시되고,
 * 이 플래그가 붙으면 같은 메시지에서 content·embeds를 못 쓴다.
 */
export const payload = (view: ContainerBuilder) => ({
  components: [view],
  flags: MessageFlags.IsComponentsV2 as const,
});

/**
 * 누른 사람에게만 보이는 응답. 공용 조회 카드의 버튼은 카드를 갈아끼우면 안 된다 —
 * 같은 메시지를 보는 다른 사람의 화면까지 바뀐다.
 */
export const ephemeral = (view: ContainerBuilder) => ({
  components: [view],
  flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
});

/**
 * 조회 뷰를 알람 발송으로 바꾼다. 사용자가 부른 게 아니므로 맨 윗줄에 왜 이게 왔는지를 먼저 밝히고
 * accent를 주황으로 바꾼다 — 이게 없으면 채널에서 조회 결과와 구분되지 않는다.
 */
export const asPush = (
  view: ContainerBuilder,
  header: string,
  footer?: string,
) => {
  view
    .setAccentColor(Accent.Soon)
    .spliceComponents(0, 0, text(subtext(header)));
  if (footer) view.addTextDisplayComponents(text(subtext(footer)));
  return view;
};
