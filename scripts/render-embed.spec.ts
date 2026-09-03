import { describe, expect, it } from 'vitest';
import { renderEmbed } from './render-embed';

const rowCount = (html: string) => html.split('<div class="row">').length - 1;

describe('renderEmbed', () => {
  const field = (name: string, inline = true) => ({ name, value: 'v', inline });

  it('inline 필드는 3개까지만 한 줄에 묶는다', () => {
    const html = renderEmbed(
      { fields: [1, 2, 3, 4].map((n) => field(`f${n}`)) },
      't',
    );
    expect(rowCount(html)).toBe(2);
  });

  it('inline이 아닌 필드는 줄을 끊는다', () => {
    const html = renderEmbed(
      { fields: [field('a'), field('b', false), field('c')] },
      't',
    );
    expect(rowCount(html)).toBe(3);
  });

  it('name이나 value가 비면 통째로 버린다 — 디스코드가 거절하는 필드다', () => {
    const html = renderEmbed({ fields: [{ name: '', value: 'v' }] }, 't');
    expect(html).not.toContain('class="fields"');
  });

  it('<t:초:R>은 상대시간으로 푼다', () => {
    const soon = Math.floor(Date.now() / 1000) + 3600;
    expect(renderEmbed({ description: `<t:${soon}:R>` }, 't')).toContain(
      '<span class="ts">in an hour</span>',
    );
  });

  it('굵게/줄바꿈은 살리고 태그는 이스케이프한다', () => {
    const html = renderEmbed({ description: '**a**\n<img onerror=x>' }, 't');
    expect(html).toContain('<strong>a</strong><br>&lt;img onerror=x&gt;');
  });
});
