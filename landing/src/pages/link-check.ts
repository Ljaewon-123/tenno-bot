import { PLACEHOLDER_URLS } from '../data/links.ts';

/**
 * 정적 멀티페이지 빌드에서 href가 유효한 형태인지 판정. `/...`(절대경로), `#...`(같은 페이지 앵커),
 * `http(s)://`·`mailto:`(외부), 또는 아직 안 채운 placeholder([INVITE URL] 등, links.ts에 한 곳에 모아둠)
 * 만 허용한다. 그 외(상대경로 등)는 Cloudflare Pages가 index.html로 폴백해 버튼이 조용히 랜딩만
 * 새로고침하게 되므로 반드시 잡아야 한다.
 */
export function isAllowedHref(href: string): boolean {
  if (href.startsWith('/') || href.startsWith('#')) return true;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return true;
  return PLACEHOLDER_URLS.includes(href);
}
