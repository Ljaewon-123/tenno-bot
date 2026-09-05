import { AlarmService } from '@/alarm/alarm.service';
import { CreateAlarmCommand } from '@/alarm/dto/create-alarm.command.dto';
import { DeleteAlarmCommand } from '@/alarm/dto/delete-alarm.command.dto';
import {
  bold,
  button,
  emptyCard,
  errorCard,
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

    return interaction.editReply(await this.listView(interaction.guildId));
  }

  /** 페이지를 넘겨도 새 메시지를 쌓지 않는다 — 관리 목록은 한 자리에 있어야 조작이 된다 */
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

  /**
   * 지운 뒤 같은 페이지를 다시 그린다. 한 페이지가 통째로 사라졌으면
   * `paged()`가 마지막 페이지로 떨어뜨린다 — 빈 화면이 남지 않는다.
   */
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
        // 등록한 게 없는 건 실패가 아니다 — 빨강을 쓰면 뭔가 깨진 것처럼 읽힌다
        emptyCard(
          'No alarms registered',
          'Nothing is scheduled in this server.',
          '/alarm register to add one',
        ),
      );

    const view = paged({
      key: 'alarm/list',
      // 곧 울릴 것이 위에 온다 — 조작하려고 여는 화면이라 임박한 순이 유일하게 쓸모 있는 정렬이다
      items: [...alarms].sort((a, b) => a.doneAt.diff(b.doneAt)),
      page,
      sort: 'soonest first',
      // 삭제 버튼은 Section에만 붙고 Section은 컨테이너당 3개가 상한이다
      size: SECTION_LIMIT,
    });

    return payload(
      manageCard({
        title: `Alarms · ${alarms.length}`,
        rows: view.items.map((alarm) => ({
          text: [
            bold(alarm.name),
            subtext(
              `/${alarm.targetCommand.target} · every ${alarm.intervalValue} min · next ${relative(alarm.doneAt)}`,
            ),
          ].join('\n'),
          // 페이지를 customId에 실어야 지운 뒤에도 보던 자리로 돌아온다
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
