import { Command } from "@/classes/commnd";
import { Event } from "@/classes/event";
import { logger } from "@/lib/utils";
import { readdirSync } from "fs";
import { basename, extname, join } from "path";
import { pathToFileURL } from "url";
import { Client as StoatClient } from "stoat.js";

export type CommandGroupConfig = { command: Command; name: string };

export class Client extends StoatClient {
  private commands = new Map<string, Command>();
  public cooldowns = new Map<string, Map<string, number>>();

  constructor() {
    super();
  }

  private isCommandFile(fileName: string): boolean {
    const ext = extname(fileName);
    return ext === ".js" || ext === ".ts";
  }

  private getFileBaseName(fileName: string): string {
    return basename(fileName, extname(fileName));
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

  private async loadCommandsFrom(
    path: string,
    group: string[],
    parentConfig: CommandGroupConfig[] = [],
  ): Promise<void> {
    const entries = readdirSync(path, { withFileTypes: true });
    const indexEntry = entries.find((entry) => {
      return (
        entry.isFile() && this.isCommandFile(entry.name) && this.getFileBaseName(entry.name).toLowerCase() === "index"
      );
    });

    let groupConfig: CommandGroupConfig[] = parentConfig;

    if (indexEntry) {
      const indexPath = join(path, indexEntry.name);
      const { default: command } = await import(pathToFileURL(indexPath).href);

      if (command instanceof Command) {
        const commandName = command.name.length === 0 ? group.join(" ") : [...group, command.name].join(" ");

        if (command.executeCommand) {
          this.registerCommand(command, commandName, parentConfig);
        }

        groupConfig = [...parentConfig, { command, name: commandName }];
      } else {
        logger.warn(`The command at ${indexPath} is not an instance of Command.`);
      }
    }

    for (const entry of entries) {
      const entryPath = join(path, entry.name);

      if (entry.isDirectory()) {
        await this.loadCommandsFrom(entryPath, [...group, entry.name], groupConfig);
        continue;
      }

      if (!entry.isFile() || !this.isCommandFile(entry.name)) continue;

      const fileName = this.getFileBaseName(entry.name);
      if (fileName.toLowerCase() === "index") continue;

      const { default: command } = await import(pathToFileURL(entryPath).href);

      if (!(command instanceof Command)) {
        logger.warn(`The command at ${entryPath} is not an instance of Command.`);
        continue;
      }

      const immediateGroup = groupConfig.length > 0 ? groupConfig[groupConfig.length - 1] : null;

      if (immediateGroup && !command.wasPermSet) {
        command.permission = immediateGroup.command.permission;
      }

      if (immediateGroup && command.cooldown === undefined && immediateGroup.command.cooldown !== undefined) {
        command.cooldown = immediateGroup.command.cooldown;
      }

      let commandName: string;
      if (immediateGroup) {
        const depth = immediateGroup.name.split(" ").length;
        const intermediateFolders = group.slice(depth);
        commandName = [immediateGroup.name, ...intermediateFolders, command.name || fileName].join(" ");
      } else {
        commandName = [...group, command.name || fileName].join(" ") || fileName;
      }

      this.registerCommand(command, commandName, groupConfig);
    }
  }

  public async loadCommands(path: string) {
    await this.loadCommandsFrom(path, [], []);
    logger.info(`Loaded ${this.commands.size} commands.`);
    logger.info(`Commands: ${Array.from(new Set(this.commands.keys())).join(", ")}`);
  }

  private getAliases(segments: string[], configs: CommandGroupConfig[]): string[] {
    const groupAliasByIndex = new Map<number, string[]>();
    for (const config of configs) {
      if (config.command.aliases?.length) {
        const pos = config.name.split(" ").length - 1;
        groupAliasByIndex.set(pos, config.command.aliases);
      }
    }

    const segmentOptions = segments.map((segment, i) => {
      const aliases = groupAliasByIndex.get(i);
      return aliases ? [segment, ...aliases] : [segment];
    });

    return segmentOptions
      .reduce<
        string[][]
      >((combinations, options) => combinations.flatMap((parts) => options.map((option) => [...parts, option])), [[]])
      .map((parts) => parts.join(" "));
  }

  public registerCommand(command: Command, nameOverride?: string, groupChain: CommandGroupConfig[] = []) {
    const commandName = nameOverride ?? command.name;
    const segments = commandName.split(" ");
    const baseSegments = segments.slice(0, -1);

    for (const variant of this.getAliases(segments, groupChain)) {
      this.commands.set(variant, command);
    }

    for (const alias of command.aliases ?? []) {
      for (const variant of this.getAliases([...baseSegments, alias], groupChain)) {
        this.commands.set(variant, command);
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
