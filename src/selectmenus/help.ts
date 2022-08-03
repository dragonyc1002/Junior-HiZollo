import { Collection, SelectMenuInteraction } from "discord.js";
import { Command } from "../classes/Command";
import Help from "../commands/Help";

export default async function help(interaction: SelectMenuInteraction<"cached">): Promise<void> {
  const help = interaction.client.commands.search(['help', undefined]) as Help;
  const scope = interaction.customId.slice('help_menu_'.length);
  const selected = interaction.values[0];

  if (scope === 'main') {
    const message = help.getMessageForType(interaction, selected);
    await interaction.reply({ ephemeral: true, ...message });
    return;
  }
  if (scope === 'type') {
    const command = interaction.client.commands.search([selected, undefined]) as Command<unknown> | Collection<string, Command<unknown>>;
    const embed = command instanceof Command ? help.getEmbedForCommand(interaction, command) : help.getEmbedForSubcommandGroup(interaction, selected, command);
    await interaction.reply({ ephemeral: true, embeds: [embed] });
    return
  }
}