const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

function containsLink(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(message);
}

function extractSeconds(durationText) {
    const secondsRegex = /(\d+) seconds/;
    const match = durationText.match(secondsRegex);
    return match ? Number(match[1]) : undefined;
}

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


async function searchSong(query) {
    const searchResults = await ytSearch(query);
    const video = searchResults.videos[0];
    return {
        title: video.title,
        duration: video.duration,
        url: video.url,
        thumbnail: video.thumbnail,
    };
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
        
        songInfo = await searchSong(`${artist} ${input}`);
        const seconds = extractSeconds(songInfo.duration);
        if (seconds !== undefined) {
            songInfo.duration = seconds;
        } else {
            return message.reply('No se pudo extraer la duración de la canción.');
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
            
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        }

        const embed = {
            title: `Ahora suena`,
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
