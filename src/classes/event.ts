import type { Client } from "@/classes/client";
import type { AsyncEventEmitter } from "@vladfrangu/async_event_emitter";
import type { Client as StoatClient } from "stoat.js";

export type ClientEvents = StoatClient extends AsyncEventEmitter<infer Events> ? Events : never;

export interface IEvent<T extends keyof ClientEvents> {
  name: T;
  description?: string;
  once?: boolean;
  execute: (...args: [client: Client, ...ClientEvents[T]]) => void | Promise<void>;
}

export class Event<T extends keyof ClientEvents = keyof ClientEvents> implements IEvent<T> {
  public readonly name: T;
  public readonly description?;
  public readonly once?;
  public execute;

  constructor(options: IEvent<T>) {
    this.name = options.name;
    this.description = options.description;
    this.once = options.once;
    this.execute = options.execute;
  }
}
