import { describe, expect, it } from 'vitest';
import { render as renderDocs } from './docs';
import { render as renderLanding } from './landing';
import { render as renderPrivacy } from './privacy';
import { render as renderTerms } from './terms';

// prerender 플러그인이 <!--app-->를 이 값으로 치환하므로, 페이지마다 빈 문자열이 나오면 안 된다.
describe('page modules', () => {
  it.each([
    ['landing', renderLanding],
    ['docs', renderDocs],
    ['privacy', renderPrivacy],
    ['terms', renderTerms],
  ])('%s render() returns non-empty markup', (_name, render) => {
    expect(render().toString().length).toBeGreaterThan(0);
  });
});
