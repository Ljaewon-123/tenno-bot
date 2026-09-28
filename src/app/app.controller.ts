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

  // 랜딩 스탯 알약용. 503을 던지면 랜딩이 알약을 통째로 숨기므로 게이트웨이가 끊겨도 ready:false로 내려준다
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
