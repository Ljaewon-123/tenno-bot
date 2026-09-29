import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { CanPostGuard } from './can-post.guard';

/** necord는 인터랙션을 ExecutionContext의 첫 번째 인자 배열에 싣는다 */
const context = (
  { guild = true, thread = false }: { guild?: boolean; thread?: boolean },
  ...granted: bigint[]
) => {
  const interaction = {
    inGuild: () => guild,
    channel: { isThread: () => thread },
    appPermissions: new PermissionsBitField(granted),
  };
  return {
    getArgs: () => [[interaction], 'necord'],
    getType: () => 'necord',
    getClass: () => Object,
    getHandler: () => () => undefined,
  } as never;
};

const { ViewChannel, SendMessages, SendMessagesInThreads, EmbedLinks } =
  PermissionFlagsBits;
const guard = new CanPostGuard();

describe('CanPostGuard', () => {
  it('봇이 채널에 못 쓰면 등록 전에 막는다', async () => {
    await expect(
      guard.canActivate(context({}, ViewChannel, EmbedLinks)),
    ).rejects.toThrow("can't post");
  });

  it('권한이 다 있으면 통과한다', async () => {
    await expect(
      guard.canActivate(context({}, ViewChannel, SendMessages, EmbedLinks)),
    ).resolves.toBe(true);
  });

  it('스레드는 Send Messages 대신 Send Messages in Threads를 본다', async () => {
    await expect(
      guard.canActivate(
        context(
          { thread: true },
          ViewChannel,
          SendMessagesInThreads,
          EmbedLinks,
        ),
      ),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(
        context({ thread: true }, ViewChannel, SendMessages, EmbedLinks),
      ),
    ).rejects.toThrow();
  });

  it('DM은 통과시켜 핸들러의 guildOnly 안내가 나가게 한다', async () => {
    await expect(guard.canActivate(context({ guild: false }))).resolves.toBe(
      true,
    );
  });
});
