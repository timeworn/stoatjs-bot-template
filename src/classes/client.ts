import { Command } from "@/classes/commnd";
import { Event } from "@/classes/event";
import { logger } from "@/lib/utils";
import { readdirSync } from "fs";
import { basename, extname, join } from "path";
import { pathToFileURL } from "url";
import { Client as StoatClient } from "stoat.js";

export class Client extends StoatClient {
  private commands = new Map<string, Command>();
  public cooldowns = new Map<string, Map<string, number>>();

  constructor() {
    super();
  }

  private async loadCommandsFrom(path: string, group: string[]) {
    const entries = readdirSync(path, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(path, entry.name);

      if (entry.isDirectory()) {
        await this.loadCommandsFrom(entryPath, [...group, entry.name]);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const fileExtension = extname(entry.name);
      if (fileExtension !== ".js" && fileExtension !== ".ts") {
        continue;
      }

      const fileBaseName = basename(entry.name, fileExtension);
      const isIndex = fileBaseName.toLowerCase() === "index";
      const commandSegments = isIndex ? group : [...group, fileBaseName];
      const commandName = commandSegments.length > 0 ? commandSegments.join(" ") : fileBaseName;
      const { default: command } = await import(pathToFileURL(entryPath).href);

      if (command instanceof Command) {
        this.registerCommand(command, commandName);
      } else {
        logger.warn(`The command at ${entryPath} is not an instance of Command and was not registered.`);
      }
    }
  }

  public async loadCommands(path: string) {
    await this.loadCommandsFrom(path, []);
    logger.info(`Loaded ${this.commands.size} commands.`);
    logger.info(`Commands: ${Array.from(new Set(this.commands.keys())).join("\n- ")}`);
  }

  public async loadEvents(path: string) {
    const eventFiles = readdirSync(path).filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

    for (const file of eventFiles) {
      const filePath = join(path, file);
      const { default: event } = await import(pathToFileURL(filePath).href);
      if (event instanceof Event) {
        const handler = (...args: any) => event.execute(this, ...args);
        if (event.once) {
          this.once(event.name, handler);
        } else {
          this.on(event.name, handler);
        }
      } else {
        logger.warn(`The event at ${filePath} is not an instance of Event and was not registered.`);
      }
    }
  }

  public registerCommand(command: Command, nameOverride?: string) {
    const commandName = nameOverride ?? command.name;
    this.commands.set(commandName, command);

    if (command.aliases) {
      const baseSegments = commandName.split(" ").slice(0, -1);

      for (const alias of command.aliases) {
        const aliasName = [...baseSegments, alias].join(" ");
        this.commands.set(aliasName, command);
      }
    }
  }

  public getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }

  public getCommands(): Command[] {
    const uniqueCommands = new Set<Command>(this.commands.values());
    return Array.from(uniqueCommands);
  }
}
