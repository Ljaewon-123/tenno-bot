import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { NecordArgumentsHost, type SlashCommandContext } from 'necord';

@Catch()
export class CommandExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CommandExceptionFilter.name);

  async catch(exception: Error, host: ArgumentsHost) {
    this.logger.error(exception?.message ?? exception, exception?.stack);

    const [interaction] =
      NecordArgumentsHost.create(host).getContext<SlashCommandContext>();

    // 컨텍스트가 인터랙션이 아닌 이벤트(ready, warn 등)면 응답할 대상이 없다
    if (!interaction?.isRepliable?.() || interaction.replied) {
      return;
    }

    const content = 'Something went wrong while running this command.';
    await (interaction.deferred
      ? interaction.editReply({ content })
      : interaction.reply({ content, flags: MessageFlags.Ephemeral }));
  }
}
