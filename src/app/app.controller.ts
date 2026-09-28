import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { Client } from 'discord.js';

@Controller()
export class AppController {
  constructor(private readonly client: Client) {}

  // HTTP만 살아 있고 게이트웨이가 끊긴 상태를 healthy로 보면 봇이 죽은 걸 아무도 모른다
  @Get()
  getVersion() {
    if (!this.client.isReady()) {
      throw new ServiceUnavailableException('gateway not ready');
    }
    return { message: 'success' };
  }

  // 503을 던지면 랜딩이 스탯을 통째로 숨겨서 ready 플래그로 내린다
  @Get('stats')
  async getStats() {
    const guilds = this.client.guilds.cache;
    return {
      guilds: guilds.size,
      users: guilds.reduce((sum, guild) => sum + guild.memberCount, 0),
      ready: this.client.isReady(),
    };
  }
}
