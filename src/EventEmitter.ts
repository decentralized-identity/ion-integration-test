import IEventEmitter from './interfaces/IEventEmitter';

/**
 * Event emitter used in Sidetree.
 * Intended to be machine readable for triggering custom handlers.
 */
export default class EventEmitter {
  // Default to basic console log.
  private static singleton: IEventEmitter = {
    emit: async (eventCode) => {
      console.log(`Event emitted: ${eventCode}`);
    }
  };

  /**
   * Overrides the default event emitter if given.
   */
  static initialize (customEventEmitter?: IEventEmitter) {
    if (customEventEmitter !== undefined) {
      EventEmitter.singleton = customEventEmitter;
    }
  }

  /**
   * Emits an event.
   */
  public static async emit (eventName: string, eventData?: {[property: string]: any}): Promise<void> {
    await EventEmitter.singleton.emit(eventName, eventData);
  }
}
