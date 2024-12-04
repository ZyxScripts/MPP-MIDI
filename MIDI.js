const { Client } = require('mpp-client-net');
const MidiPlayer = require('midi-player-js');
const fs = require('fs');

let cfg = {
    bot: {
        name: 'Midi',
        color: '#FFF',
        channel: 'your-channel',
    },
    token: 'your-auth-token',
    ws: 'wss://your-server-url',
    midiFile: './path-to-your-midi-file.mid',
    rainbowSpeed: 50,
    player: {
        tempo: 120,
        loop: true,
    }
};

const genRainbow = () => {
    return Array.from({ length: 100 }, (_, i) => {
        const sinToHex = (i, phase, size) => {
            const val = Math.sin((Math.PI * 2 * i) / size + phase) * 127 + 128;
            return Math.floor(val).toString(16).padStart(2, '0');
        };
        return `#${sinToHex(i, 0, 100)}${sinToHex(i, (2 * Math.PI) / 3, 100)}${sinToHex(i, (4 * Math.PI) / 3, 100)}`;
    });
};

let rainbowActive = false;
let colorTimeout;
const rainbow = genRainbow();
let colorIndex = 0;

const setColor = () => {
    if (!rainbowActive) return;
    colorTimeout = setTimeout(setColor, cfg.rainbowSpeed);
    colorIndex = (colorIndex + 1) % rainbow.length;
    client.sendArray([{ m: 'userset', set: { color: rainbow[colorIndex] } }]);
};

const client = new Client(cfg.ws, cfg.token);
client.setChannel(cfg.bot.channel);

client.on('hi', () => {
    console.log('Bot connected');
    client.sendArray([{ m: 'userset', set: { name: cfg.bot.name, color: cfg.bot.color } }]);
});

client.on('ready', () => {
    console.log('Bot ready');
});

client.on('error', (err) => {
    console.error('Bot error:', err);
});

client.start();

const playMidi = () => {
    const player = new MidiPlayer.Player((event) => {
        if (event.name === 'Note off' || (event.name === 'Note on' && event.velocity === 0)) {
            client.stopNote(event.noteName);
        } else if (event.name === 'Note on') {
            client.startNote(event.noteName, event.velocity / 127);
        } else if (event.name === 'Set Tempo') {
            player.setTempo(event.data);
        }
    });

    player.loadFile(cfg.midiFile);
    client.setName(`Playing: ${cfg.midiFile}`);
    player.play();

    rainbowActive = true;
    setTimeout(setColor, 300);
};

playMidi();
