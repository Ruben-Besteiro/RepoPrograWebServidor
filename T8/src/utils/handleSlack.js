// src/utils/handleSlack.js
import { IncomingWebhook } from '@slack/webhook';
import 'dotenv/config';

const url = process.env.SLACK_WEBHOOK;
const webhook = url ? new IncomingWebhook(url) : null;

/**
 * Enviar mensaje a Slack
 * @param {string} text - Contenido del mensaje
 */
export const sendSlackMessage = async (text) => {
    if (!webhook) {
        console.error('SLACK_WEBHOOK no configurado en el archivo .env');
        return;
    }

    try {
        await webhook.send({
            text: text,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `${text}`
                    }
                }
            ]
        });
        console.log('Mensaje de Slack enviado');
    } catch (error) {
        console.error('Error al enviar mensaje a Slack:', error);
    }
};

/**
 * Interface para Morgan/loggerStream
 */
export const loggerStream = {
    write: (message) => {
        if (webhook) {
            webhook.send({
                text: `🚨 *Error en API*\n\`\`\`${message}\`\`\``
            }).catch(err => console.error('Error enviando a Slack:', err));
        }
        console.error(message);
    }
};
