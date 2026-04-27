import { EventData } from "@common/Types";
import { IBase } from "./IBase";

export interface IEventImp extends IBase {
  addEventListener<K extends keyof EventData>(
    event: K,
    listener: EventData[K],
  ): void;

  removeEventListener<K extends keyof EventData>(
    event: K,
    listener: EventData[K],
  ): void;

  triggerListener<K extends keyof EventData>(
    event: K,
    ...args: Parameters<EventData[K]>
  ): void;
}

export interface IEventManagerImp extends Omit<IEventImp, "triggerListener"> {}
