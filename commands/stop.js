const { getVoiceConnection } = require('@discordjs/voice');

module.exports = async (message, client) => {
    // Verifica si el bot está reproduciendo algo
    const connection = getVoiceConnection(message.guild.id);
    if (!connection) {
        return message.reply('No estoy reproduciendo música en este momento.');
    }

    // Detiene la música
    connection.destroy();
    const embed = {
        title: 'Desconectado',
        description: 'El bot se ha desconectado del canal de voz.',
        color: 0x8a5bff,
        thumbnail: {url: client.user.avatarURL()},
    };
    message.channel.send({ embeds: [embed] });
    message.delete();
};
