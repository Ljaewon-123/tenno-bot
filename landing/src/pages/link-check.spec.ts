import { describe, expect, it } from 'vitest';
import { render as renderDocs } from './docs.ts';
import { render as renderLanding } from './landing.ts';
import { render as renderPrivacy } from './privacy.ts';
import { render as renderTerms } from './terms.ts';

// 정적 멀티페이지 빌드는 페이지끼리 절대경로(/xxx.html)나 같은 페이지 내부 #id로만 연결된다 —
// 페이지 하나를 고치다 다른 페이지의 링크나 앵커를 깨뜨려도 빌드는 안 실패하니 여기서 렌더 결과를
// 직접 훑어 잡는다. 외부/placeholder href([INVITE URL] 등, http(s)://...)는 검증 대상이 아니라 건너뛴다.
const PAGES: Record<string, string> = {
  index: renderLanding().toString(),
  docs: renderDocs().toString(),
  privacy: renderPrivacy().toString(),
  terms: renderTerms().toString(),
};

function idsOf(source: string): Set<string> {
  return new Set([...source.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
}

function hrefsOf(source: string): string[] {
  return [...source.matchAll(/\shref="([^"]+)"/g)].map((m) => m[1]);
}

function pageNameFromPath(path: string): string | undefined {
  if (path === '/' || path === '') return 'index';
  return /^\/(index|docs|privacy|terms)\.html$/.exec(path)?.[1];
}

describe('cross-page links', () => {
  it.each(Object.keys(PAGES))('%s: every internal href resolves to a page or an in-page id', (name) => {
    const source = PAGES[name];
    for (const href of hrefsOf(source)) {
      if (href.startsWith('#')) {
        expect(idsOf(source).has(href.slice(1)), `${name}: ${href} has no matching id on the same page`).toBe(true);
        continue;
      }
      if (!href.startsWith('/')) continue; // external/placeholder — skip

      const [path, anchor] = href.split('#');
      const target = pageNameFromPath(path);
      expect(target, `${name}: ${href} does not resolve to a known page`).toBeDefined();
      if (anchor) {
        expect(idsOf(PAGES[target!]).has(anchor), `${name}: ${href} anchor "#${anchor}" missing on ${target}`).toBe(true);
      }
    }
  });
});
