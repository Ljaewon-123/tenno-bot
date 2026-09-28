// 라이트/다크 아이콘 자체는 CSS(dark: 변형)만으로 전환된다(DocsTopBar 참고) — 이 스크립트는
// 클릭 시 클래스 토글·localStorage 저장·aria-label 갱신만 한다. 초기 클래스는 docs.html의
// anti-flash 인라인 스크립트가 이미 <head>에서 건다.

const isDark = (): boolean => document.documentElement.classList.contains('dark');

const syncLabel = (button: HTMLElement): void => {
  button.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
};

const setTheme = (dark: boolean): void => {
  document.documentElement.classList.toggle('dark', dark);
  // 프라이빗 모드 등에서 접근 자체가 던질 수 있어 토글 동작과 저장 실패를 분리한다
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {
    // 저장 실패해도 이번 세션의 토글은 그대로 유지
  }
};

// vitest 기본 환경(node)에는 document가 없다 — 브라우저에서만 초기화한다.
if (typeof document !== 'undefined') {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (button) {
    syncLabel(button);
    button.addEventListener('click', () => {
      setTheme(!isDark());
      syncLabel(button);
    });
  }
}
