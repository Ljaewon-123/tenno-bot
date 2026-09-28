import { AlarmService } from '@/alarm/alarm.service';
import { ALARM_LIMIT_PER_GUILD } from '@/alarm/constants';
import { CreateAlarmCommand } from '@/alarm/dto/create-alarm.command.dto';
import { DeleteAlarmCommand } from '@/alarm/dto/delete-alarm.command.dto';
import { TargetCommandAlarm } from '@/alarm/vo/target-command.vo';
import {
  bold,
  button,
  emptyCard,
  errorCard,
  guildOnly,
  manageCard,
  okCard,
  paged,
  payload,
  relative,
  SECTION_LIMIT,
  subtext,
} from '@/utils/discord-embed';
import { resolveTimezone } from '@/utils/timezone';
import { Injectable } from '@nestjs/common';
import { ButtonStyle } from 'discord.js';
import {
  Button,
  ComponentParam,
  Context,
  Options,
  Subcommand,
  type ButtonContext,
  type SlashCommandContext,
} from 'necord';
import { AlarmCommands } from './decorators/alarm-commands.decorator';

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
          `${TargetCommandAlarm.path(saved.targetCommand)} every ${saved.intervalValue} min · first run ${relative(saved.doneAt)}`,
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

    return interaction.editReply(await this.listView(interaction.guildId));
  }

  @Button('alarm/list/page/:page')
  async listPage(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('page') page: string,
  ) {
    if (!interaction.guildId) return interaction.update(guildOnly());

    return interaction.update(
      await this.listView(interaction.guildId, Number(page)),
    );
  }

  @Button('alarm/list/delete/:id/:page')
  async deleteFromList(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('id') id: string,
    @ComponentParam('page') page: string,
  ) {
    if (!interaction.guildId) return interaction.update(guildOnly());

    await this.alarmService.unRegister(id, interaction.guildId);
    return interaction.update(
      await this.listView(interaction.guildId, Number(page)),
    );
  }

  private async listView(guildId: string, page = 0) {
    const alarms = await this.alarmService.popAlarm(guildId);

    if (!alarms.length)
      return payload(
        emptyCard(
          'No alarms registered',
          'Nothing is scheduled in this server.',
          '/alarm register to add one',
        ),
      );

    const view = paged({
      key: 'alarm/list',
      items: [...alarms].sort((a, b) => a.doneAt.diff(b.doneAt)),
      page,
      sort: 'soonest first',
      // manageCard는 앞 SECTION_LIMIT개에만 버튼을 달아서 페이지 크기를 맞춘다
      size: SECTION_LIMIT,
    });

    return payload(
      manageCard({
        title: `Alarms · ${alarms.length} / ${ALARM_LIMIT_PER_GUILD}`,
        rows: view.items.map((alarm) => ({
          text: [
            bold(alarm.name),
            subtext(
              `${TargetCommandAlarm.path(alarm.targetCommand)} · every ${alarm.intervalValue} min · next ${relative(alarm.doneAt)}`,
            ),
          ].join('\n'),
          button: button(
            `alarm/list/delete/${alarm.id}/${page}`,
            'Delete',
            ButtonStyle.Danger,
          ),
        })),
        buttons: view.buttons,
        footer: view.footer,
      }),
    );
  }
}
