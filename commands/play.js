const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

// Function to check if the message contains a link
function containsLink(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(message);
}

// Function to get song information from a link
async function getSongInfoFromLink(url) {
    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;
        return {
            title: videoDetails.title,
            artist: videoDetails.author.name,
            url: videoDetails.video_url,
            thumbnail: videoDetails.thumbnails[0].url,
        };
    } catch (error) {
        console.error('Error al obtener información de la canción:', error);
        return null;
    }
}

// Modified searchSong function to return multiple results
async function searchSong(query) {
    const searchResults = await ytSearch(query);
    return searchResults.videos.slice(0, 6).map(video => ({
        title: video.title,
        duration: video.duration,
        url: video.url,
        thumbnail: video.thumbnail,
    }));
}

// New function to send song options and handle selection
async function sendSongOptions(message, options) {
    const embed = {
        title: 'Selecciona una canción',
        description: options.map((option, index) => `${index + 1}. ${option.title}`).join('\n'),
        color: 0x8a5bff,
    };
    message.channel.send({ embeds: [embed] });

    const filter = m => !isNaN(m.content) && parseInt(m.content) <= options.length && parseInt(m.content) > 0;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (collected.size === 0) {
        return null;
    }

    const selection = parseInt(collected.first().content) - 1;
    return options[selection];
}

module.exports = async (message, client) => {
    const memberVoiceChannel = message.member.voice.channel;
    if (!memberVoiceChannel) {
        return message.reply('Debes estar en un canal de voz para que el bot pueda reproducir música.');
    }

    let songInfo;
    if (containsLink(message.content)) {
        const url = message.content.match(/(https?:\/\/[^\s]+)/g)[0];
        songInfo = await getSongInfoFromLink(url);
        if (!songInfo) {
            return message.reply('No se pudo obtener información de la canción.');
        }
    } else {
        const args = message.content.split(' ');
        if (args.length < 3) {
            return message.reply('Por favor, proporciona el nombre de una canción y el nombre del artista para reproducir.');
        }

        const input = args[1];
        const artist = args[2];
        
        const options = await searchSong(`${artist} ${input}`);
        if (options.length === 0) {
            return message.reply('No se encontraron canciones.');
        }

        songInfo = await sendSongOptions(message, options);
        if (!songInfo) {
            return message.reply('No se seleccionó ninguna canción.');
        }
    }

    const connection = joinVoiceChannel({
        channelId: memberVoiceChannel.id,
        guildId: memberVoiceChannel.guild.id,
        adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    try {
        const stream = ytdl(songInfo.url, { filter: 'audioonly' });
        const resource = createAudioResource(stream);
        player.play(resource);

        function formatDuration(seconds) {
            if (typeof seconds !== 'number') {
                return undefined;
            }
        
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }

        const embed = {
            title: `🎧 Ahora suena`,
            description: `${songInfo.title}\n**Duración**: ${formatDuration(songInfo.duration)}`,
            color: 0x8a5bff,
            thumbnail: {url: songInfo.thumbnail},
            footer: {text: `Pedida por ${message.author.username}`},
        };
        message.channel.send({ embeds: [embed] }).then(() => {
    
            message.delete().catch(error => {
                console.error('Error al borrar el mensaje:', error);
            });
        });

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy();
            const embed = {
                title: 'Desconectado',
                description: 'El bot se ha desconectado del canal de voz.',
                color: 0x8a5bff,
                thumbnail: {url: client.user.avatarURL()},
            };
            message.channel.send({ embeds: [embed] });
        });

    } catch (error) {
        console.error('Error al reproducir la canción:', error);
        message.reply('Ocurrió un error al reproducir la canción.');
    }
};
