import dayjs from '@/utils/dayjs.js';
import { describe, expect, it } from 'vitest';
import { Party } from './entities/party.entity.js';
import { PartyMessageService } from './party-message.service.js';
import { PartyStatus, PartyVisibility } from './vo/enum.js';

const PHISHING = '[Free Nitro](https://evil.x)';

const partyOf = (overrides: Partial<Party> = {}) =>
  ({
    id: 'p1',
    hostUserId: 'host',
    name: PHISHING,
    mission: PHISHING,
    partySize: 4,
    members: ['host'],
    status: PartyStatus.OPEN,
    visibility: PartyVisibility.PUBLIC,
    createdAt: dayjs(),
    updatedAt: dayjs(),
    ...overrides,
  }) as Party;

/** 카드 안 모든 텍스트 — 이름이 어느 자리(제목·부제)에 들어가든 다 훑는다 */
const textOf = (view: ReturnType<PartyMessageService['build']>) =>
  JSON.stringify(view.components[0].toJSON());

/** 이스케이프 안 된 `[` 뒤에 링크 문법이 이어지면 디스코드가 마스킹 링크로 그린다 */
const LIVE_LINK = /(?<!\\)\[Free Nitro\]\(/;

describe('PartyMessageService — 유저 입력 이스케이프', () => {
  const service = new PartyMessageService();

  it('모집 카드에서 이름·미션의 마스킹 링크가 살아나지 않는다', () => {
    expect(textOf(service.build(partyOf()))).not.toMatch(LIVE_LINK);
  });

  it('마감 카드도 같다', () => {
    const closed = partyOf({ status: PartyStatus.CLOSE });
    expect(textOf(service.build(closed))).not.toMatch(LIVE_LINK);
  });

  it('목록 한 줄도 같다', () => {
    expect(service.line(partyOf())).not.toMatch(LIVE_LINK);
  });
});
