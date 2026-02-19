import { Command, PermissionLevel } from "@/classes/commnd";
import { Embed } from "@/classes/embed";
import { highlight } from "@/lib/utils";

export default new Command({
  name: "ping",
  description: "Pong! Replies with bot latency.",
  permission: PermissionLevel.User,
  execute: async (_client, interaction) => {
    const embed = new Embed({
      description: "Pinging...",
    });

    const sent = await interaction.reply({ embeds: [embed] });
    const createdTimestamp = sent?.createdAt.getTime();
    const latency = createdTimestamp ? createdTimestamp - interaction.createdAt.getTime() : -1;
    const latencyEmbed = new Embed({
      description: `Pong! ${highlight(`${latency}ms`)}`,
    });
    await sent?.edit({ embeds: [latencyEmbed] });
  },
});
