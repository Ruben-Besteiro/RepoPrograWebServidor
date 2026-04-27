// El escuchador escucha cuando algún controlador emite un evento
// Por ejemplo cuando hacemos registro y es hora de mandar un correo
import eventService from '../services/event.service.js';
import { sendVerificationEmail } from '../services/mail.service.js';

// Listener for user registered
eventService.on('user:registered', async (user) => {
    console.log(`[EVENT] user:registered - User: ${user.fullName}, Email: ${user.email}`);

    if (user.verificationCode) {
        // Aquí llamamos al mail.service.ts
        // Con esto se cumple lo de que el usuario está verificado cuando se le envía el correo
        await sendVerificationEmail(user.email, user.verificationCode);
    }
});

// Listener for user verified
eventService.on('user:verified', (user) => {
    console.log(`[EVENT] user:verified - User: ${user.fullName}, Email: ${user.email}`);
});

// Listener for user invited
eventService.on('user:invited', (user) => {
    console.log(`[EVENT] user:invited - User: ${user.fullName}, Email: ${user.email}`);
});

// Listener for user deleted
eventService.on('user:deleted', (userData) => {
    console.log(`[EVENT] user:deleted - User Data: ${JSON.stringify(userData)}`);
});

console.log('✅ User listeners registered');
