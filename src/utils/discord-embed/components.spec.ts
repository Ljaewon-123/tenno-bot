import { ComponentType, MessageFlags } from 'discord.js';
import { describe, expect, it } from 'vitest';
import {
  buttons,
  container,
  divider,
  emptyState,
  group,
  linkButton,
  payload,
  section,
  text,
} from './components';
import { relative, subtext } from './markdown';
import { Accent, LIMIT } from './types';

describe('discord-embed', () => {
  it('없는 값은 컴포넌트를 만들지 않는다', () => {
    expect(text(undefined, false, '')).toBeUndefined();
    expect(group('Requiem', [])).toBeUndefined();
    expect(buttons(undefined, false)).toBeUndefined();
    expect(text('a', undefined, 'b')?.toJSON().content).toBe('a\nb');
  });

  it('썸네일이 없으면 Section 대신 TextDisplay로 떨어진다', () => {
    expect(section(undefined, 'Sortie')?.toJSON().type).toBe(
      ComponentType.TextDisplay,
    );
    expect(section('https://cdn/boss.png', 'Sortie')?.toJSON().type).toBe(
      ComponentType.Section,
    );
  });

  it('그룹은 상위 3줄만 펴고 나머지는 접는다', () => {
    const content = group('Axi', ['a', 'b', 'c', 'd', 'e'])?.toJSON().content;
    expect(content).toBe(`**Axi (5)**\na\nb\nc\n${subtext('…and 2 more')}`);
  });

  it('컨테이너는 빈 자식을 걷어내고 한도를 넘기면 잘라낸다', () => {
    const sparse = container(Accent.Default, text('a'), undefined, divider());
    expect(sparse.toJSON().components).toHaveLength(2);
    expect(sparse.toJSON().accent_color).toBe(Accent.Default);

    const overflow = container(
      Accent.Default,
      ...Array.from({ length: 45 }, (_, index) => text(`${index}`)),
    ).toJSON().components;
    expect(overflow).toHaveLength(LIMIT.components);
    expect(overflow.at(-1)).toMatchObject({
      content: subtext('6 more hidden'),
    });
  });

  it('빈 상태는 제목·이유·안내 한 덩어리다', () => {
    const [body] = emptyState(
      'No active events',
      'Nothing is live right now.',
      'Use /notification on event:events',
    ).toJSON().components;
    expect(body).toMatchObject({
      type: ComponentType.TextDisplay,
      content:
        '## No active events\nNothing is live right now.\n-# Use /notification on event:events',
    });
  });

  it('컨테이너는 V2 플래그와 함께 나간다', () => {
    expect(payload(container(Accent.Default, text('a')))).toMatchObject({
      flags: MessageFlags.IsComponentsV2,
    });
  });

  // 4a /sortie — 핸드오프 정본이 실제로 이 조합으로 나오는지
  it('/sortie 형태를 조립한다', () => {
    const expiry = '2026-09-05T12:00:00.000Z';
    const missions = [
      { node: 'Cinxia (Ceres)', type: 'Spy', modifier: 'Enemy Energy Drain' },
      {
        node: 'Sechura (Venus)',
        type: 'Defense',
        modifier: 'Eximus Stronghold',
      },
    ];

    const view = container(
      Accent.Default,
      section(
        'https://cdn/kela.png',
        '## Sortie · Kela De Thaym',
        subtext(`Resets ${relative(expiry)}`),
      ),
      divider(true),
      ...missions.map((mission, index) =>
        text(
          `**${index + 1} · ${mission.node} — ${mission.type}**`,
          subtext(mission.modifier),
        ),
      ),
      divider(),
      buttons(linkButton('Wiki', 'https://wiki.warframe.com/w/Sortie')),
    );

    expect(view.toJSON().components.map((child) => child.type)).toEqual([
      ComponentType.Section,
      ComponentType.Separator,
      ComponentType.TextDisplay,
      ComponentType.TextDisplay,
      ComponentType.Separator,
      ComponentType.ActionRow,
    ]);
  });
});
