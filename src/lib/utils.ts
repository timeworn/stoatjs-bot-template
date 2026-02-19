import { PermissionLevel } from "@/classes/commnd";
import pino from "pino";
import type { ServerMember } from "stoat.js";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
    level: process.env.LOG_LEVEL || "info",
  },
});

export const hasPermission = (member: ServerMember, required: PermissionLevel): boolean => {
  const level = getPermissionLevel(member);
  return level >= required;
};

export const getPermissionLevel = (member: ServerMember): PermissionLevel => {
  if (member.user?.id === process.env.BOT_OWNER_ID) return PermissionLevel.BotOwner;
  if (member.hasPermission(member.server!, "ManageServer")) return PermissionLevel.Administrator;
  if (member.hasPermission(member.server!, "KickMembers")) return PermissionLevel.Moderator;
  return PermissionLevel.User;
};

export const highlight = (text: string): string => `\`${text}\``;
