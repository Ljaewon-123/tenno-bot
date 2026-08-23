import { PermissionFlagsBits } from 'discord.js';
import { createCommandGroupDecorator } from 'necord';

export const NotificationCommands = createCommandGroupDecorator({
  name: 'notification',
  description: 'Subscribe this server to Warframe worldstate updates',
  // 서버 전체에 발송되는 설정이라 관리자만 건드릴 수 있어야 한다
  defaultMemberPermissions: PermissionFlagsBits.ManageGuild,
});
