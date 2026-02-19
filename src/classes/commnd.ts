import type { Client } from "@/classes/client";
import { hasPermission } from "@/lib/utils";
import type { Message } from "stoat.js";

export enum PermissionLevel {
  User = 0,
  Moderator = 1,
  Administrator = 2,
  Owner = 3,
  BotOwner = 4,
}

export type CommandUsedIn = "guild" | "dm" | "both";

export interface ICommand {
  name: string;
  description?: string;
  aliases?: string[];
  cooldown?: number;
  permission: PermissionLevel;
  usedIn?: CommandUsedIn;
  execute: (client: Client, message: Message) => Promise<any> | any;
}

export class Command implements ICommand {
  public readonly name: string;
  public readonly description?: string;
  public readonly aliases?: string[];
  public readonly cooldown?: number;
  public readonly permission: PermissionLevel;
  public readonly usedIn: CommandUsedIn;
  private executeCommand;

  constructor(options: ICommand) {
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases;
    this.cooldown = options.cooldown;
    this.permission = options.permission;
    this.usedIn = options.usedIn || "guild";
    this.executeCommand = options.execute;
  }

  public execute(client: Client, message: Message): Promise<void> | void {
    if (!message.authorId) return;
    if (this.usedIn !== "both") {
      if (this.usedIn === "guild" && !message.server) return;
      if (this.usedIn === "dm" && message.server) return;
    }

    if (!message.server) {
      if (this.permission !== PermissionLevel.User) return;
      return this.executeCommand(client, message);
    }

    const member = message.server.getMember(message.authorId);
    if (!member) return;
    if (!hasPermission(member, this.permission)) return;
    return this.executeCommand(client, message);
  }
}
