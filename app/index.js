const grid = document.getElementById('grid');
const nothing = document.getElementById('nothing');
const content = document.getElementById("content");
const event = document.getElementById("event");
const web = document.getElementById("web");
const ipE = document.getElementById('ip');
const streams = new Map();

window.ipcRender.receive('new', (StreamPath) => {
    const e = document.createElement('div');
    e.classList.add('video');

    const name = document.createElement("div");
    name.innerText = StreamPath.substring(StreamPath.lastIndexOf('/') + 1);
    e.append(name);

    const vid = document.createElement('video');
    vid.classList.add('stream');
    const flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: `http://localhost:8000${StreamPath}.flv`
    });
    flvPlayer.attachMediaElement(vid);
    flvPlayer.load();
    flvPlayer.play();

    e.append(vid);

    grid.append(e);
    streams.set(StreamPath, flvPlayer);
    nothing.style.display = 'none';
});
window.ipcRender.receive('remove', (StreamPath) => {
    const flvPlayer = streams.get(StreamPath);
    flvPlayer.destroy();
    streams.delete(StreamPath);
    grid.removeChild(grid.lastChild);

    if (streams.size === 0) {
        nothing.style.display = 'flex';
    }
});

web.addEventListener('did-stop-loading', () => {
    content.style.transform = `translateX(-100vw)`;
    event.style.transform = `translateX(0)`;
})
const showEvent = (src) => {
    web.src = src;
}
const hideEvent = () => {
    content.style.transform = `translateX(0)`;
    event.style.transform = `translateX(100vw)`;
    setTimeout(() => {
        web.src = '';
    }, 400)
}

window.ipcRender.receive('ip', (ip) => {
    ipE.innerText = `rtmp://${ip}`;
});
window.ipcRender.receive('event', (src) => {
    showEvent(src);
});
window.ipcRender.receive('close', () => {
    hideEvent();
});
window.ipcRender.send('get-ip');