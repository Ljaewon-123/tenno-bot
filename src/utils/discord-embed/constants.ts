/** 컨테이너 V2 하드 리밋. 넘기면 초과분이 잘리는 게 아니라 메시지가 통째로 400으로 거절된다 */
export const LIMIT = {
  components: 40,
  content: 4000,
  /** 버튼·셀렉트 customId. 여기에 유저 입력을 실으면 길이를 먼저 재야 한다 */
  customId: 100,
  selectOptions: 25,
} as const;

/** 잘렸다는 안내 한 줄이 들어갈 자리 — 칸도 글자도 마지막은 비워둔다 */
export const NOTICE_RESERVE = 64;

/** 한 화면에 펴는 버튼 달린 항목 수 — Discord 제약이 아니라 고른 페이지 크기다 */
export const SECTION_LIMIT = 3;

/** 한 페이지에 펴는 줄 수. 8줄이 넘으면 카드가 채널 한 화면을 넘긴다 */
export const PAGE_SIZE = 8;

/** 주기 알람은 짧아야 한다 — 긴 카드를 계속 던지면 채널이 덮여 알람을 끄게 된다 */
export const PUSH_MAX_LINES = 12;

/** 봇 응답에서 문의·제보 창구로 거는 링크. 공개값이고 환경별로 안 바뀌어 env가 아니다 */
export const SUPPORT_SERVER_URL = 'https://discord.gg/qxv7pvhtVm';
