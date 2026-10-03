import type { FooterLink } from './types.ts';

export const INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1525465332209287168&scope=bot+applications.commands&permissions=274877926400';
export const KOFI_URL = 'https://ko-fi.com/ljaewon';
export const GITHUB_REPO_URL = 'https://github.com/Ljaewon-123/teno-bot';
export const SUPPORT_SERVER_URL = 'https://discord.gg/qxv7pvhtVm';

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
