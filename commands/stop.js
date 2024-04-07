const { getVoiceConnection } = require('@discordjs/voice');

module.exports = async (message, client) => {
    // Verifica si el bot está reproduciendo algo
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) {
        return message.reply('No estoy reproduciendo música en este momento.');
    }

    // Detiene la música
    connection.destroy();
    message.reply('He detenido la reproducción de música.');
};
