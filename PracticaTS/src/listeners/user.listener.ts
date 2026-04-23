import eventService from '../services/event.service.js';

// Listener for user registered
eventService.on('user:registered', (user) => {
    console.log(`[EVENT] user:registered - User: ${user.fullName}, Email: ${user.email}`);
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
