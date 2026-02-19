import { Event } from "@/classes/event";
import { logger } from "@/lib/utils";

export default new Event({
  name: "messageCreate",
  execute(client, message) {
    if (message.author?.bot) return;

    const prefix = process.env.PREFIX || "!";
    const content = message.content || "";
    if (!content.startsWith(prefix)) return;

    const trimmed = content.slice(prefix.length).trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    let command;
    let commandName = "";

    for (let i = parts.length; i >= 1; i -= 1) {
      const name = parts.slice(0, i).join(" ");
      const found = client.getCommand(name);
      if (found) {
        command = found;
        commandName = name;
        break;
      }
    }

    if (!command) return;

    const cooldownSeconds = command.cooldown ?? 0;
    if (cooldownSeconds > 0) {
      const userId = message.authorId;
      if (!userId) return;

      const now = Date.now();
      const commandCooldowns = client.cooldowns.get(commandName) ?? new Map<string, number>();
      const cooldownMs = cooldownSeconds * 1000;
      const expiresAt = commandCooldowns.get(userId);

      if (expiresAt && now < expiresAt) {
        return;
      }

      commandCooldowns.set(userId, now + cooldownMs);
      client.cooldowns.set(commandName, commandCooldowns);
      setTimeout(() => {
        commandCooldowns.delete(userId);
        if (commandCooldowns.size === 0) {
          client.cooldowns.delete(commandName);
        }
      }, cooldownMs);
    }

    try {
      const result = command.execute(client, message);
      if (result && typeof result.catch === "function") {
        void result.catch((error) => {
          logger.error({ error, command: commandName }, "Command execution failed");
        });
      }
    } catch (error) {
      logger.error({ error, command: commandName }, "Command execution failed");
    }
  },
});
