import { EventEmitter } from 'node:events';

// Con esto lo que se hace es crear una instancia del Event Emitter
// Los eventos los llaman los controladores eventService.emit('user:registered', user);
// Luego el user.listener lo escucha y ejecuta el código que queramos
class EventService extends EventEmitter { }

// Tener esto en 2 líneas parece redundante pero si no Railway peta
const eventService = new EventService();
export default eventService;