
export const sendSlackMessage = async (error: any) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('SLACK_WEBHOOK_URL no está definida. Saltando notificación.');
        return;
    }

    const payload = {
        text: `*Error 500 en la API*`,
        attachments: [
            {
                color: '#ff0000',
                fields: [
                    {
                        title: 'Mensaje',
                        value: error.message || 'Sin mensaje',
                        short: false
                    },
                    {
                        title: 'Status Code',
                        value: error.statusCode?.toString() || '500',
                        short: true
                    },
                    {
                        title: 'Entorno',
                        value: process.env.NODE_ENV || 'production',
                        short: true
                    }
                ],
                text: error.stack ? `*Stack Trace:*\n\`\`\`${error.stack.substring(0, 500)}...\`\`\`` : 'No stack trace available',
                footer: 'API Error Monitor',
                ts: Math.floor(Date.now() / 1000)
            }
        ]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`Error enviando a Slack: ${response.statusText}`);
        } else {
            console.log('Notificación enviada a Slack');
        }
    } catch (err) {
        console.error('Error de red enviando a Slack:', err);
    }
};
