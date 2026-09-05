import { ComponentType, MessageFlags } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { subtext } from '../markdown';
import { Accent, LIMIT } from '../types';
import { card } from './card';
import { manageCard } from './manage-card';
import { asPush, button, payload } from './message';
import { emptyCard, errorCard } from './notice';

const bodies = (view: ReturnType<typeof card>) => view.toJSON().components;

describe('card', () => {
  it('없는 줄은 걸러내고 안쪽 블록은 빈 줄로 잇는다', () => {
    const [head, , body] = bodies(
      card({ title: 'Sortie', blocks: [[undefined, 'a', false, 'b']] }),
    );

    expect(head).toMatchObject({ content: '## Sortie' });
    expect(body).toMatchObject({ content: 'a\n\nb' });
  });

  it('항목 0개인 그룹은 구분선까지 통째로 만들지 않는다', () => {
    expect(
      bodies(card({ title: 'T', blocks: [[], [undefined], ['x']] })),
    ).toHaveLength(3); // 헤더 + 구분선 + 블록 하나
  });

  it('헤딩은 굵게, 접힌 개수는 회색 꼬리줄로 붙는다', () => {
    const [, , body] = bodies(
      card({
        title: 'Void Fissures',
        blocks: [[{ heading: 'Axi', lines: ['a', 'b'], more: '…and 8 more' }]],
      }),
    );

    expect(body).toMatchObject({
      content: `**Axi**\na\nb\n${subtext('…and 8 more')}`,
    });
  });

  it('썸네일이 있으면 헤더가 Section이 된다 — V2에는 썸네일 슬롯이 없다', () => {
    expect(bodies(card({ title: 'T', blocks: [] }))[0].type).toBe(
      ComponentType.TextDisplay,
    );
    expect(
      bodies(
        card({ title: 'T', blocks: [], thumbnail: 'https://cdn/x.png' }),
      )[0].type,
    ).toBe(ComponentType.Section);
  });

  it('만료 accent와 -# 자리는 호출단이 정한다', () => {
    const view = card({
      accent: Accent.Soon,
      title: 'Sortie',
      subtitle: 'Resets <t:1:R>',
      footer: 'cached 60s',
      blocks: [],
    });

    expect(view.toJSON().accent_color).toBe(Accent.Soon);
    expect(bodies(view)[0]).toMatchObject({
      content: `## Sortie\n${subtext('Resets <t:1:R>')}`,
    });
    expect(bodies(view).at(-1)).toMatchObject({
      content: subtext('cached 60s'),
    });
  });

  it('40개 한도를 넘기면 잘라내되 버렸다는 사실은 남긴다', () => {
    const components = bodies(
      card({
        title: 'T',
        blocks: Array.from({ length: 25 }, (_, index) => [`${index}`]),
      }),
    );

    expect(components).toHaveLength(LIMIT.components);
    expect(components.at(-1)).toMatchObject({
      content: subtext('12 more hidden'),
    });
  });

  it('버튼 행은 1개가 아니라 1 + 버튼 수로 계산된다', () => {
    // 헤더 1 + 블록 2 + 구분선 1 + (행 1 + 버튼 5) = 10칸을 먹는다
    const view = card({
      title: 'T',
      blocks: [['a']],
      buttons: Array.from({ length: 5 }, (_, index) =>
        button(`x/${index}`, `${index}`),
      ),
    });

    expect(bodies(view).at(-1)).toMatchObject({
      type: ComponentType.ActionRow,
    });
  });
});

describe('manageCard', () => {
  it('버튼 달린 항목은 3개까지만 Section이고 나머지는 목록으로 떨어진다', () => {
    const view = manageCard({
      title: 'Alarms · 5 / 10',
      rows: Array.from({ length: 5 }, (_, index) => ({
        text: `alarm ${index}`,
        button: button(`alarm/del/${index}`, 'Delete'),
      })),
    });
    const components = bodies(view);

    expect(
      components.filter((child) => child.type === ComponentType.Section),
    ).toHaveLength(3);
    expect(components.at(-1)).toMatchObject({
      content: '- alarm 3\n- alarm 4',
    });
  });
});

describe('notice', () => {
  it('빈 상태·에러는 구분선 없는 한 덩어리다', () => {
    const view = emptyCard(
      'No active events',
      'Nothing is live right now.',
      'Use /notification on event:events',
    );

    expect(view.toJSON().accent_color).toBe(Accent.Muted);
    expect(bodies(view)).toHaveLength(1);
    expect(bodies(view)[0]).toMatchObject({
      content: `## No active events\nNothing is live right now.\n${subtext('Use /notification on event:events')}`,
    });
    expect(errorCard('Failed', 'no response').toJSON().accent_color).toBe(
      Accent.Error,
    );
  });
});

describe('asPush', () => {
  it('발송은 맨 윗줄에 왜 왔는지를 밝히고 accent를 주황으로 바꾼다', () => {
    const view = asPush(
      card({ title: 'Void Fissures', blocks: [['a']] }),
      '🔔 Alarm · Axi · every 15 min',
      'a1f3c · next run <t:1:R>',
    );

    expect(view.toJSON().accent_color).toBe(Accent.Soon);
    expect(bodies(view)[0]).toMatchObject({
      content: subtext('🔔 Alarm · Axi · every 15 min'),
    });
    expect(bodies(view).at(-1)).toMatchObject({
      content: subtext('a1f3c · next run <t:1:R>'),
    });
  });

  it('플래그가 없으면 컴포넌트가 통째로 무시된다', () => {
    expect(payload(card({ title: 'T', blocks: [] })).flags).toBe(
      MessageFlags.IsComponentsV2,
    );
  });
});
