import { AlarmService } from '@/alarm/alarm.service.js';
import { ALARM_LIMIT_PER_GUILD } from '@/alarm/constants.js';
import { CreateAlarmCommand } from '@/alarm/dto/create-alarm.command.dto.js';
import { DeleteAlarmCommand } from '@/alarm/dto/delete-alarm.command.dto.js';
import { TargetCommandAlarm } from '@/alarm/vo/target-command.vo.js';
import {
  bold,
  button,
  emptyCard,
  ephemeral,
  errorCard,
  guildOnly,
  literal,
  manageCard,
  okCard,
  paged,
  payload,
  relative,
  SECTION_LIMIT,
  subtext,
} from '@/utils/discord-embed/index.js';
import { resolveTimezone } from '@/utils/timezone.js';
import {
  isRemindTarget,
  TargetCommand,
  TargetCommandLabel,
} from '@/warframe-api/enum.js';
import { CycleLabel, isCycleName } from '@/warframe-api/world-state/vo/enum.js';
import { BadRequestException, Injectable, UseGuards } from '@nestjs/common';
import { ButtonStyle, PermissionFlagsBits } from 'discord.js';
import {
  Button,
  ComponentParam,
  Context,
  Options,
  Subcommand,
  type ButtonContext,
  type SlashCommandContext,
} from 'necord';
import { REMIND_KEY } from './constants.js';
import { AlarmCommands } from './decorators/alarm-commands.decorator.js';
import { CanPostGuard } from './guards/can-post.guard.js';

@AlarmCommands()
@Injectable()
export class AlarmCommandService {
  constructor(private readonly alarmService: AlarmService) {}

  @UseGuards(CanPostGuard)
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

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels))
      throw new BadRequestException(
        'Only members with Manage Channels can delete alarms.',
      );

    await this.alarmService.unRegister(id, interaction.guildId);
    return interaction.update(
      await this.listView(interaction.guildId, Number(page)),
    );
  }

  /** 리마인더는 누른 사람 것이라 update()가 아니라 ephemeral reply()로 결과를 알린다 */
  @Button(`${REMIND_KEY}/:target/:option`)
  async remind(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('target') target: string,
    @ComponentParam('option') option: string,
  ) {
    if (!interaction.guildId)
      throw new BadRequestException(
        'This needs a server channel to fall back to when your DMs are closed.',
      );
    if (!isRemindTarget(target))
      throw new BadRequestException('That reminder is no longer available.');

    const region = isCycleName(option) ? option : undefined;
    const at = await this.alarmService.remind({
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      target,
      option: region,
    });
    const label = region
      ? CycleLabel[region]
      : TargetCommandLabel[target as TargetCommand];
    const lead = this.alarmService.leadFor(target);

    return interaction.reply(
      ephemeral(
        at
          ? okCard(
              `Reminder set · ${label}`,
              `I will DM you ${relative(at)} — ${lead} minutes before.`,
              'Press 🔔 again to cancel',
            )
          : okCard(
              `Reminder cancelled · ${label}`,
              'Nothing will be sent.',
              'Press 🔔 again to set it back',
            ),
      ),
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
            bold(literal(alarm.name)),
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
