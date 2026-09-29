import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { PermissionFlagsBits } from 'discord.js';
import { NecordExecutionContext, type SlashCommandContext } from 'necord';

/**
 * 채널에 반복 발송하는 등록(알람·알림) 전에 봇 권한을 본다 — 발송 쪽 isSendable()은
 * 메서드 유무만 봐서, 여기서 안 막으면 등록은 성공하고 이후 발송만 조용히 영원히 실패한다.
 * 핸들러가 아니라 가드인 이유: 인터셉터의 공개 defer 전에 던져야 에러가 ephemeral로 나간다
 */
@Injectable()
export class CanPostGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const [interaction] =
      NecordExecutionContext.create(context).getContext<SlashCommandContext>();
    // DM은 핸들러의 guildOnly 안내가 맡는다
    if (!interaction.inGuild()) return true;

    // 스레드는 Send Messages가 아니라 Send Messages in Threads로 판단된다
    const send = interaction.channel?.isThread()
      ? PermissionFlagsBits.SendMessagesInThreads
      : PermissionFlagsBits.SendMessages;
    if (
      !interaction.appPermissions.has([
        PermissionFlagsBits.ViewChannel,
        send,
        PermissionFlagsBits.EmbedLinks,
      ])
    )
      // false를 돌려주면 Nest 기본 ForbiddenException("Forbidden resource")이 나간다
      throw new BadRequestException(
        "I can't post in this channel. Give me View Channel, Send Messages and Embed Links here, then try again.",
      );
    return true;
  }
}
