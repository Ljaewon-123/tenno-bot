import type { FooterLink } from './types.ts';

export const INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1525465332209287168&scope=bot+applications.commands&permissions=274877926400';
export const KOFI_URL = 'https://ko-fi.com/ljaewon';
export const GITHUB_REPO_URL = 'https://github.com/Ljaewon-123/tenno-bot';
export const SUPPORT_SERVER_URL = 'https://discord.gg/qxv7pvhtVm';

// 준비 안 된 링크를 페이지에서 유도하지 않기 위한 토글 — Ko-fi는 후원 페이지가 준비되면 푼다.
export const BETA = false;
export const HIDE = { invite: false, kofi: true, supportServer: false };

export const INVITE_HREF = HIDE.invite ? undefined : INVITE_URL;
// 서포트 서버를 숨기는 동안에도 privacy/terms엔 문의 창구가 있어야 해서 GitHub 이슈로 돌린다.
export const CONTACT = HIDE.supportServer
  ? { href: `${GITHUB_REPO_URL}/issues`, label: 'GitHub issues' }
  : { href: SUPPORT_SERVER_URL, label: 'the support server' };

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
  ...(HIDE.supportServer ? [] : [{ href: SUPPORT_SERVER_URL, label: 'Support server' }]),
];
