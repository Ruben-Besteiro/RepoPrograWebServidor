// El escuchador escucha cuando algún controlador emite un evento
// Por ejemplo cuando hacemos registro y es hora de mandar un correo
import eventService from '../services/event.service.js';
import { sendVerificationEmail } from '../services/mail.service.js';

// Escuchador de registro
eventService.on('user:registered', async (user) => {
    console.log(`[EVENT] user:registered - User: ${user.fullName}, Email: ${user.email}`);

    if (user.verificationCode) {
        console.log(`[EVENT] user:registered - Calling sendVerificationEmail for ${user.email}`);
        try {
            // Aquí llamamos al mail.service.ts
            // Con esto se cumple lo de que el usuario está verificado cuando se le envía el correo
            await sendVerificationEmail(user.email, user.verificationCode, user.fullName || user.name || 'Usuario');
            console.log(`[EVENT] user:registered - sendVerificationEmail completed for ${user.email}`);
        } catch (error) {
            console.error(`[EVENT] user:registered - Error calling sendVerificationEmail for ${user.email}:`, error);
        }
    } else {
        console.warn(`[EVENT] user:registered - No verificationCode found for user ${user.email}, skipping email`);
    }
});

// Escuchador de usuario verificado
eventService.on('user:verified', (user) => {
    console.log(`[EVENT] user:verified - User: ${user.fullName}, Email: ${user.email}`);
});

// Escuchador de usuario invitado
eventService.on('user:invited', (user) => {
    console.log(`[EVENT] user:invited - User: ${user.fullName}, Email: ${user.email}`);
});

// Escuchador de usuario eliminado
eventService.on('user:deleted', (userData) => {
    console.log(`[EVENT] user:deleted - User Data: ${JSON.stringify(userData)}`);
});