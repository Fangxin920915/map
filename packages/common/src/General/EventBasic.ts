import { EventData } from "@common/Types";
import { IEventImp } from "@common/Interfaces";

export class EventBasic implements IEventImp {
  _listeners: { [K in keyof EventData]?: EventData[K][] };

  constructor() {
    this._listeners = {};
  }

  init(): void {
    this._listeners = {};
  }

  destroy(): void {
    this._listeners = {};
  }

  addEventListener<K extends keyof EventData>(
    event: K,
    listener: EventData[K],
  ) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event]?.push(listener);
  }

  removeEventListener<K extends keyof EventData>(
    event: K,
    listener: EventData[K],
  ) {
    if (this._listeners[event] && this._listeners[event].length > 0) {
      // @ts-ignore
      this._listeners[event] = this._listeners[event].filter(
        (l) => l !== listener,
      );
    }
  }

  triggerListener<K extends keyof EventData>(
    event: K,
    ...args: Parameters<EventData[K]>
  ) {
    if (this._listeners[event]) {
      this._listeners[event].forEach((callback) => {
        // @ts-ignore
        callback(...args);
      });
    }
  }
}
