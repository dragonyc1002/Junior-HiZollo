import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../classes/Command";
import { Source } from "../classes/Source";
import randomElement from "../features/utils/randomElement";
import { CommandType } from "../utils/enums";

export default class Choose extends Command<string[]> {
  constructor() {
    super({
      type: CommandType.Utility, 
      name: 'choose', 
      description: '讓 HiZollo 來拯救你的選擇困難症', 
      options: [{ 
        type: ApplicationCommandOptionType.String, 
        name: '選項%i', 
        description: '要抽出的選項', 
        required: false, 
        repeat: true
      }]
    });
  }

  public async execute(source: Source, options: string[]): Promise<void> {
    options = options.filter(o => o);

    if (options.length < 2) {
      await source.defer({ ephemeral: true });
      await source.update('請給我兩個以上的選項，不然我是要怎麼選');
      return;
    }

    const option = randomElement(options);
    await source.defer();
    await source.update(randomElement(this.replys).replace('<>', option));
  }

  private replys = [
    '我選 <>', '我的話會選 <>', '我想選 <>' ,  '我選擇 <>', '選 <> 好了',
    '<>，我選這個', '<>，如何', '也許 <> 是 ok 的', '<>？', '我認為 <> 是最好的',
    '<> 好像比較好，你覺得呢？', '<> 吧'
  ];
}