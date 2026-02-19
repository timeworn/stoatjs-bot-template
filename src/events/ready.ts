import { Event } from "@/classes/event";
import { logger } from "@/lib/utils";
import type { API } from "stoat.js";

export default new Event({
  name: "ready",
  execute(client) {
    const status = process.env.BOT_STATUS || "Online";
    client.user?.edit({ status: { presence: status as API.Presence } });
    logger.info(`Status set to ${status}`);
    logger.info(`Ready! Logged in as ${client.user?.username}#${client.user?.discriminator}`);
  },
});
