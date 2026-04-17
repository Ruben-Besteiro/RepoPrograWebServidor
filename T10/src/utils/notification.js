import webpush from 'web-push';

export const setupWebPush = () => {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
};

export const sendPushNotification = async (subscription, payload) => {
    if (!subscription) return;

    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 410) {
            console.log('Push subscription has expired or is no longer valid');
            // Aquí se podría eliminar la suscripción del usuario en la base de datos
        } else {
            console.error('Error sending push notification:', error);
        }
    }
};
