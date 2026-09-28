/** 이 시간을 넘도록 RUNNING인 알람은 프로세스가 죽은 것으로 본다 */
export const STALE_AFTER_MINUTES = 10;

export const REMIND_LEAD_MINUTES = 30;

/** 오브 협곡 한 바퀴가 27분이라 30분 전으로 잡으면 모든 등록이 "이미 늦었다"로 거절된다 */
export const CYCLE_REMIND_LEAD_MINUTES = 5;

/** 채널 단위면 채널을 더 파서 우회되므로 서버 단위로 센다. 1회용 리마인더는 세지 않는다 */
export const ALARM_LIMIT_PER_GUILD = 20;
