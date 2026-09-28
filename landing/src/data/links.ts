import type { FooterLink } from './types.ts';

// 실제 URL이 아직 확정 안 됨 — 대괄호 placeholder를 한 곳에 모아두고 나중에 여기만 채운다.
export const INVITE_URL = '[INVITE URL]';
export const KOFI_URL = '[KO-FI URL]';
export const SPONSORS_URL = '[SPONSORS URL]';
export const GITHUB_REPO_URL = '[GITHUB REPO URL]';
export const SUPPORT_SERVER_URL = '[SUPPORT SERVER URL]';

// link-check(cross-page href 검사)와 vite.config.ts의 CF_PAGES 가드가 같이 쓰는 목록 — 위 상수가
// 대괄호 placeholder인 동안은 href로 등장해도 "깨진 링크"가 아니라 "아직 안 채운 값"으로 봐준다.
// 실제 URL로 채워지면 http(s):// 규칙이 알아서 통과시키므로 이 목록은 손댈 필요가 없다.
export const PLACEHOLDER_URLS: readonly string[] = [INVITE_URL, KOFI_URL, SPONSORS_URL, GITHUB_REPO_URL, SUPPORT_SERVER_URL];

/** 값이 아직 `[...]` 형태의 대괄호 placeholder인지 — CF_PAGES 프로덕션 빌드 가드가 쓴다. */
export function isPlaceholder(url: string): boolean {
  return /^\[.*\]$/.test(url);
}

// 정적 멀티페이지 빌드라 실제 페이지 파일명으로 링크한다 (목업의 #anchor/dc.html은 목업 전용).
// 절대경로(/로 시작)를 쓰는 이유: Cloudflare Pages 배포가 서브경로 없이 루트 고정이라 어느 페이지에서
// 링크하든 항상 같은 문자열로 맞는다 — 상대경로면 나중에 폴더 구조가 바뀔 때마다 깨진다.
export const HOME_HREF = '/';
export const DOCS_HREF = '/docs.html';
export const PRIVACY_HREF = '/privacy.html';
export const TERMS_HREF = '/terms.html';

// 모든 페이지가 이 목록을 쓰므로 (원래 data/landing.ts에 있었지만) 링크 전용 파일로 옮겨왔다.
export const FOOTER_LINKS: FooterLink[] = [
  { href: DOCS_HREF, label: 'Docs' },
  { href: PRIVACY_HREF, label: 'Privacy' },
  { href: TERMS_HREF, label: 'Terms' },
  { href: GITHUB_REPO_URL, label: 'GitHub' },
  { href: SUPPORT_SERVER_URL, label: 'Support server' },
];
