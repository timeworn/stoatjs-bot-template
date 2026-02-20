import { Event } from "@/classes/event";

export default new Event({
  name: "messageCreate",
  description: "Logs every message sent in the server",
  execute: (client, message) => {
    console.log(`${message.author?.username}: ${message.content}`);
  },
});
