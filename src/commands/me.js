const moment = require("moment");
require("moment-duration-format");
const conf = require("../configs/config.json");
const messageUserChannel = require("../schemas/messageUserChannel");
const voiceUserChannel = require("../schemas/voiceUserChannel");
const messageUser = require("../schemas/messageUser");
const voiceUser = require("../schemas/voiceUser");
const voiceUserParent = require("../schemas/voiceUserParent");

module.exports = {
  conf: {
    aliases: [],
    name: 'me',
    help: "me"
  },

  run: async (client, message, args, embed) => {
    const category = async (parentsArray) => {
      const data = await voiceUserParent.find({ guildID: message.guild.id, userID: message.author.id });
      const voiceUserParentData = data.filter((x) => parentsArray.includes(x.parentID));
      let voiceStat = 0;
      for (var i = 0; i <= voiceUserParentData.length; i++) {
        voiceStat += voiceUserParentData[i] ? voiceUserParentData[i].parentData : 0;
      }
      return moment.duration(voiceStat).format("H [saat], m [dakika]");
    };
    
    const Active1 = await messageUserChannel.find({ guildID: message.guild.id, userID: message.author.id }).sort({ channelData: -1 });
    const Active2 = await voiceUserChannel.find({ guildID: message.guild.id, userID: message.author.id }).sort({ channelData: -1 });
    const voiceLength = Active2 ? Active2.length : 0;
    let voiceTop;
    let messageTop;
    Active1.length > 0 ? messageTop = Active1.splice(0, 5).map(x => `<#${x.channelID}>: \`${Number(x.channelData).toLocaleString()} mesaj\``).join("\n") : messageTop = "Veri bulunmuyor."
    Active2.length > 0 ? voiceTop = Active2.splice(0, 5).map(x => `<#${x.channelID}>: \`${moment.duration(x.channelData).format("H [saat], m [dakika]")}\``).join("\n") : voiceTop = "Veri bulunmuyor."
    
    const messageData = await messageUser.findOne({ guildID: message.guild.id, userID: message.author.id });
    const voiceData = await voiceUser.findOne({ guildID: message.guild.id, userID: message.author.id });

    const messageDaily = messageData ? messageData.dailyStat : 0;
    const messageWeekly = messageData ? messageData.weeklyStat : 0;

    const voiceDaily = moment.duration(voiceData ? voiceData.dailyStat : 0).format("H [saat], m [dakika]");
    const voiceWeekly = moment.duration(voiceData ? voiceData.weeklyStat : 0).format("H [saat], m [dakika]");

    const filteredParents = message.guild.channels.cache.filter((x) =>
      x.type === "category" &&
      !conf.publicParents.includes(x.id) &&
      !conf.registerParents.includes(x.id) &&
      !conf.solvingParents.includes(x.id) &&
      !conf.privateParents.includes(x.id) &&
      !conf.aloneParents.includes(x.id) &&
      !conf.funParents.includes(x.id)
    );

    embed.setThumbnail(message.author.avatarURL({ dynamic: true, size: 2048 }))
    embed.setDescription(`
    ${message.author.toString()} üyesinin sunucu verileri
    **───────────────**
    **➥ Ses Bilgileri:**
  • Toplam: \`${moment.duration(voiceData ? voiceData.topStat : 0).format("H [saat], m [dakika]")}\`
  • Public Odalar: \`${await category(conf.publicParents)}\`
  • Kayıt Odaları: \`${await category(conf.registerParents)}\`
  • Sorun Çözme & Terapi: \`${await category(conf.solvingParents)}\`
  • Private Odalar: \`${await category(conf.privateParents)}\`
  • Alone Odalar: \`${await category(conf.aloneParents)}\`
  • Oyun & Eğlence Odaları: \`${await category(conf.funParents)}\`
  • Diğer: \`${await category(filteredParents.map(x => x.id))}\`
    **───────────────**
    **➥ Sesli Kanal Bilgileri: (\`Toplam ${voiceLength} kanal\`)**
    ${voiceTop}
    **───────────────**
    **➥ Mesaj Bilgileri: (\`Toplam ${messageData ? messageData.topStat : 0} mesaj\`)**
    ${messageTop}
    **───────────────**
    `)
    embed.addField("➥ Günlük Verileri:", `
    Mesaj: \`${Number(messageDaily).toLocaleString()} mesaj\`
    Ses: \`${voiceDaily}\`
    `, true);
    embed.addField("➥ Haftalık Verileri:", `
    Mesaj: \`${Number(messageWeekly).toLocaleString()} mesaj\`
    Ses: \`${voiceWeekly}\`
    `, true);
    message.channel.send(embed);
  }
};