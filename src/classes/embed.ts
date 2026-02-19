import type { SendableEmbed } from "stoat-api";

export class Embed implements SendableEmbed {
  public icon_url?: string | null | undefined;
  public url?: string | null | undefined;
  public title?: string | null | undefined;
  public description?: string | null | undefined;
  public media?: string | null | undefined;
  public colour?: string | null | undefined;

  constructor(options: SendableEmbed) {
    Object.assign(this, options);
  }
}
