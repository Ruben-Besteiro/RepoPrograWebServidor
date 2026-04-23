import { EventEmitter } from 'node:events';

class EventService extends EventEmitter { }

const eventService = new EventService();

export default eventService;
