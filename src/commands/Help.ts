import { ActionRowBuilder, ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, ButtonBuilder, Client, Collection, EmbedBuilder, InteractionReplyOptions, MessageOptions, PermissionFlagsBits, SelectMenuBuilder, SelectMenuInteraction, User } from "discord.js";
import config from "../config";
import { Command } from "../classes/Command";
import { Source } from "../classes/Source";
import { CommandOptionType, CommandType } from "../utils/enums";
import { HZCommandOptionData } from "../utils/types";

export default class Help extends Command<[string]> {
  constructor() {
    super({
      type: CommandType.Information, 
      name: 'help', 
      description: '顯示 HiZollo 的指令清單或查詢指令用法', 
      options: [{ 
        type: ApplicationCommandOptionType.String, 
        name: '指令名稱', 
        description: '要查詢的特定指令', 
        required: false
      }], 
      permissions: {
        bot: [PermissionFlagsBits.EmbedLinks]
      }
    });
  }

  public async execute(source: Source, [commandName]: [string]): Promise<void> {
    // 不給參數時就顯示所有指令
    if (!commandName) {
      await source.defer();
      const message = this.getMessageForAllTypes(source);
      await source.update(message);
      return;
    }

    // 給參數就顯示特定指令
    const command = source.client.commands.search([commandName, undefined]);
    if (!command || (command instanceof Command && command.type === CommandType.Developer && !source.channel?.isTestChannel())) {
      await source.defer({ ephemeral: true });
      await source.update(`這個指令不存在，請使用 \`${config.bot.prefix}help\` 或 \`/help\` 查看當前的指令列表`);
      return;
    }

    await source.defer();
    const embed = command instanceof Command ? this.getEmbedForCommand(source, command) : this.getEmbedForSubcommandGroup(source, commandName, command);
    await source.update({ embeds: [embed] });
  }
  

  public getMessageForAllTypes(source: Source): MessageOptions {
    return {
      components: this.getComponentsForAllTypes(), 
      embeds: this.getEmbedsForAllTypes(source)
    };
  }

  private componentsForAllTypes: ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[] | null = null;
  public getComponentsForAllTypes(): ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[] {
    if (this.componentsForAllTypes) return this.componentsForAllTypes;

    const menu = new SelectMenuBuilder()
      .setCustomId('help_menu_main')
      .setPlaceholder('請選擇一個指令分類');
    
    for (const type of Object.keys(this.commandTypeName)) {
      if (type === `${CommandType.Developer}`) continue;
      menu.addOptions({
        label: `${this.commandTypeName[type]}`, 
        description: this.commandTypeDescription[type], 
        emoji: '🔹', 
        value: type
      });
    }

    this.componentsForAllTypes = [
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(menu)
    ];
    return this.componentsForAllTypes;
  }

  private embedForAllTypes: EmbedBuilder[] | null = null;
  public getEmbedsForAllTypes(source: Source): EmbedBuilder[] {
    if (this.embedForAllTypes) return this.embedForAllTypes;
    
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'HiZollo 的幫助中心', iconURL: source.client.user?.displayAvatarURL() })
      .setDescription(`以下是我的指令列表，你可以使用 \`${config.bot.prefix}help 指令名稱\` 或 \`/help 指令名稱\` 來查看特定指令的使用方法`)
      .setHiZolloColor()
      .setFooter({ text: `${source.user.tag}．使用指令時不須連同 [] 或 <> 一起輸入`, iconURL: source.user.displayAvatarURL() })
      .setThumbnail(source.client.user?.displayAvatarURL({ extension: 'png', size: 2048 }) ?? null);

    let counter = 0;
    for (const type of Object.keys(this.commandTypeName)) {
      if (type === `${CommandType.Developer}`) continue;

      embed.addFields({
        name: `🔹 **${this.commandTypeName[type]}**`, 
        value: this.commandTypeDescription[type], 
        inline: true
      });
      counter++;
      if (counter % 2 === 1) {
        embed.addFields({ name: '\u200b',  value: '\u200b', inline: true });
      }
    }
    
    this.embedForAllTypes = [embed];
    return this.embedForAllTypes;
  }

  
  public getMessageForType(interaction: SelectMenuInteraction<"cached">, type: string): InteractionReplyOptions {
    return {
      components: this.getComponentsForType(interaction, type), 
      embeds: this.getEmbedsForType(interaction, type)
    };
  }

  public getComponentsForType(interaction: SelectMenuInteraction<"cached">, type: string): ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[] {
    const menu = new SelectMenuBuilder()
      .setCustomId('help_menu_type')
      .setPlaceholder('請選擇一個指令');
    
    interaction.client.commands.each(command => {
      if (command.type.toString() === type) {
        menu.addOptions({
          label: command.name, 
          description: command.description, 
          emoji: '🔹', 
          value: command.name
        });
      }
    });

    return [
      new ActionRowBuilder<SelectMenuBuilder>().addComponents(menu)
    ];
  }

  public getEmbedsForType(interaction: SelectMenuInteraction<"cached">, type: string): EmbedBuilder[] {
    let description =
      `以下是所有**${this.commandTypeName[type]}**分類中的指令\n` +
      `你可以使用 \`${config.bot.prefix}help 指令名稱\` 或 \`/help 指令名稱\` 來查看特定指令的使用方法\n\n`;

    const commands: string[] = [];
    interaction.client.commands.each(command => {
      if (command.type.toString() === type) {
        commands.push(`\`${command.name}\``);
      }
    });
    description += commands.join('．');

    return [
      new EmbedBuilder()
        .setAuthor({ name: 'HiZollo 的幫助中心', iconURL: interaction.client.user?.displayAvatarURL() })
        .setDescription(description)
        .setHiZolloColor()
        .setFooter({ text: `${interaction.user.tag}．使用指令時不須連同 [] 或 <> 一起輸入`, iconURL: interaction.user.displayAvatarURL() })
        .setThumbnail(interaction.client.user?.displayAvatarURL({ extension: 'png', size: 2048 }) ?? null)
    ];
  }

  public getEmbedForCommand(source: { client: Client, user: User }, command: Command<unknown>): EmbedBuilder {
    return new EmbedBuilder()
      .setAuthor({ name: 'HiZollo 的幫助中心', iconURL: source.client.user?.displayAvatarURL() })
      .setDescription(this.getDescriptionForCommand(command))
      .setHiZolloColor()
      .setThumbnail(source.client.user?.displayAvatarURL({ extension: 'png', size: 2048 }) ?? null)
      .setFooter({ text: `${source.user.tag}．使用指令時不須連同 [] 或 <> 一起輸入`, iconURL: source.user.displayAvatarURL() });
  }

  public getEmbedForSubcommandGroup(source: { client: Client, user: User }, groupName: string, commands: Collection<string, Command<unknown>>): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'HiZollo 的幫助中心', iconURL: source.client.user?.displayAvatarURL() })
      .setDescription(`這是 HiZollo 的 ${groupName} 指令清單`)
      .setHiZolloColor()
      .setThumbnail(source.client.user?.displayAvatarURL({ extension: 'png', size: 2048 }) ?? null)
      .setFooter({ text: `${source.user.tag}．使用指令時不須連同 [] 或 <> 一起輸入`, iconURL: source.user.displayAvatarURL() });

    commands.each(command => {
      let description = `** - 指令功能：**${command.description}\n` + this.getDescriptionForCommand(command, true);
      embed.addFields({ name: `${groupName} ${command.name}`, value: description });
    });
    return embed;
  }

  private getDescriptionForCommand(command: Command<unknown>, isSubcommand?: boolean): string {
    let description = !isSubcommand ? `\`${command.name}\`\n${command.description}\n` : '';
    if (!isSubcommand && command.extraDescription) description += `${command.extraDescription}\n`;
    if (!isSubcommand) description += '\n';
    if (command.aliases) description += `** - 替代名稱：**${command.aliases.map(a => `\`${a}\``).join(', ')}\n`;
    if (!isSubcommand && command.type) description += `** - 分類位置：**${this.commandTypeName[`${command.type}`]}\n`;
    if (command.options) description += `** - 指令參數：**${this.optionsToString(command.options)}`;
    if (command.cooldown) description += `** - 冷卻時間：**${command.cooldown} 秒\n`;
    return description;
  }
  
  private optionsToString(options: HZCommandOptionData[]): string {
    let description = '';
    description += `\`${options.map(option => this.getOptionNameString(option)).join(' ')}\`\n`;
    for (const option of options) {
      description += ` \`${this.getOptionNameString(option)}\`\n`;
      description += `　- 選項說明：${option.description}\n`
      description += `　- 規範型別：${this.getOptionTypeString(option.type, option.parseAs)}\n`;
      if ('choices' in option && option.choices) {
        description += `　- 規範選項：${option.choices.map(choice => this.getChoiceString(choice)).join('．')}\n`;
      }
    }
    return description;
  }

  private getOptionNameString(option: HZCommandOptionData): string {
    const pattern = option.required ? `[${option.name}]` : `<${option.name}>`;
    if (!option.repeat) return pattern;
    return `${pattern.replace(/\%i/g, '1')} ${pattern.replace(/\%i/g, '2')} ...`
  }

  private getOptionTypeString(type: ApplicationCommandOptionType, parseAs?: CommandOptionType): string {
    if (parseAs) {
      return this.commandOptionTypeTable[parseAs];
    }
    return this.applicationCommandOptionTypeTable[type];
  }

  private getChoiceString(choice: ApplicationCommandOptionChoiceData): string {
    return choice.name === choice.value.toString() ? `\`${choice.name}\`` : `\`${choice.name}\`/\`${choice.value}\``;
  }


  private commandTypeName = Object.freeze({
    [`${CommandType.Contact}`]: '聯繫', 
    [`${CommandType.Developer}`]: '開發者專用', 
    [`${CommandType.Fun}`]: '娛樂', 
    [`${CommandType.SinglePlayerGame}`]: '單人遊戲', 
    [`${CommandType.MultiPlayerGame}`]: '多人遊戲', 
    [`${CommandType.Information}`]: '資訊', 
    [`${CommandType.Miscellaneous}`]: '雜項', 
    [`${CommandType.Network}`]: '聯絡網', 
    [`${CommandType.SubcommandGroup}`]: '指令群', 
    [`${CommandType.Utility}`]: '功能'
  });

  private commandTypeDescription = Object.freeze({
    [`${CommandType.Contact}`]: '與 HiZollo 的開發者聯絡', 
    [`${CommandType.Developer}`]: '開發者專用指令', 
    [`${CommandType.Fun}`]: '適合在聊天室跟朋友玩樂', 
    [`${CommandType.SinglePlayerGame}`]: '讓你在沒人的凌晨三點邊吃美味蟹堡邊玩遊戲', 
    [`${CommandType.MultiPlayerGame}`]: '跟伺服器上的夥伴一起玩遊戲', 
    [`${CommandType.Information}`]: '顯示 HiZollo 的相關資訊', 
    [`${CommandType.Miscellaneous}`]: '開發者懶得分類的指令', 
    [`${CommandType.Network}`]: '查看 HiZollo 聯絡網的相關功能', 
    [`${CommandType.SubcommandGroup}`]: '集合很多指令的指令', 
    [`${CommandType.Utility}`]: 'HiZollo 多少還是會一些有用的功能好嗎'
  });

  private applicationCommandOptionTypeTable: { [key in ApplicationCommandOptionType]: string } = Object.freeze({
    [ApplicationCommandOptionType.Attachment]: '檔案', 
    [ApplicationCommandOptionType.Boolean]: '布林值', 
    [ApplicationCommandOptionType.Channel]: '頻道', 
    [ApplicationCommandOptionType.Integer]: '整數', 
    [ApplicationCommandOptionType.Mentionable]: '使用者或身分組', 
    [ApplicationCommandOptionType.Number]: '數字', 
    [ApplicationCommandOptionType.Role]: '身分組', 
    [ApplicationCommandOptionType.String]: '字串', 
    [ApplicationCommandOptionType.Subcommand]: '子指令', 
    [ApplicationCommandOptionType.SubcommandGroup]: '指令群', 
    [ApplicationCommandOptionType.User]: '使用者'
  });

  private commandOptionTypeTable: { [key in CommandOptionType]: string } = Object.freeze({
    [CommandOptionType.Attachment]: '檔案', 
    [CommandOptionType.Boolean]: '布林值', 
    [CommandOptionType.Channel]: '頻道', 
    [CommandOptionType.Emoji]: '表情符號', 
    [CommandOptionType.Integer]: '整數', 
    [CommandOptionType.Member]: '伺服器成員', 
    [CommandOptionType.Mentionable]: '使用者或身分組', 
    [CommandOptionType.Number]: '數字', 
    [CommandOptionType.Role]: '身分組', 
    [CommandOptionType.String]: '字串', 
    [CommandOptionType.Subcommand]: '子指令', 
    [CommandOptionType.SubcommandGroup]: '指令群', 
    [CommandOptionType.User]: '使用者'
  });
}