//node --experimental-modules bot.mjs
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client, Intents, Interactions, GuildMember, Snowflake } = require("discord.js");
import Discord from "discord.js";
import fetch from "node-fetch";
const config = require("./bot_config.json");
const { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection, AudioPlayerStatus, AudioResource, AudioPlayer, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const { Player } = require("discord-music-player");
//const ffmpeg = require('ffmpeg');
const { OpusEncoder } = require('@discordjs/opus');
const fs = require("fs");
//youtube needs Google API key => GCloud
const ytdl = require("ytdl-core");
//could be required instead of ytdl-core
//import { exec as ytdlexec } from 'youtube-dl-exec';
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

const chanceKeyWords = [
    "!d4",
    "!d6",
    "!d8",
    "!d10",
    "!d12",
    "!d20",
    //00-90
    "!d100 dec",
    "!coin",
    //1-100
    "!d100",
    //0-99
    "!d99",
    "!d2",
    "!d3"
]

var connection;
var player;
var resource;
var subscription;
var stopped = false;

function getRandomNumber(min, max){
    let number = Math.floor(Math.random() * (max - min + 1)) + min;
    return number.toString();
}

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

client.on("messageCreate", async (msg) => {
    if(msg.author.bot) {
        return;
    }

    if(msg.content === "!help"){
        let helpFile = fs.readFile('./bot_help.txt', 'utf8', (err, data) => {
            if(err) throw err;
            msg.reply(data);
        });
    }

    if(msg.content === "!tavern1") {
        msg.channel.send("https://www.youtube.com/watch?v=wLlovxa3VJ0");
    }

    if(msg.content === "!tavern2") {
        msg.channel.send("https://www.youtube.com/watch?v=fIY55V0Tblk");
    }

    if(msg.content === "!q") {
        try{
            msg.channel.send("Quitting");
            await client.destroy();
        } catch(e){
            console.log(e);
        }
        //brute force'owo wywali skrypt, mozna tez obudowac wszystko w function main(){...} i uzyc return;
        //lub dac throw new Error(); lub new new lub process.exit(1);
        //throw '';
    }

    if(msg.content === "!dc") {
        try{
            msg.channel.send("Disconnecting");
            await player.stop();
            subscription.unsubscribe();
            connection.disconnect();
            connection.destroy();
        } catch(e){
            console.log(e);
        }
    }
    //-------------------------------------------------------------------muzyka------------------------------------------------------------------------------------
    //nie dziala mp3 po playu
    //bot plays music only on one channel
    if(msg.content === "!play" || msg.content === "!mp3") {
        if(!msg.member.voice.channel) {
            return msg.reply("Join voice channel first");
        }
        if(msg.guild.me.voice.channel && stopped === false) {
            return msg.reply("Already playing on channel " + msg.guild.me.voice.channel.name);
        }
        if(stopped === false) {
            connection = joinVoiceChannel({
                channelId: msg.member.voice.channel.id,
                guildId: msg.guild.id,
                adapterCreator: msg.guild.voiceAdapterCreator,
            });
        }
        stopped = false;

        if(msg.content === "!mp3") {
            try {
                player = createAudioPlayer();
                resource = createAudioResource("./muzyka/test.mp3", { inlineVolume: true });
                resource.volume.setVolume(0.2);
                await player.play(resource);
                subscription = await connection.subscribe(player);
                msg.channel.send("Playing from mp3...");

                //let dispatcher;
                //let audio;
                //let songs = fs.readdirSync("./muzyka/");
                //audio = songs[Math.floor(Math.random() * songs.length)];
                //dispatcher = connection.play("./muzyka/.test.mp3") + audio);
                //dispatcher.on('error', console.error);
                //dispatcher.on('finish', () => {
                //    console.log("finished");
                //    connection.disconnect();
                //});
            } catch(e) {
                console.log(e);
            }
        } else {
            try {
                //-----------------------yt dziala czasem sie zacina czasem nie--------------------------
                //-----------------------uzycie youtube-dl-exec i/lub lowestaudio quality powinno pomoc; slaba jakosc na razie pomogla--------------------------
                //var info = await ytdl.getInfo("https://www.youtube.com/watch?v=S6vsWsWSRac"); //dluga muzyka
                let info = await ytdl.getInfo("https://www.youtube.com/watch?v=7wtfhZwyrcc");   //imagine dragons
                let stream = ytdl.downloadFromInfo(info, {
                    filter: 'audioonly',
                    quality: 'lowestaudio'
                });
                stream.on('error', console.error);
                player = createAudioPlayer();
                resource = createAudioResource(stream, { inlineVolume: true });
                resource.volume.setVolume(0.2);
                await player.play(resource);
                subscription = await connection.subscribe(player);
                msg.channel.send("Playing from Youtube...");
            } catch(e) {
                console.log(e);
            }
            //audio player streamuje muzyke do wszystkich subskrybowanych voice connections, najpierw sie connectuje do voice channela, potem subskrybuje playera
            //setTimeout(() => subscription.unsubscribe(), 5000);
            //setTimeout(() => connection.destroy(), 5000);
        }
    }

    if(msg.content === "!stop"){
        if(msg.guild.me.voice.channel){
            await player.stop();
            msg.channel.send("Stopping music");
            stopped = true; //moze dac enum ze statusem
        }
    }

    if(msg.content === "!pause"){
        if(msg.guild.me.voice.channel){
            await player.pause(true);
            msg.reply("Music paused");
        }
    }

    if(msg.content === "!resume"){
        if(msg.guild.me.voice.channel){
            await player.unpause();
            msg.reply("Continue playing...");
        }
    }

    if(msg.content.includes("!volume")){
        let volume = msg.content.split(" ")[1];
        if(volume < 1){
            volume = 1;
        }
        if(volume > 100){
            volume = 100;
        }
        resource.volume.setVolume(volume/100);
        msg.reply("aaaa");
    }
    //-------------------------------------------------------------------koniec muzyki------------------------------------------------------------------------------------
    //english rolls
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
                    msg.reply("heads");
                } else {
                    msg.reply("tails");
                }
                break;
            case 8:
                msg.reply(getRandomNumber(1, 100));
                break;
            case 9:
                msg.reply(getRandomNumber(0, 99));
                break;
            case 10:
                msg.reply(getRandomNumber(1, 2));
                break;
            case 11:
                msg.reply(getRandomNumber(1, 3));
                break;
        }
    }
    //polskie rzuty
    switch(msg.content) {
        case "!k4":
            msg.reply(getRandomNumber(1, 4));
            break;
        case "!k6":
            msg.reply(getRandomNumber(1, 6));
            break;
        case "!k8":
            msg.reply(getRandomNumber(1, 8));
            break;
        case "!k10":
            msg.reply(getRandomNumber(0, 9));
            break;
        case "!k12":
            msg.reply(getRandomNumber(1, 12));
            break;
        case "!k20":
            msg.reply(getRandomNumber(1, 20));
            break;
        case "!k100 dzies":
            let result = getRandomNumber(0, 9) + "0";
            msg.reply(result);
            break;
        case "!moneta":
            let coin = getRandomNumber(1, 2);
            if(coin === 1) {
                msg.reply("reszka");
            } else {
                msg.reply("orzeł");
            }
            break;
        case "!k100":
            //1-100
            msg.reply(getRandomNumber(1, 100));
            break;
        case "!k99":
            //0-99
            msg.reply(getRandomNumber(0, 99));
            break;
        case "!k2":
            msg.reply(getRandomNumber(1, 2));
            break;
        case "!k3":
            msg.reply(getRandomNumber(1, 3));
            break;
    }
    //GM rolls / rzuty MG
    switch(msg.content){
        case "!gm4":
            msg.author.send(getRandomNumber(1, 4));
            break;
        case "!gm6":
            msg.author.send(getRandomNumber(1, 6));
            break;
        case "!gm8":
            msg.author.send(getRandomNumber(1, 8));
            break;
        case "!gm10":
            msg.author.send(getRandomNumber(0, 9));
            break;
        case "!gm12":
            msg.author.send(getRandomNumber(1, 12));
            break;
        case "!gm20":
            msg.author.send(getRandomNumber(1, 20));
            break;
        case "!gm100 dec":
            let result = getRandomNumber(0, 9) + "0";
            msg.author.send(result);
            break;
        case "!gmcoin":
            let coin = getRandomNumber(1, 2);
            if(coin === 1) {
                msg.reply("heads / reszka");
            } else {
                msg.reply("tails / orzeł");
            }
            break;
        case "!gm100":
            msg.author.send(getRandomNumber(1, 100));
            break;
        case "!gm99":
            msg.author.send(getRandomNumber(0, 99));
            break;
        case "!gm2":
            msg.author.send(getRandomNumber(1, 2));
            break;
        case "!gm3":
            msg.author.send(getRandomNumber(1, 3));
            break;
    }
});

client.on('error', console.warn);
let token = config.TOKEN;
client.login(token);