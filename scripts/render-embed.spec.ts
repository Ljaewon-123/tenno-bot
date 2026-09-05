import {
  Accent,
  buttons,
  container,
  divider,
  emptyState,
  linkButton,
  relative,
  section,
  subtext,
  text,
  title,
} from '@/utils/discord-embed';
import { describe, expect, it } from 'vitest';
import { renderMessage } from './render-embed';

const rowCount = (html: string) => html.split('<div class="row">').length - 1;

/** 빌더 -> 실제로 나가는 JSON -> HTML. 중간에서 손대면 미리보기가 거짓말을 한다 */
const render = (view: { toJSON(): object }) =>
  renderMessage(view.toJSON(), 't');

describe('renderMessage', () => {
  const field = (name: string, inline = true) => ({ name, value: 'v', inline });

  it('inline 필드는 3개까지만 한 줄에 묶는다', () => {
    const html = renderMessage(
      { fields: [1, 2, 3, 4].map((n) => field(`f${n}`)) },
      't',
    );
    expect(rowCount(html)).toBe(2);
  });

  it('inline이 아닌 필드는 줄을 끊는다', () => {
    const html = renderMessage(
      { fields: [field('a'), field('b', false), field('c')] },
      't',
    );
    expect(rowCount(html)).toBe(3);
  });

  it('name이나 value가 비면 통째로 버린다 — 디스코드가 거절하는 필드다', () => {
    const html = renderMessage({ fields: [{ name: '', value: 'v' }] }, 't');
    expect(html).not.toContain('class="fields"');
  });

  it('<t:초:R>은 상대시간으로 푼다', () => {
    const soon = Math.floor(Date.now() / 1000) + 3600;
    expect(renderMessage({ description: `<t:${soon}:R>` }, 't')).toContain(
      '<span class="ts">in an hour</span>',
    );
  });

  it('굵게/줄바꿈은 살리고 태그는 이스케이프한다', () => {
    const html = renderMessage({ description: '**a**\n<img onerror=x>' }, 't');
    expect(html).toContain('<strong>a</strong><br>&lt;img onerror=x&gt;');
  });

  it('줄 접두사 ##/-#는 블록으로, 나머지 줄만 <br>로 잇는다', () => {
    const html = render(container(Accent.Default, text(title('T'), 'a', 'b')));
    expect(html).toContain('<div class="h2">T</div>a<br>b');
  });

  it('빈 상태는 회색 accent로 나온다', () => {
    const html = render(emptyState('No active events', 'Nothing is live.'));
    expect(html).toContain(`border-left-color:${'#4e5058'}`);
  });

  // 4a /sortie — 핸드오프 정본이 이 조합으로 그려지는지
  it('/sortie 컨테이너를 그린다', () => {
    const html = render(
      container(
        Accent.Default,
        section(
          'https://cdn/kela.png',
          title('Sortie · Kela De Thaym'),
          subtext(`Resets ${relative('2026-09-05T12:00:00.000Z')}`),
        ),
        divider(true),
        text('**1 · Cinxia (Ceres) — Spy**', subtext('Enemy Energy Drain')),
        divider(),
        buttons(linkButton('Wiki', 'https://wiki.warframe.com/w/Sortie')),
      ),
    );

    expect(html).toContain('border-left-color:#5865f2');
    expect(html).toContain('<img class="thumb" src="https://cdn/kela.png">');
    expect(html).toContain('<div class="h2">Sortie · Kela De Thaym</div>');
    expect(html).toContain('<div class="sub">Enemy Energy Drain</div>');
    expect(html).toContain('<div class="sep large">');
    expect(html).toContain('<span class="btn s5">Wiki</span>');
  });
});
