module.exports = async (message, client) => {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Verificar si el autor del mensaje es un administrador
    if (!message.member.permissions.has('ADMINISTRATOR')) {
        return message.reply('Solo los administradores pueden utilizar este comando.');
    }

    // Verificar si se proporciona un número válido de mensajes a eliminar
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) {
        return message.reply('Por favor, proporciona un número válido de mensajes a eliminar.');
    }

    try {
        // Eliminar los mensajes del canal en lotes de 100 o menos
        const messagesToDelete = await message.channel.messages.fetch({ limit: Math.min(amount, 100) });
        await message.channel.bulkDelete(messagesToDelete);
        message.channel.send(`Se eliminaron ${messagesToDelete.size} mensajes correctamente.`)
            .then(msg => {
                // Eliminar el mensaje después de unos segundos
                setTimeout(() => msg.delete(), 5000);
            });
    } catch (error) {
        console.error('Error al eliminar mensajes:', error);
        message.reply('Ocurrió un error al eliminar los mensajes.');
    }
};
