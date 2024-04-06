const { Player } = require('discord-player');

module.exports = async (message) => {
    const args = message.content.split(' ').slice(1);

    const queue = Player.getQueue(message.guild.id);

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.channel.send('¡Debes estar en un canal de voz para reproducir música!');
    
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('¡No tengo permisos para unirme y hablar en ese canal de voz!');
    }

    if (!args.length) return message.channel.send('¡Debes proporcionar el nombre de una canción o un enlace de YouTube!');

    const player = Player.play(message, args.join(' '), {
        quality: 'high',
    });

    player.on('error', (queue, error) => {
        console.error(error);
        queue.textChannel.send(`Ocurrió un error al reproducir la canción: ${error}`);
    });

    player.on('connectionError', (queue, error) => {
        console.error(error);
        queue.textChannel.send(`Ocurrió un error al conectar al canal de voz: ${error}`);
    });

    player.on('trackStart', (queue, track) => {
        message.channel.send(`🎵 Ahora reproduciendo: **${track.title}**`);
    });

    player.on('queueEnd', (queue) => {
        message.channel.send('🎵 La lista de reproducción ha terminado.');
        Player.remove(message.guild.id);
    });
};
