const joinedAt = require("../schemas/voiceJoinedAt");
const voiceUser = require("../schemas/voiceUser");
const voiceGuild = require("../schemas/voiceGuild");
const guildChannel = require("../schemas/voiceGuildChannel");
const userChannel = require("../schemas/voiceUserChannel");
const userParent = require("../schemas/voiceUserParent");

module.exports = async (oldState, newState) => {
  if ((oldState.member && oldState.member.user.bot) || (newState.member && newState.member.user.bot)) return;

  let user;
  if (oldState.channelID && !newState.channelID) user = oldState;
  else if ((oldState.channelID && newState.channelID) || (!oldState.channelID && newState.channelID)) user = newState;

  if ((oldState.channelID && newState.channelID) || (!oldState.channelID && newState.channelID)) {
    await joinedAt.findOneAndUpdate({ userID: user.id }, { $set: { date: Date.now() } }, { upsert: true });
  }
  const joinedAtData = await joinedAt.findOne({ userID: user.id });
  const data = Date.now() - joinedAtData.date;

  if (oldState.channelID && !newState.channelID) {
    if (!joinedAtData) return;
    await joinedAt.deleteOne({ userID: oldState.id });
  }

  await voiceUser.findOneAndUpdate({ guildID: user.guild.id, userID: user.id }, { $inc: { topStat: data, dailyStat: data, weeklyStat: data, twoWeeklyStat: data } }, { upsert: true });
  await voiceGuild.findOneAndUpdate({ guildID: user.guild.id }, { $inc: { topStat: data, dailyStat: data, weeklyStat: data, twoWeeklyStat: data } }, { upsert: true });
  await guildChannel.findOneAndUpdate({ guildID: user.guild.id, channelID: user.channelID }, { $inc: { channelData: data } }, { upsert: true });
  await userChannel.findOneAndUpdate({ guildID: user.guild.id, userID: user.id, channelID: user.channelID }, { $inc: { channelData: data } }, { upsert: true });
  if (user.channel.parent) await userParent.findOneAndUpdate({ guildID: user.guild.id, userID: user.id, parentID: user.channel.parentID }, { $inc: { parentData: data } }, { upsert: true });
};

module.exports.conf = {
  name: "voiceStateUpdate",
};
