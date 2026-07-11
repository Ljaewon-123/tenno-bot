import { CommandAutocompleteInterceptor } from '@/app/command-autocomplete.interceptor';
import { Injectable, UseInterceptors } from '@nestjs/common';
import type {
  ButtonContext,
  ContextOf,
  ModalContext,
  SlashCommandContext,
  StringSelectContext,
  TextCommandContext,
} from 'necord';
import {
  Arguments,
  Button,
  Context,
  Modal,
  On,
  Once,
  Options,
  SelectedStrings,
  SlashCommand,
  StringSelect,
  TextCommand,
} from 'necord';
import { AutoDto } from './dto/auto.dto';
import { TextDto } from './dto/text.dto';

@Injectable()
export class SlashCommandService {
  @Once('ready')
  onReady(@Context() [client]: ContextOf<'ready'>) {
    console.log(`Logged in as ${client.user.username}!`);
  }

  @On('warn')
  onWarn(@Context() [message]: ContextOf<'warn'>) {
    console.log(message);
  }

  @TextCommand({
    name: 'ping',
    description: 'Ping the bot',
  })
  onPling(
    @Context() [message]: TextCommandContext,
    @Arguments() args: string[],
  ) {
    return message.reply(`pong! ${args.join(' ')}`);
  }

  @SlashCommand({
    name: 'ping',
    description: 'Ping the bot',
  })
  async ping(@Context() [interaction]: SlashCommandContext) {
    await interaction.reply('pong!');
  }

  @SlashCommand({
    name: 'length',
    description: 'Calculate the length of your text',
  })
  async onLength(
    @Context() [interaction]: SlashCommandContext,
    @Options() { text }: TextDto,
  ) {
    return interaction.reply({
      content: `The length of your text is: ${text.length}`,
    });
  }

  @UseInterceptors(CommandAutocompleteInterceptor)
  @SlashCommand({
    name: 'cat',
    description: 'Retrieve information about a specific cat breed',
  })
  public async onSearch(
    @Context() [interaction]: SlashCommandContext,
    @Options() { cat }: AutoDto,
  ) {
    return interaction.reply({
      content: `I found information on the breed of ${cat} cat!`,
    });
  }

  /**
   * 버튼은 메시지에 포함될 수 있는 상호 작용 요소입니다. 버튼을 클릭하면 애플리케이션에 상호 작용이 전송됩니다.
   */
  @Button('BUTTON')
  public onButtonClick(@Context() [interaction]: ButtonContext) {
    return interaction.reply({ content: 'Button clicked!' });
  }

  /**
   * 선택 메뉴는 메시지에 나타나는 또 다른 유형의 대화형 구성 요소입니다. 사용자가 옵션을 선택할 수 있도록 드롭다운과 유사한 사용자 인터페이스를 제공합니다.
   */
  @StringSelect('SELECT_MENU')
  public onSelectMenu(
    @Context() [interaction]: StringSelectContext,
    @SelectedStrings() values: string[],
  ) {
    return interaction.reply({ content: `You selected: ${values.join(', ')}` });
  }

  /**
   * 모달은 사용자가 형식화된 입력을 제출할 수 있는 팝업 양식입니다. Necord를 사용하여 모달을 만들고 관리하는 방법은 다음과 같습니다.
   */
  @Modal('pizza')
  public onModal(@Context() [interaction]: ModalContext) {
    return interaction.reply({
      content: `Your fav pizza : ${interaction.fields.getTextInputValue('pizza')}`,
    });
  }
}
