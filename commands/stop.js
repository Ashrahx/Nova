const { getVoiceConnection } = require('@discordjs/voice');

module.exports = async (message, client) => {
    // Check if the bot is currently playing music in the guild
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) {
        return message.reply('No estoy reproduciendo música en este momento.');
    }

    // Stop the playback
    connection.destroy();
    message.reply('He detenido la reproducción de música.');
};
