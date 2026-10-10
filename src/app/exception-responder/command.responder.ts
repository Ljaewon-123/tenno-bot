import {
  errorCard,
  payload,
  SUPPORT_SERVER_URL,
} from '@/utils/discord-embed/index.js';
import { ArgumentsHost } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { NecordArgumentsHost, type SlashCommandContext } from 'necord';
import { ExceptionResponder } from './types.js';

export class CommandResponder implements ExceptionResponder {
  async respond(host: ArgumentsHost, exception: Error, userError: boolean) {
    const [interaction] =
      NecordArgumentsHost.create(host).getContext<SlashCommandContext>();

    // 컨텍스트가 인터랙션이 아닌 이벤트(ready, warn 등)면 응답할 대상이 없다
    if (!interaction?.isRepliable?.() || interaction.replied) {
      return;
    }

    const view = payload(
      userError
        ? errorCard(
            'Cannot run that',
            exception.message,
            'Check the options and try again',
          )
        : errorCard(
            'Something went wrong',
            'The command failed before it could finish.',
            // 유저 실수(4xx)엔 안 붙인다 — 고칠 사람이 유저 본인이라 제보 링크는 잡음이다
            `Try again in a moment · [Report it](${SUPPORT_SERVER_URL})`,
          ),
    );
    await (interaction.deferred
      ? interaction.editReply(view)
      : interaction.reply({
          ...view,
          flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }));
  }
}
