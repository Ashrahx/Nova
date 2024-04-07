const { Player } = require('discord-player');

module.exports = async (message, client) => {
    const player = new Player(client);
    const args = message.content.slice(1).trim().split(/ +/);
    const link = args[1];

    if (!link) {
        return message.reply('Debes proporcionar un enlace de YouTube.');
    }

    // Verificar si el autor del mensaje está en un canal de voz
    const memberVoiceChannel = message.member.voice.channel;
    if (!memberVoiceChannel) {
        return message.reply('Debes estar en un canal de voz para reproducir música.');
    }

    try {
        // Unirse al canal de voz del autor del mensaje
        const connection = await memberVoiceChannel.join();

        // Verificar permisos para el bot en el canal de voz
        const permissions = memberVoiceChannel.permissionsFor(client.user);
        if (!permissions.has('SPEAK')) {
            throw new Error('No tengo permisos para hablar en tu canal de voz.');
        }

        // Reproducir música en el canal de voz del autor del mensaje
        await player.play(message, link);
        message.reply(`Reproduciendo ${link}`);
    } catch (error) {
        console.error('Error al reproducir música:', error.message);
        message.reply('Ocurrió un error al reproducir la música.');
    }
};
