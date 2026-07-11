import { Injectable } from '@nestjs/common';
import { EmbedBuilder, Message, User } from 'discord.js';
import type { MessageCommandContext, UserCommandContext } from 'necord';
import {
  Context,
  MessageCommand,
  TargetMessage,
  TargetUser,
  UserCommand,
} from 'necord';

@Injectable()
export class UserContextService {
  /**
   * 사용자 명령은 사용자를 마우스 오른쪽 버튼으로 클릭(또는 탭)할 때 나타나는 상황별 메뉴에 표시됩니다. 이러한 명령은 사용자를 직접 대상으로 하는 빠른 작업을 제공합니다.
   */
  @UserCommand({ name: 'Get avatar' })
  async getUserAvatar(
    @Context() [interaction]: UserCommandContext,
    @TargetUser() user: User,
  ) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Avatar of ${user.username}`)
          .setImage(user.displayAvatarURL({ size: 4096 })),
      ],
    });
  }

  /**
   * 메시지 명령은 메시지를 마우스 오른쪽 버튼으로 클릭했을 때 나타나는 상황별 메뉴에 표시되어 해당 메시지와 관련된 작업을 빠르게 수행할 수 있습니다.
   */
  @MessageCommand({ name: 'Copy Message' })
  async copyMessage(
    @Context() [interaction]: MessageCommandContext,
    @TargetMessage() message: Message,
  ) {
    return interaction.reply({ content: message.content });
  }
}
