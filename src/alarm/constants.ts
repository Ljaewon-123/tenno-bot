/** 이 시간을 넘도록 RUNNING인 알람은 프로세스가 죽은 것으로 본다 */
export const STALE_AFTER_MINUTES = 10;

export const REMIND_LEAD_MINUTES = 30;

/** 오브 협곡 한 바퀴가 27분이라 30분 전으로 잡으면 모든 등록이 "이미 늦었다"로 거절된다 */
export const CYCLE_REMIND_LEAD_MINUTES = 5;

/** 채널 단위면 채널을 더 파서 우회되므로 서버 단위로 센다. 1회용 리마인더는 세지 않는다 */
export const ALARM_LIMIT_PER_GUILD = 20;

/** 월드스테이트 캐시·알림 크론이 10분 단위라 더 잦으면 같은 카드만 반복된다. 1분이면 길드당 분당 20건으로 전역 레이트리밋을 먹는다 */
export const ALARM_MIN_INTERVAL_MINUTES = 10;

/** 상한이 없으면 int 컬럼을 넘겨 500이 난다. 주간 리셋보다 긴 주기는 쓸 일이 없다 */
export const ALARM_MAX_INTERVAL_MINUTES = 60 * 24 * 7;
