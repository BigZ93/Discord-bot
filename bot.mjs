//node --experimental-modules bot.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client, Intents, Interactions, GuildMember, Snowflake } = require("discord.js");
import Discord from "discord.js";
import fetch from "node-fetch";
const envVars = require("./env_vars_dla_bota.json");
const { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection, AudioPlayerStatus, AudioResource, AudioPlayer, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { Player } = require("discord-music-player");
//const ffmpeg = require('ffmpeg');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require("fs");
//youtube needs Google API key => GCloud
const ytdl = require("ytdl-core");
//spotify needs Spotify premium
const SpotifyWebApi = require('spotify-web-api-node');
global.AbortController = require("node-abort-controller").AbortController;

const myIntents = new Intents();
//myIntents.add(429514026048);
myIntents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_VOICE_STATES
);
const client = new Client({ intents: myIntents });

const keyWords = [
    "noob1",
    "noob2"
]

const replies = [
    "pro1",
    "pro2"
]

const chanceKeyWords = [
    "roll d4",
    "roll d6",
    "roll d8",
    "roll d10",
    "roll d12",
    "roll d20",
    //00-90
    "roll d100 classic",
    "toss coin",
    //1-100
    "roll d100",
    //0-99
    "roll d99"
]

function getRandomNumber(min, max){
    let number = Math.floor(Math.random() * (max - min + 1)) + min;
    return number.toString();
}

function getQuote() {
    return fetch("https://zenquotes.io/api/random")
        .then(res => {
            return res.json();
        })
        .then(data => {
            return data[0]["q"] + " -" + data[0]["a"];
        })
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

let dispatcher;
let audio;

client.on("messageCreate", async (msg) => {
    if(msg.author.bot) {
        return;
    }

    if(msg.content === "ping") {
        msg.reply("pong");
    }

    if(msg.content === "!quote") {
        getQuote().then(quote => {
            msg.channel.send(quote);
        });
    }

    if(keyWords.some(word => msg.content.includes(word))) {
        const reply = replies[Math.floor(Math.random() * replies.length)];
        msg.reply(reply);
    }

    if(msg.content === "!tavern") {
        msg.channel.send("https://www.youtube.com/watch?v=wLlovxa3VJ0");
    }

    if(msg.content === "!tavern2") {
        msg.channel.send("https://www.youtube.com/watch?v=fIY55V0Tblk");
    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------
    if(msg.content === "!play") {
        if(!msg.member.voice.channel) {
            return msg.reply("Join voice channel first");
        }
        if(msg.guild.me.voice.channel) {
            return msg.reply("Already playing");
        }
        const connection = joinVoiceChannel({
            channelId: msg.member.voice.channel.id,
            guildId: msg.guild.id,
            adapterCreator: msg.guild.voiceAdapterCreator,
        });

        try {
        //let songs = fs.readdirSync("./muzyka/");
        //audio = songs[Math.floor(Math.random() * songs.length)];
        //dispatcher = connection.play("./muzyka/.test.mp3") + audio);
        //dispatcher.on('error', console.error);
        //dispatcher.on('finish', () => {
        //    console.log("finished");
        //    connection.disconnect();
        //});
        /*
        //-----------------------mp3 dziala--------------------------
        const player = createAudioPlayer();
        var resource = createAudioResource("./muzyka/test.mp3", { inlineVolume: true });
        resource.volume.setVolume(0.2);
        player.play(resource);
        connection.subscribe(player);
        */
        //-----------------------yt dziala ale sie wywala w polowie piosenki--------------------------
        //var stream = ytdl("https://www.youtube.com/watch?v=7wtfhZwyrcc", {
        //    filter: "audioonly"
        //});
        //stream.on('error', console.error);
        var info = await ytdl.getInfo("https://www.youtube.com/watch?v=7wtfhZwyrcc");
        var stream = ytdl.downloadFromInfo(info, {
            filter: "audioonly"
        });
        stream.on('error', console.error);
        var player = createAudioPlayer();
        var resource = createAudioResource(stream);
        await player.play(resource);
        await connection.subscribe(player);
        
        msg.channel.send("Playing...");
        } catch(e) {
            console.log(e);
        }
        
        //setTimeout(() => subscription.unsubscribe(), 5000);
        //setTimeout(() => connection.destroy(), 5000);
    }
    //-------------------------------------------------------------------------------------------------------------------------------------------------------
    if(chanceKeyWords.some(word => msg.content.includes(word))) {
        let i = chanceKeyWords.indexOf(msg.content);
        switch(i) {
            case 0:
                msg.reply(getRandomNumber(1, 4));
                break;
            case 1:
                msg.reply(getRandomNumber(1, 6));
                break;
            case 2:
                msg.reply(getRandomNumber(1, 8));
                break;
            case 3:
                msg.reply(getRandomNumber(0, 9));
                break;
            case 4:
                msg.reply(getRandomNumber(1, 12));
                break;
            case 5:
                msg.reply(getRandomNumber(1, 20));
                break;
            case 6:
                let result = getRandomNumber(0, 9) + "0";
                msg.reply(result);
                break;
            case 7:
                let coin = getRandomNumber(1, 2);
                if(coin === 1) {
                    msg.reply("heads / reszka");
                } else {
                    msg.reply("tails / orzeł");
                }
                break;
            case 8:
                msg.reply(getRandomNumber(1, 100));
                break;
            case 9:
                msg.reply(getRandomNumber(0, 99));
                break;
        }
    }
    /*
    switch(msg.content) {
        case "roll d4":
            msg.reply(getRandomNumber(1, 4));
            break;
        case "roll d6":
            msg.reply(getRandomNumber(1, 6));
            break;
        case "roll d8":
            msg.reply(getRandomNumber(1, 8));
            break;
        case "roll d10 classic":
            //00-90
            msg.reply(getRandomNumber(0, 9));
            break;
        case "roll d12":
            msg.reply(getRandomNumber(1, 12));
            break;
        case "roll d20":
            msg.reply(getRandomNumber(1, 20));
            break;
        case "roll d100":
            let result = getRandomNumber(0, 9) + "0";
            msg.reply(result);
            break;
        case "toss coin":
            let coin = getRandomNumber(1, 2);
            if(coin === 1) {
                msg.reply("heads / reszka");
            } else {
                msg.reply("tails / orzeł");
            }
            break;
        case "roll d100":
            //1-100
            msg.reply(getRandomNumber(1, 100));
            break;
        case "roll d99":
            //0-99
            msg.reply(getRandomNumber(0, 99));
            break;
    }*/
})

client.on('error', console.warn);
let token = envVars.TOKEN;
client.login(token);