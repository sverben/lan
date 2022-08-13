const NodeMediaServer = require('node-media-server');
const { app, BrowserWindow, ipcMain } = require("electron");
const { networkInterfaces } = require('os');
const path = require('path');
const express = require('express');

const config = {
    logType: 0,
    rtmp: {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60
    },
    http: {
        port: 8000,
        allow_origin: '*'
    }
};

let window;

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080,
        frame: false,
        fullscreen: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            webviewTag: true
        }
    });

    win.loadFile("app/index.html");
    window = win;
};

const createServer = () => {
    const nms = new NodeMediaServer(config);
    nms.on('postPublish', (id, StreamPath, args) => {
        console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
        // let session = nms.getSession(id);
        // session.reject();
        window.webContents.send('new', StreamPath)
    });

    // on nms done streaming
    nms.on('donePublish', (id, StreamPath) => {
        console.log('[NodeEvent on done]', `id=${id}`);
        window.webContents.send('remove', StreamPath)
    });


    nms.run();
}
const getIP = () => {
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                return net.address;
            }
        }
    }
}

const site = express();
site.use(express.static(path.join(__dirname, 'public')));
site.get('/event', (req, res) => {
    if (!req.query.url) return;
    if (req.query.password !== process.env.password) return;
    res.redirect('/manage.html');
    window.webContents.send('event', req.query.url);
});
site.get('/close', (req, res) => {
    if (req.query.password !== process.env.password) return;
    res.redirect('/manage.html');
    window.webContents.send('close');
});
site.listen(80);

ipcMain.on('get-ip', (event) => {
    window.webContents.send('ip', getIP());
});
createServer();
app.whenReady().then(createWindow);