const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');
const package = require('./package.json');
const EventEmitter = require('events');
var gameChannel;

const Shazam = new EventEmitter();
const client = new Discord.Client();
const request = require('request');
const ytdl = require('discord-ytdl-core');
const sqlite = require('sqlite3').verbose();
const queue = new Map();

let db = new sqlite.Database('./ShazamData.db');
let musicDB = [];

var catagory = ["80's", "90's", "2000's", "2010's"];
var songs = [];
var players = [];
var time = 10000;
var answers = 0;

db.all(`SELECT * FROM music`, (err, row) => {
  if(err){
    console.log(err);
  }
  row.forEach((rows) => {
    musicDB.push(rows);
  })

  console.log(musicDB);
});

//console.log(client.commands);
client.login(config.token)

client.once('connecting', () => {
	console.log('Connecting to Discord...');
});

client.once('disconnect', () => {
	console.log('Disconnected from Discord');
});

client.once('ready', () => {
    console.log('Ready');
    client.user.setActivity('Beta Tests!', {type: 'LISTENING'});
});

client.on('message', async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if(message.content.startsWith(`${config.prefix}info`)) {
        var options = {
            url: 'https://api.github.com/repos/TheGuitarleader/Shazam-Shuffle',
            headers: {
              'User-Agent': 'theguitarleader'
            }
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);

                var servers = [];
                client.guilds.cache.forEach((guild) => {
                    servers.push(guild.id)
                })  

                const embed = new Discord.MessageEmbed()
                .setColor(config.hex)
                .setTitle(`${info.name} v${package.version}`)
                .setThumbnail(client.user.avatarURL())
                .setDescription(`Made by Kyle Ebby\n\n` +
                `Built on:\nDiscord.js v${package.dependencies["discord.js"].replace("^","")}\n`)
                .addField("Active Servers", servers.length)
                .addField("Watching", info.watchers, true)
                .addField("Issues", info.open_issues, true)
                .setURL(info.html_url)
                .setFooter('Made with Kai Technology')
        
                message.reply(embed);
            }
        }
          
        request(options, callback);
    };

    if(message.content.startsWith(`${config.prefix}test`)) {
        var msg = message.channel.send("*Running system test...*");

        //Shazam.emit('start');

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel)
          return message.channel.send(
            "**You need to be in a voice channel to play music!**"
          );
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
          return message.channel.send(
            "**I need the permissions to join and speak in your voice channel!**"
          );
        }

        voiceChannel.join().then(connection => {
          const dispatcher = connection.play('./music/test_audio.mp3')
          .on('finish', () => {
              voiceChannel.leave();
              message.channel.send(':white_check_mark: Complete');
          });
        })
    };

    if(message.content.startsWith(`${config.prefix}howtoplay`) || message.content.startsWith(`${config.prefix}htp`)) {
      var htp = await readTxt('./textfiles/htp.txt');
      const embed = new Discord.MessageEmbed()
        .setColor(config.hex)
        .setTitle('How to play Shazam Shuffle!')
        .setDescription(htp)
      message.reply(embed);
    };

    if(message.content.startsWith(`${config.prefix}no-audio`)) {
      skip(message, queue.get(message.guild.id))
      message.channel.send('Sorry about that!\n:fast_forward: *Skipping and adding new song!*');
      var songNum = getRndInt(musicDB.length);
      const song = {
        videoId: musicDB[songNum].videoId,
        seek: musicDB[songNum].startTime,
        title: musicDB[songNum].title,
        artist: musicDB[songNum].artist,
        category: musicDB[songNum].category,
        year: musicDB[songNum].year,
        option1: musicDB[songNum].option1,
        option2: musicDB[songNum].option2,
        option3: musicDB[songNum].option3,
        option4: musicDB[songNum].option4,
        correct: musicDB[songNum].correct
      }
      queueConstruct.songs.push(song);
    };

    if(message.content.startsWith(`${config.prefix}play`)) {

      const serverQueue = queue.get(message.guild.id);
      gameChannel = message.channel;

      const embed = new Discord.MessageEmbed()
      .setColor(config.hex)
      .setTitle('Getting game setup...')
      //.setDescription(`The most Shazamed song of all time is “Wake Me Up” by Avicii. It has been Shazamed 22,813,761 times.`)
      gameChannel.send(embed);

      voiceChannel = message.member.voice.channel;
      if (!voiceChannel)
        return message.channel.send(
          "**:x: You need to be in a voice channel to play music!**"
        );
      const permissions = voiceChannel.permissionsFor(message.client.user);
      if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
          "**:x: No permissions to join and speak in your voice channel!**"
        );
      }

      for(const [id, user] of voiceChannel.members) {
        if(user.id != client.user.id)
        {
          console.log(user.id);
          players.push(user.id);
        }
      };

      // var songNum = getRndInt(musicDB.length);
      // const song = {
      //   videoId: musicDB[songNum].videoId,
      //   seek: musicDB[songNum].startTime,
      //   title: musicDB[songNum].title,
      //   artist: musicDB[songNum].artist,
      //   category: musicDB[songNum].category,
      //   year: musicDB[songNum].year,
      //   option1: musicDB[songNum].option1,
      //   option2: musicDB[songNum].option2,
      //   option3: musicDB[songNum].option3,
      //   option4: musicDB[songNum].option4,
      //   correct: musicDB[songNum].correct
      // }

      if(!serverQueue)
      {
        const queueConstruct = {
          textChannel: message.channel,
          voiceChannel: voiceChannel,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        };

        queue.set(message.guild.id, queueConstruct);

        while(queueConstruct.songs.length < 10)
        {
          var songNum = getRndInt(musicDB.length);
          const song = {
            videoId: musicDB[songNum].videoId,
            seek: musicDB[songNum].startTime,
            title: musicDB[songNum].title,
            artist: musicDB[songNum].artist,
            category: musicDB[songNum].category,
            year: musicDB[songNum].year,
            option1: musicDB[songNum].option1,
            option2: musicDB[songNum].option2,
            option3: musicDB[songNum].option3,
            option4: musicDB[songNum].option4,
            correct: musicDB[songNum].correct
          }
          queueConstruct.songs.push(song);
          console.log('oof')
        }

        try
        {
          var connection = await voiceChannel.join();
          queueConstruct.connection = connection;
          play(message.guild, queueConstruct.songs[0]);
        } catch (err) {
          console.log(err);
          queue.delete(message.guild.id);
        }
      }

      // let stream = ytdl('UlANZSYZ2Js', {
      //   seek: 31,
      //   opusEncoded: true,
      //   encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
      // });

      // voiceChannel.join().then(connection => {
      //   //Shazam.emit('start');
      //   answers = 0;
      //   dispatcher = connection.play(stream, { type: 'opus'})
      //   .on('finish', () => {
      //       voiceChannel.leave();
      //   });
      // });

      // const embed2 = new Discord.MessageEmbed()
      // .setColor(config.hex)
      // .setTitle(`Catagory: ${song.category}`)
      // .setDescription(`1. ${song.option1}\n2. ${song.option2}\n3. ${song.option3}\n4. ${song.option4}`)
      // gameChannel.send(embed2).then(msg => {
      //     msg.react('1️⃣');
      //     msg.react('2️⃣');
      //     msg.react('3️⃣');
      //     msg.react('4️⃣');
      // });
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
  message = reaction.message;
  serverQueue = queue.get(message.guild.id);

  if(user.id != client.user.id && players.includes(user.id))
  {
    answers++;
    console.log(user.username + ` Points: ${time}`);
  }

  if(answers == players.length)
  {
    skip(message, serverQueue);
    answers = 0;
  }
});

Shazam.on('start', function() {
  time = 10000;
  while(time > 0)
  {
    time-1;
  }
});



function play(guild, song) {
  const serverQueue = queue.get(guild.id);
  if (!song) {
    serverQueue.voiceChannel.leave();
    queue.delete(guild.id);
    return;
  }

  let stream = ytdl('www.youtube.com/watch?v=' + song.videoId, {
    seek: song.seek,
    opusEncoded: true,
    encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
  });

  const dispatcher = serverQueue.connection
    .play(stream, { type: 'opus'})
    .on("finish", () => {
      serverQueue.songs.shift();
      play(guild, serverQueue.songs[0]);
    })
    .on("error", error => console.error(error));
  dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

  const embed2 = new Discord.MessageEmbed()
  .setColor(config.hex)
  .setTitle(`Catagory: ${song.category}`)
  .setDescription(`1. ${song.option1}\n2. ${song.option2}\n3. ${song.option3}\n4. ${song.option4}`)
  gameChannel.send(embed2).then(msg => {
      msg.react('1️⃣');
      msg.react('2️⃣');
      msg.react('3️⃣');
      msg.react('4️⃣');
  });
}

function skip(message, serverQueue) {
  if (!message.member.voice.channel)
    return message.channel.send(
      "**:x: You have to be in a voice channel!**"
    );
  if (!serverQueue)
    return message.channel.send("**:x: No more playlist queued for a playable game!**");
  serverQueue.connection.dispatcher.end();

  const embed3 = new Discord.MessageEmbed()
  .setColor(config.hex)
  .setTitle(serverQueue.songs[0].title)
  .setDescription(`${serverQueue.songs[0].artist} (${serverQueue.songs[0].year})`)
  serverQueue.textChannel.send(embed3);
  serverQueue.connection.dispatcher.end()
}



function getRndInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
};

async function readTxt(path) {
  return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', function (err, data) {
          if(err){
              reject(err);
          }
          resolve(data);
      });
  });
}