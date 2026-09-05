import { errorCard, payload } from '@/utils/discord-embed';

/**
 * 길드 밖에서는 저장할 채널이 없다. 세 커맨드 그룹이 같은 이유로 거절하므로
 * 문구를 한 곳에 둔다 — 갈라지면 같은 실패가 커맨드마다 다르게 읽힌다.
 */
export const guildOnly = () =>
  payload(
    errorCard(
      'Server only',
      'This command needs a server channel to post into.',
      'Run it in a server, not in DMs',
    ),
  );
