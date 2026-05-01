import { EventEmitter } from 'node:events';

class EventService extends EventEmitter { }

// Tener esto en 2 líneas parece redundante pero si no Railway peta
const eventService = new EventService();
export default eventService;