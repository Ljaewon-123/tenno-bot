import { AlarmService } from '@/alarm/alarm.service';
import { CreateAlarmCommand } from '@/alarm/dto/create-alarm.command.dto';
import { DeleteAlarmCommand } from '@/alarm/dto/delete-alarm.command.dto';
import {
  bold,
  emptyCard,
  errorCard,
  manageCard,
  okCard,
  payload,
  relative,
  subtext,
} from '@/utils/discord-embed';
import { resolveTimezone } from '@/utils/timezone';
import { Injectable } from '@nestjs/common';
import { Context, Options, Subcommand, type SlashCommandContext } from 'necord';
import { AlarmCommands } from './decorators/alarm-commands.decorator';
import { guildOnly } from './guild-only';

@AlarmCommands()
@Injectable()
export class AlarmCommandService {
  constructor(private readonly alarmService: AlarmService) {}

  @Subcommand({ name: 'register', description: 'Register a new alarm' })
  async registerAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() request: CreateAlarmCommand,
  ) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const saved = await this.alarmService.register({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      name: request.name,
      description: request.description,
      intervalValue: request.intervalValue,
      targetCommand: { target: request.target, options: request.options },
      timezone: resolveTimezone(interaction.locale, request.timezone),
    });

    return interaction.editReply(
      payload(
        okCard(
          `Alarm registered · \`${saved.id}\``,
          `/${saved.targetCommand.target} every ${saved.intervalValue} min · first run ${relative(saved.doneAt)}`,
          `/alarm delete id:${saved.id} to remove`,
        ),
      ),
    );
  }

  @Subcommand({ name: 'delete', description: 'Delete an existing alarm' })
  async unRegisterAlarm(
    @Context() [interaction]: SlashCommandContext,
    @Options() { id }: DeleteAlarmCommand,
  ) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const deleted = await this.alarmService.unRegister(id, interaction.guildId);
    if (!deleted)
      return interaction.editReply(
        payload(
          errorCard(
            'No such alarm',
            `Nothing with id \`${id}\` in this server.`,
            '/alarm list to see the ids',
          ),
        ),
      );

    const left = await this.alarmService.popAlarm(interaction.guildId);
    return interaction.editReply(
      payload(
        okCard(
          `Alarm deleted · \`${id}\``,
          `${left.length} alarms left in this server.`,
        ),
      ),
    );
  }

  @Subcommand({ name: 'list', description: 'Show alarms in this server' })
  async popAlarm(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guildId) return interaction.editReply(guildOnly());

    const alarms = await this.alarmService.popAlarm(interaction.guildId);

    if (!alarms.length)
      return interaction.editReply(
        payload(
          // 등록한 게 없는 건 실패가 아니다 — 빨강을 쓰면 뭔가 깨진 것처럼 읽힌다
          emptyCard(
            'No alarms registered',
            'Nothing is scheduled in this server.',
            '/alarm register to add one',
          ),
        ),
      );

    return interaction.editReply(
      payload(
        manageCard({
          title: `Alarms · ${alarms.length}`,
          // 곧 울릴 것이 위에 온다 — 조작하려고 여는 화면이라 임박한 순이 유일하게 쓸모 있는 정렬이다
          rows: [...alarms]
            .sort((a, b) => a.doneAt.diff(b.doneAt))
            .map((alarm) => ({
              text: [
                `${bold(alarm.name)} \`${alarm.id}\``,
                subtext(
                  `/${alarm.targetCommand.target} · every ${alarm.intervalValue} min · next ${relative(alarm.doneAt)}`,
                ),
              ].join('\n'),
            })),
          footer: 'Delete with /alarm delete id:<id>',
        }),
      ),
    );
  }
}
