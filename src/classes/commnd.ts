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

export interface ICommand {
  name: string;
  description?: string;
  aliases?: string[];
  cooldown?: number;
  permission: PermissionLevel;
  execute: (client: Client, message: Message) => Promise<any> | any;
}

export class Command implements ICommand {
  public readonly name: string;
  public readonly description?: string;
  public readonly aliases?: string[];
  public readonly cooldown?: number;
  public readonly permission: PermissionLevel;
  private executeCommand;

  constructor(options: ICommand) {
    this.name = options.name;
    this.description = options.description;
    this.aliases = options.aliases;
    this.cooldown = options.cooldown;
    this.permission = options.permission;
    this.executeCommand = options.execute;
  }

  public execute(client: Client, message: Message): Promise<void> | void {
    if (!message.authorId) return;
    if (!message.server) return;

    const member = message.server.getMember(message.authorId);
    if (!member) return;
    if (!hasPermission(member, this.permission)) return;
    return this.executeCommand(client, message);
  }
}
