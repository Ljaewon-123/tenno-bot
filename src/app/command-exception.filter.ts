import { errorCard, payload } from '@/utils/discord-embed';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { NecordArgumentsHost, type SlashCommandContext } from 'necord';

@Catch()
export class CommandExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CommandExceptionFilter.name);

  async catch(exception: Error, host: ArgumentsHost) {
    // 4xx는 유저에게 보여줄 안내지 장애가 아니다 — 서비스가 throw new BadRequestException('...') 한 줄로 끝난다
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const userError = status >= 400 && status < 500;

    if (!userError) {
      this.logger.error(exception?.message ?? exception, exception?.stack);
    }

    const [interaction] =
      NecordArgumentsHost.create(host).getContext<SlashCommandContext>();

    // 컨텍스트가 인터랙션이 아닌 이벤트(ready, warn 등)면 응답할 대상이 없다
    if (!interaction?.isRepliable?.() || interaction.replied) {
      return;
    }

    // 평문 한 줄은 성공 응답과 같은 모양으로 읽힌다 — 실패는 어느 커맨드에서 나오든 같은 빨강 카드로 통일한다
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
            'Try again in a moment',
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
