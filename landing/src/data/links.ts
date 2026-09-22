// 실제 URL이 아직 확정 안 됨 — 대괄호 placeholder를 한 곳에 모아두고 나중에 여기만 채운다.
export const INVITE_URL = '[INVITE URL]';
export const KOFI_URL = '[KO-FI URL]';
export const SPONSORS_URL = '[SPONSORS URL]';
export const GITHUB_REPO_URL = '[GITHUB REPO URL]';
export const SUPPORT_SERVER_URL = '[SUPPORT SERVER URL]';

// 정적 멀티페이지 빌드라 실제 페이지 파일명으로 링크한다 (목업의 #anchor/dc.html은 목업 전용).
// 절대경로(/로 시작)를 쓰는 이유: Cloudflare Pages 배포가 서브경로 없이 루트 고정이라 어느 페이지에서
// 링크하든 항상 같은 문자열로 맞는다 — 상대경로면 나중에 폴더 구조가 바뀔 때마다 깨진다.
export const HOME_HREF = '/';
export const DOCS_HREF = '/docs.html';
export const PRIVACY_HREF = '/privacy.html';
export const TERMS_HREF = '/terms.html';
