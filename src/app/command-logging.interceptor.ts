import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { NecordExecutionContext, type SlashCommandContext } from 'necord';
import { catchError, tap, throwError, timeout, TimeoutError } from 'rxjs';

@Injectable()
export class CommandLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CommandLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler) {
    const [interaction] =
      NecordExecutionContext.create(context).getContext<SlashCommandContext>();
    const startedAt = performance.now();

    // 실패 로그는 CommandExceptionFilter가 남기므로 성공 경로만 기록한다
    return next.handle().pipe(
      tap(() =>
        this.logger.log(
          `${this.commandName(interaction)} ${Math.round(performance.now() - startedAt)}ms`,
        ),
      ),
      timeout(5000),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err as unknown);
      }),
    );
  }

  private commandName(interaction: SlashCommandContext[0]) {
    if (!interaction?.isChatInputCommand?.()) {
      return 'unknown';
    }
    const subcommand = interaction.options.getSubcommand(false);
    return subcommand
      ? `/${interaction.commandName} ${subcommand}`
      : `/${interaction.commandName}`;
  }
}
