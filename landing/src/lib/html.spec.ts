import { describe, expect, it } from 'vitest';
import { html, raw } from './html';

// html``의 반환값은 "이미 이스케이프됨" 표식을 들고 있는 래퍼(RawHtml)다 —
// 중첩 html`` 호출을 다시 이스케이프하지 않으려면 순수 문자열이 아니라 이 표식이 필요하다.
// 최종 출력(파일 기록, marker 치환)에서는 String()/toString()으로 풀어 쓴다.
const s = (v: { toString(): string }) => v.toString();

describe('html', () => {
  it('escapes & < > " \' in interpolated strings', () => {
    const value = `& < > " '`;
    expect(s(html`<p>${value}</p>`)).toBe('<p>&amp; &lt; &gt; &quot; &#39;</p>');
  });

  it('escapes interpolated numbers by stringifying first', () => {
    expect(s(html`<span>${42}</span>`)).toBe('<span>42</span>');
  });

  it('joins arrays, escaping each element', () => {
    const items = ['<a>', '<b>'];
    expect(s(html`<ul>${items}</ul>`)).toBe('<ul>&lt;a&gt;&lt;b&gt;</ul>');
  });

  it('renders null, undefined, false as empty string', () => {
    expect(s(html`<p>${null}${undefined}${false}</p>`)).toBe('<p></p>');
  });

  it('does not escape values wrapped by raw()', () => {
    expect(s(html`<div>${raw('<b>bold</b>')}</div>`)).toBe('<div><b>bold</b></div>');
  });

  it('does not double-escape nested html`` results', () => {
    const inner = html`<b>${'<hi>'}</b>`;
    expect(s(html`<div>${inner}</div>`)).toBe('<div><b>&lt;hi&gt;</b></div>');
  });

  it('does not escape array elements that are raw or nested html', () => {
    const items = [raw('<i>1</i>'), html`<i>${'2'}</i>`];
    expect(s(html`<ul>${items}</ul>`)).toBe('<ul><i>1</i><i>2</i></ul>');
  });
});
