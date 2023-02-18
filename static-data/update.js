const util = require('util');
const fs = require('fs');

let request = require('request');
request = util.promisify(request);

const { baseApiUrl, twitchCID, accessTOKEN } = require('../config');

const _users = [
  'danikaxix',
  'terakilobyte',
  'freecodecamp',
  'medrybw',
  'thomasballinger',
  'noobs2ninjas',
  'RobotCaleb',
  'beohoff',
  'GeoffStorbeck',
  'leagueoflegends',
  'ThunderCast',
  'esl_csgo',
  'summit1g',
  'izakooo',
  'sodapoppin',
  'stormstudio_csgo_ru',
  'imaqtpie',
  'dfunker0',
  'LeagueOfMichael',
  'Quinnell',
  'Gaungade',
  'cokeduppatty',
  'snipealot2',
  'esl_sc2',
  'Lana_Lux'
];

const reqOptions = {
  method: 'GET',
  headers: {
    'Client-ID': twitchCID,
    'Authorization': `Bearer ${accessTOKEN}`
  },
};
const updateStaticData = async () => {
  console.log("UPDATESTATIC: ", baseApiUrl)
  try {
    const u = await request(`${baseApiUrl}/helix/users`, {
      ...reqOptions,
      qs: {
        login: _users,
      },
    });
    console.log("USERS.body: ", u.body)
    const users = u.body;
    const user_id = JSON.parse(users).data.map(u => u.id);
    const s = await request(`${baseApiUrl}/helix/streams`, {
      ...reqOptions,
      qs: {
        user_id,
      },
    });
    const streams = s.body;
    const game_ids = JSON.parse(streams).data.map(s => s.game_id);
    const g = await request(`${baseApiUrl}/helix/games`, {
      ...reqOptions,
      qs: {
        id: game_ids,
      },
    });
    const games = g.body;
    fs.writeFileSync(`${__dirname}/helix/users.json`, users);
    fs.writeFileSync(`${__dirname}/helix/streams.json`, streams);
    fs.writeFileSync(`${__dirname}/helix/games.json`, games);
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

const getKrakenUserData = async user => {
  console.log("PING getKrakenUserData")
  const types = ['users', 'streams', 'channels'];
  return Promise.all(
    types.map(type =>
      request(`${baseApiUrl}/kraken/${type}/${user}`, { ...reqOptions })
    )
  ).then(data => {
    const out = {};
    data.forEach((d, i) => {
      out[types[i]] = JSON.parse(d.body);
    });
    return out;
  });
};
const getAllKrakenData = async () =>
  Promise.all(_users.map(getKrakenUserData)).then((data) => {
    const out = {};
    data.forEach((d, i) => {
      out[_users[i]] = d;
    });
    return out;
  });
const updateLegacyStaticData = async () => {
  try {
    const _data = await getAllKrakenData();
    fs.writeFileSync(`${__dirname}/kraken.json`, JSON.stringify(_data));
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(e);
  }
};

module.exports = {
  updateStaticData,
  updateLegacyStaticData,
};
