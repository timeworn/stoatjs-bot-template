import "dotenv/config";
import { Client } from "@/classes/client";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client();

const commandFolderPath = join(__dirname, "commands");
const eventFolderPath = join(__dirname, "events");

client.loadCommands(commandFolderPath);
client.loadEvents(eventFolderPath);

client.loginBot(process.env.TOKEN!);
