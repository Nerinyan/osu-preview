PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2;

const Application = PIXI.Application,
    Sprite = PIXI.Sprite,
    Assets = PIXI.Assets,
    Graphics = PIXI.Graphics,
    Container = PIXI.Container;

// Init
let type = "WebGL";
let BEATMAPID = 0;

if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas";
}

const app = new Application({
    width: parseInt(getComputedStyle(document.querySelector("#playerContainer")).width),
    height: parseInt(getComputedStyle(document.querySelector("#playerContainer")).height),
    antialias: true,
    autoDensity: true,
    backgroundAlpha: 0,
});

const fpsSprite = new PIXI.Text(`0fps\nInfinite ms`, {
    fontFamily: "Torus",
    fontSize: 15,
    fontWeight: 500,
    fill: 0xffffff,
    align: "right",
});

fpsSprite.anchor.set(1, 1);

app.stage.addChild(fpsSprite);

let currentFrameRate = 0;
const checkFrameRate = (lastTime, currentTime) => {
    if (lastTime !== 0) {
        currentFrameRate = 1000 / (currentTime - lastTime);
    }

    // fpsSprite.text = `${currentFrameRate}fps`;

    window.requestAnimationFrame((nextTime) => {
        return checkFrameRate(currentTime, nextTime);
    });
};
window.requestAnimationFrame((currentTime) => {
    return checkFrameRate(0, currentTime);
});

// Alias

const sliderAccuracy = 1 / 1000;
const scaleFactor = Math.max(window.innerWidth / 640, window.innerHeight / 480);
// const cs = 54.4 - 4.48 * 4;

let elapsed = 0.0;
let container = new Container();

let w = (w_a = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width));
let h = (h_a = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height));

if (w / 512 > h / 384) w = w_z = (h / 384) * 512;
else h = h_z = (w / 512) * 384;

document.querySelector("#playerContainer").appendChild(app.view);

if (w < 480) {
    // console.log("Alo", w, h);
    app.renderer.resize(
        parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * 2,
        parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * 2
    );
    w *= 2;
    h *= 2;

    document.querySelector("canvas").style.transform = `scale(0.5)`;
} else {
    document.querySelector("canvas").style.transform = ``;
}

w *= 0.9;
h *= 0.9;

let offsetX = (document.querySelector("canvas").width - w) / 2;
let offsetY = (document.querySelector("canvas").height - h) / 2;

container.x = offsetX;
container.y = offsetY;

let gr = new Graphics()
    .lineStyle({
        width: 1,
        color: 0xffffff,
        alpha: 0.1,
        alignment: 0.5,
    })
    .drawRect(0, 0, w, h);

    for (let i = 0; i < w; i += w / 16) for (let j = 0; j < h; j += h / 12) gr.drawRect(i, j, w / 16, h / 12);

let tx = app.renderer.generateTexture(gr);

let bg = new Sprite(tx);
bg.width = w;
bg.height = h;
bg.x = offsetX;
bg.y = offsetY;
bg.alpha = 1;

let dragWindow = new Graphics().lineStyle({
    width: 2,
    color: 0xffffff,
    alpha: 1,
    alignment: 0,
});

dragWindow.alpha = 0;
dragWindow.x = offsetX;
dragWindow.y = offsetY;

fpsSprite.x = document.querySelector("canvas").width - 10;
fpsSprite.y = document.querySelector("canvas").height - 10;

app.stage.addChild(bg);
app.stage.addChild(dragWindow);
app.stage.addChild(container);

const addToContainer = (list) => {
    list.forEach((o) => {
        container.addChild(o.obj);
    });
};

const removeFromContainer = (list) => {
    list.forEach((o) => {
        container.removeChild(o.obj);
    });
};

const createSelectedHitCircleTemplate = () => {
    const hitCircleOverlay = new Graphics()
        .lineStyle({
            width: ((((hitCircleSize / 2) * 50) / 236) * w) / 512,
            color: 0xf2cc0f,
            alpha: 1,
            cap: "round",
            alignment: 0,
        })
        .arc(0, 0, ((hitCircleSize / 2) * w) / 512, 0, Math.PI * 2);
    const { width, height } = hitCircleOverlay;

    const renderTexture = PIXI.RenderTexture.create({
        width: width,
        height: height,
        multisample: PIXI.MSAA_QUALITY.MEDIUM,
        // resolution: window.devicePixelRatio,
    });

    app.renderer.render(hitCircleOverlay, {
        renderTexture,
        transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
    });

    app.renderer.framebuffer.blit();

    hitCircleOverlay.destroy(true);

    return renderTexture;
};

const createHitCircleTemplate = () => {
    const hitCircle = new Graphics();

    const circle_1 = new Graphics();
    circle_1.beginFill(0xffffff);
    circle_1.drawCircle(0, 0, ((hitCircleSize / 2) * w) / 512);
    circle_1.endFill();

    const circle_2 = new Graphics();
    circle_2.beginFill(0x2f2f2f);
    circle_2.drawCircle(0, 0, ((((hitCircleSize / 2) * 186) / 236) * w) / 512);
    circle_2.endFill();

    hitCircle.addChild(circle_1);
    hitCircle.addChild(circle_2);
    // hitCircleContainer.addChild(hitCircleOverlay);

    // console.log(hitCircle.width);
    const { width, height } = hitCircle;

    const renderTexture = PIXI.RenderTexture.create({
        width: width,
        height: height,
        multisample: PIXI.MSAA_QUALITY.HIGH,
        // resolution: window.devicePixelRatio,
    });

    app.renderer.render(hitCircle, {
        renderTexture,
        transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
    });

    app.renderer.framebuffer.blit();

    hitCircle.destroy(true);

    return renderTexture;
};

const createHitCircleOverlayTemplate = () => {
    const hitCircleOverlay = new Graphics()
        .lineStyle({
            width: (4 * w) / 1024,
            color: 0xffffff,
            alpha: 1,
            cap: "round",
            alignment: 0,
        })
        .arc(0, 0, ((((hitCircleSize / 2) * 272) / 236) * w) / 510, 0, Math.PI * 2);
    const { width, height } = hitCircleOverlay;

    const renderTexture = PIXI.RenderTexture.create({
        width: width,
        height: height,
        multisample: PIXI.MSAA_QUALITY.MEDIUM,
        // resolution: window.devicePixelRatio,
    });

    app.renderer.render(hitCircleOverlay, {
        renderTexture,
        transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
    });

    app.renderer.framebuffer.blit();

    hitCircleOverlay.destroy(true);

    return renderTexture;
};

const createApproachCircleTemplate = () => {
    const approachCircle = new Graphics()
        .lineStyle({
            width: (4 * w) / 1024,
            color: 0xffffff,
            alpha: 1,
            cap: "round",
            alignment: 1,
        })
        .arc(0, 0, ((hitCircleSize / 2) * w) / 512, 0, Math.PI * 2);
    const { width, height } = approachCircle;

    const renderTexture = PIXI.RenderTexture.create({
        width: width,
        height: height,
        multisample: PIXI.MSAA_QUALITY.MEDIUM,
        // resolution: window.devicePixelRatio,
    });

    app.renderer.render(approachCircle, {
        renderTexture,
        transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
    });

    app.renderer.framebuffer.blit();

    approachCircle.destroy(true);

    return renderTexture;
};

const createSliderBallTemplate = () => {
    const sliderBallOutLine = new Graphics()
        .lineStyle({
            width: (20 * w) / 1024,
            color: 0xffffff,
            alpha: 1,
            cap: "round",
            alignment: 0,
        })
        .arc(0, 0, ((hitCircleSize / 2) * w) / 512, 0, Math.PI * 2);

    const sliderBallBG = new Graphics();
    sliderBallBG.beginFill(0x000000);
    sliderBallBG.drawCircle(0, 0, ((hitCircleSize / 2) * w) / 512);
    sliderBallBG.endFill();
    sliderBallBG.alpha = 0.7;

    const sliderBallContainer = new Container();
    sliderBallContainer.addChild(sliderBallBG);
    sliderBallContainer.addChild(sliderBallOutLine);

    const { width, height } = sliderBallContainer;

    const renderTexture = PIXI.RenderTexture.create({
        width: width,
        height: height,
        multisample: PIXI.MSAA_QUALITY.MEDIUM,
        // resolution: window.devicePixelRatio,
    });

    app.renderer.render(sliderBallContainer, {
        renderTexture,
        transform: new PIXI.Matrix(1, 0, 0, 1, width / 2, height / 2),
    });

    app.renderer.framebuffer.blit();

    sliderBallContainer.destroy(true);

    return renderTexture;
};

let selectedHitCircleTemplate;
let hitCircleTemplate;
let hitCircleOverlayTemplate;
let approachCircleTemplate;
let sliderBallTemplate;

if (localStorage.getItem("settings")) {
    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));

    document.querySelector("#dim").value = currentLocalStorage.background.dim;
    document.querySelector("#bgDimVal").innerHTML = `${parseInt(currentLocalStorage.background.dim * 100)}%`;
    document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${currentLocalStorage.background.dim})`;

    document.querySelector("#blur").value = currentLocalStorage.background.blur;
    document.querySelector("#bgBlurVal").innerHTML = `${parseInt((currentLocalStorage.background.blur / 20) * 100)}px`;
    document.querySelector("#overlay").style.backdropFilter = `blur(${currentLocalStorage.background.blur}px)`;

    document.querySelector("#master").value = currentLocalStorage.volume.master;
    document.querySelector("#masterVal").innerHTML = `${parseInt(currentLocalStorage.volume.master * 100)}%`;
    // masterVol = currentLocalStorage.volume.master;

    document.querySelector("#music").value = currentLocalStorage.volume.music;
    document.querySelector("#musicVal").innerHTML = `${parseInt((currentLocalStorage.volume.music / 0.4) * 100)}%`;
    // musicVol = currentLocalStorage.volume.music;

    document.querySelector("#effect").value = currentLocalStorage.volume.hs;
    document.querySelector("#effectVal").innerHTML = `${parseInt((currentLocalStorage.volume.hs / 0.4) * 100)}%`;

    document.querySelector("#softoffset").value = currentLocalStorage.mapping.offset;
    document.querySelector("#softoffsetVal").innerHTML = `${parseInt(currentLocalStorage.mapping.offset)}ms`;
    // hsVol = currentLocalStorage.volume.hs;

    Object.keys(currentLocalStorage.sliderAppearance).forEach((k) => {
        if (["snaking", "legacy", "hitAnim"].includes(k)) {
            document.querySelector(`#${k}`).checked = currentLocalStorage.sliderAppearance[k];
        }
    });

    document.querySelector("#beat").value = currentLocalStorage.mapping.beatsnap;
    document.querySelector("#beatVal").innerHTML = `1/${currentLocalStorage.mapping.beatsnap}`;
}

document.querySelector(".loading").style.display = "none";

const canvas = document.querySelector("#canvas");

let oldPlayerContainerHeight = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
let oldPlayerContainerWidth = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);

// canvas.width =
//     (1080 * parseInt(getComputedStyle(document.querySelector("#playerContainer")).width)) /
//     parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
// canvas.height = 1080;

window.onresize = () => {
    w = w_a = parseInt(getComputedStyle(document.querySelector("#playerContainer")).width);
    h = h_a = parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);
    app.renderer.resize(w, h);

    if (w / 512 > h / 384) {
        w = (h / 384) * 512;
    } else {
        h = (w / 512) * 384;
    }

    bg.width = w;
    bg.height = h;

    if (w < 480) {
        // console.log("Alo", w, h);
        app.renderer.resize(
            parseInt(getComputedStyle(document.querySelector("#playerContainer")).width) * 2,
            parseInt(getComputedStyle(document.querySelector("#playerContainer")).height) * 2
        );

        bg.width = w * 2;
        bg.height = h * 2;

        w *= 2;
        h *= 2;
        document.querySelector("canvas").style.transform = `scale(0.5)`;
    } else {
        document.querySelector("canvas").style.transform = ``;
    }

    w *= 0.9;
    h *= 0.9;

    const gr_2 = new Graphics()
        .lineStyle({
            width: 1,
            color: 0xffffff,
            alpha: 0.1,
            alignment: 0.5,
        })
        .drawRect(0, 0, w, h);

    for (let i = 0; i < w; i += w / 16) for (let j = 0; j < h; j += h / 12) gr_2.drawRect(i, j, w / 16, h / 12);

    offsetX = (document.querySelector("canvas").width - w) / 2;
    offsetY = (document.querySelector("canvas").height - h) / 2;

    container.x = offsetX;
    container.y = offsetY;

    const tx_2 = app.renderer.generateTexture(gr_2);

    bg.texture = tx_2;
    bg.width = w;
    bg.height = h;
    bg.x = offsetX;
    bg.y = offsetY;

    dragWindow.x = offsetX;
    dragWindow.y = offsetY;

    fpsSprite.x = document.querySelector("canvas").width - 10;
    fpsSprite.y = document.querySelector("canvas").height - 10;

    if (!playingFlag) {
        if (beatmapFile !== undefined && beatmapFile.beatmapRenderData !== undefined) {
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    }
};

function openMenu() {
    // console.log(ele);
    const settingsPanel = document.querySelector("#settingsPanel");
    const block = document.querySelector("#block");

    settingsPanel.style.left = settingsPanel.style.left === "" ? "0px" : "";
    settingsPanel.style.opacity = settingsPanel.style.opacity === "" ? "1" : "";

    block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";
}

document.body.addEventListener("click", (e) => {
    const settingsPanelIsClick = document.querySelector("#settingsPanel").contains(e.target);

    // console.log(document.querySelector("#settingsPanel").contains(e.target), document.querySelector("#settingsButton").contains(e.target));

    if (!document.querySelector("#settingsButton").contains(e.target)) {
        if (!settingsPanelIsClick) {
            settingsPanel.style.left = "";
            settingsPanel.style.opacity = "";
            block.style.display = settingsPanel.style.opacity === "1" ? "block" : "";
        }
    }
});

function handleCheckBox(checkbox) {
    mods[checkbox.name] = !mods[checkbox.name];
    sliderAppearance[checkbox.name] = !sliderAppearance[checkbox.name];

    const DTMultiplier = !mods.DT ? 1 : 1.5;
    const HTMultiplier = !mods.HT ? 1 : 0.75;

    if (["snaking", "untint", "legacy", "hitAnim"].includes(checkbox.name)) {
        const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
        currentLocalStorage.sliderAppearance[checkbox.name] = sliderAppearance[checkbox.name];
        localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
    }

    // canvas.style.transform = !mods.HR ? "" : "scale(1, -1)";
    if (beatmapFile !== undefined) {
        const originalIsPlaying = beatmapFile.audioNode.isPlaying;
        if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
        playbackRate = 1 * DTMultiplier * HTMultiplier;
        if (originalIsPlaying) beatmapFile.audioNode.play();
        if (!originalIsPlaying) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }
}

function setSliderTime() {
    // if (!document.querySelector("audio")) return;
    if (beatmapFile === undefined) return;
    if (!sliderOnChange) document.querySelector("#progress").value = beatmapFile.audioNode.getCurrentTime();

    // if (beatmapFile !== undefined && !playingFlag) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
}

function setAudioTime(callFromDraw) {
    // if (playingFlag) playToggle();

    const slider = document.querySelector("#progress");
    // if (!document.querySelector("audio")) {
    //     slider.value = 0;
    //     return;
    // }

    if (beatmapFile === undefined) {
        slider.value = 0;
        return;
    }

    // console.log(slider.value);
    beatmapFile.audioNode.seekTo(parseFloat(slider.value));

    if (beatmapFile !== undefined && !playingFlag) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
}

function setProgressMax() {
    // document.querySelector("#progress").max = document.querySelector("audio").duration * 10;
    document.querySelector("#progress").max = beatmapFile.audioNode.buf.duration * 1000;
}

function playToggle() {
    if (isPlaying) {
        // if (document.querySelector("audio").currentTime >= document.querySelector("audio").duration) {
        //     document.querySelector("audio").currentTime = 0;
        // }

        // if (document.querySelector("audio").currentTime * 1000 === 1) {
        //     console.log(document.querySelector("audio").currentTime);
        //     document.querySelector("audio").ontimeupdate = setSliderTime;
        // }

        document.querySelector("#playButton").style.backgroundImage =
            document.querySelector("#playButton").style.backgroundImage === "" ? "url(./static/pause.png)" : "";

        // if (document.querySelector("audio").paused) {
        //     playingFlag = true;
        //     document.querySelector("audio").play();
        //     beatmapFile.beatmapRenderData.render();
        // } else {
        //     playingFlag = false;
        //     document.querySelector("audio").pause();
        //     beatmapFile.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000, true);
        // }

        if (!beatmapFile.audioNode.isPlaying) {
            playingFlag = true;
            beatmapFile.audioNode.play();
            beatmapFile.beatmapRenderData.render();
        } else {
            playingFlag = false;
            beatmapFile.audioNode.pause();
            beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
        }
    } else {
        beatmapFile.audioNode.play();
        beatmapFile.beatmapRenderData.render();
    }
}

function checkEnter(e) {
    console.log(e);
}

function submitMap() {
    const inputValue = BEATMAPID == 0 ? 853167 : BEATMAPID;
    if (!/^https:\/\/osu\.ppy\.sh\/(beatmapsets\/[0-9]+\#osu\/[0-9]+|b\/[0-9]+)|[0-9]+$/.test(inputValue)) {
        alert("This is not a valid URL or Beatmap ID");
        return;
    }

    if (document.querySelector("audio")) {
        document.querySelector("audio").pause();
        document.body.removeChild(document.querySelector("audio"));
    }

    // const bID = inputValue.split("/").at(-1);
    const bID = inputValue;

    if (beatmapFile !== undefined) {
        playingFlag = false;
        beatmapFile.audioNode.pause();
        beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
    }

    beatmapFile = undefined;
    beatmapFile = new BeatmapFile(bID);

    document.querySelector("#progress").value = 0;
    // if (document.querySelector("audio")) document.querySelector("audio").currentTime = 0.001;
}

function setBackgroundDim(slider) {
    // console.log(slider.value);
    document.querySelector("#overlay").style.backgroundColor = `rgba(0 0 0 / ${slider.value})`;
    document.querySelector("#bgDimVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.background.dim = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

function setBackgroundBlur(slider) {
    // console.log(slider.value);
    document.querySelector("#overlay").style.backdropFilter = `blur(${slider.value}px)`;
    document.querySelector("#bgBlurVal").innerHTML = `${parseInt((slider.value / 20) * 100)}px`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.background.blur = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

function setMasterVolume(slider) {
    masterVol = slider.value;
    document.querySelector("#masterVal").innerHTML = `${parseInt(slider.value * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.master = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setAudioVolume(slider) {
    musicVol = slider.value;
    document.querySelector("#musicVal").innerHTML = `${parseInt((slider.value / 0.4) * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.music = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setEffectVolume(slider) {
    hsVol = slider.value;
    document.querySelector("#effectVal").innerHTML = `${parseInt((slider.value / 0.4) * 100)}%`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.volume.hs = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setOffset(slider) {
    SOFT_OFFSET = slider.value;
    document.querySelector("#softoffsetVal").innerHTML = `${parseInt(slider.value)}ms`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mapping.offset = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));

    if (beatmapFile === undefined) return;

    const originalIsPlaying = beatmapFile.audioNode.isPlaying;
    if (beatmapFile.audioNode.isPlaying) beatmapFile.audioNode.pause();
    if (originalIsPlaying) beatmapFile.audioNode.play();
}

function setBeatsnapDivisor(slider) {
    beatsnap = slider.value;
    document.querySelector("#beatVal").innerHTML = `1/${slider.value}`;

    const currentLocalStorage = JSON.parse(localStorage.getItem("settings"));
    currentLocalStorage.mapping.beatsnap = slider.value;
    localStorage.setItem("settings", JSON.stringify(currentLocalStorage));
}

function updateTime(timestamp) {
    // console.log(timestamp);
    const currentMiliseconds = Math.floor(timestamp);
    const msDigits = [currentMiliseconds % 10, Math.floor((currentMiliseconds % 100) / 10), Math.floor((currentMiliseconds % 1000) / 100)];

    msDigits.forEach((val, idx) => {
        document.querySelector(`#millisecond${idx + 1}digit`).innerText = Math.max(0, val);
        // animation[`ms${idx + 1}digit`].update(document.querySelector(`#millisecond${idx + 1}digit`).innerText);
    });

    const currentSeconds = Math.floor((timestamp / 1000) % 60);
    const sDigits = [currentSeconds % 10, Math.floor((currentSeconds % 100) / 10)];

    sDigits.forEach((val, idx) => {
        document.querySelector(`#second${idx + 1}digit`).innerText = Math.max(0, val);
        // animation[`s${idx + 1}digit`].update(document.querySelector(`#second${idx + 1}digit`).innerText);
    });

    const currentMinute = Math.floor(timestamp / 1000 / 60);
    const mDigits = [currentMinute % 10, Math.floor((currentMinute % 100) / 10)];

    mDigits.forEach((val, idx) => {
        document.querySelector(`#minute${idx + 1}digit`).innerText = Math.max(0, val);
        // animation[`m${idx + 1}digit`].update(document.querySelector(`#minute${idx + 1}digit`).innerText);
    });

    // console.log(mDigits.reverse(), sDigits.reverse(), msDigits.reverse());
}

let currentFrameReq;

function pushFrame(current, to, delta) {
    // console.log(Math.floor(current), Math.floor(to));
    beatmapFile.beatmapRenderData.objectsList.draw(current, true);

    if (current <= to) current += ((delta / currentFrameRate) * 1000) / 100;
    else current -= ((delta / currentFrameRate) * 1000) / 100;

    if (Math.floor(current) !== Math.floor(to)) {
        currentFrameReq = window.requestAnimationFrame((currentTime) => {
            return pushFrame(current, to, delta);
        });
    }
}

function goNext(precise) {
    if (beatmapFile !== undefined) {
        let step = 10;
        let currentBeatstep;
        const current = beatmapFile.audioNode.getCurrentTime();

        if (beatsteps.length) {
            currentBeatstep =
                beatsteps.findLast((timingPoint) => timingPoint.time <= current) !== undefined
                    ? beatsteps.findLast((timingPoint) => timingPoint.time <= current)
                    : beatsteps[0];

            step = currentBeatstep.beatstep / (precise ? 48 : parseInt(beatsnap));
        }

        const localOffset = currentBeatstep.time % step;
        const goTo = Math.min(Math.max(localOffset + (Math.ceil(current / step) + 1) * step, 0), beatmapFile.audioNode.buf.duration * 1000);
        // console.log(localOffset, step, goTo - current, Math.floor(current / step), beatsnap, localOffset + (Math.round(current / step) + 1) * step);

        // console.log(current, goTo);

        // if (!playingFlag) {
        //     if (currentFrameReq) window.cancelAnimationFrame(currentFrameReq);

        //     currentFrameReq = window.requestAnimationFrame((currentTime) => {
        //         return pushFrame(current, goTo, Math.abs(current - goTo));
        //     });
        // }

        beatmapFile.audioNode.seekTo(goTo);
        // console.log(beatmapFile.audioNode.currentTime);
        document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
        beatmapFile.beatmapRenderData.objectsList.draw(goTo, true);
        // setAudioTime();
    }
}

function goBack(precise) {
    if (beatmapFile !== undefined) {
        let step = 10;
        let currentBeatstep;
        const current = beatmapFile.audioNode.getCurrentTime();

        if (beatsteps.length) {
            currentBeatstep =
                beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime()) !== undefined
                    ? beatsteps.findLast((timingPoint) => timingPoint.time <= beatmapFile.audioNode.getCurrentTime())
                    : beatsteps[0];

            step = currentBeatstep.beatstep / (precise ? 48 : parseInt(beatsnap));
        }

        const localOffset = currentBeatstep.time % step;
        const goTo = Math.min(Math.max(localOffset + (Math.floor(current / step) - 1) * step, 0), beatmapFile.audioNode.buf.duration * 1000);
        // console.log(localOffset, step, goTo - current, Math.round(current / step), beatsnap, localOffset + (Math.round(current / step) + 1) * step);

        // console.log(currentBeatstep, localOffset, goTo);
        // if (!playingFlag) {
        //     if (currentFrameReq) window.cancelAnimationFrame(currentFrameReq);

        //     currentFrameReq = window.requestAnimationFrame((currentTime) => {
        //         return pushFrame(current, goTo, Math.abs(current - goTo));
        //     });
        // }

        beatmapFile.audioNode.seekTo(goTo);
        // console.log(beatmapFile.audioNode.currentTime);
        document.querySelector("#progress").value = beatmapFile.audioNode.currentTime;
        beatmapFile.beatmapRenderData.objectsList.draw(goTo, true);

        // setAudioTime();
    }
}

function copyUrlToClipboard() {
    const origin = window.location.origin;
    const currentTimestamp = beatmapFile !== undefined ? parseInt(beatmapFile.audioNode.getCurrentTime()) : 0;
    const mapId = currentMapId || "";
    navigator.clipboard.writeText(`${origin}/beatmap-viewer-how?b=${mapId}&t=${currentTimestamp}`);
}

screen.orientation.onchange = () => {
    console.log("Orientation Changed");
    // canvas.width =
    //     (1080 * parseInt(getComputedStyle(document.querySelector("#playerContainer")).width)) /
    //     parseInt(getComputedStyle(document.querySelector("#playerContainer")).height);

    // console.log(
    //     parseInt(getComputedStyle(document.querySelector("#playerContainer")).width),
    //     parseInt(getComputedStyle(document.querySelector("#playerContainer")).height),
    //     canvas.width,
    //     canvas.height
    // );
    if (beatmapFile !== undefined) beatmapFile.beatmapRenderData.objectsList.draw(beatmapFile.audioNode.getCurrentTime(), true);
};

let beatmapFile;

if (urlParams.get("b") && /[0-9]+/g.test(urlParams.get("b"))) {
    beatmapFile = new BeatmapFile(urlParams.get("b"));
    BEATMAPID = parseInt(urlParams.get("b"));
}

submitMap();

const handleCanvasDrag = (e, calledFromDraw) => {
    // console.log(e);

    const x = currentX;
    const y = currentY;

    const currentTime = beatmapFile.audioNode.getCurrentTime();

    const start_X = startX;
    const start_Y = startY;

    let currentAR = !mods.EZ ? approachRate : approachRate / 2;
    currentAR = !mods.HR ? currentAR : Math.min((currentAR * 4) / 3, 10);
    const currentPreempt = currentAR < 5 ? 1200 + (600 * (5 - currentAR)) / 5 : currentAR > 5 ? 1200 - (750 * (currentAR - 5)) / 5 : 1200;

    const selectedObjList = beatmapFile.beatmapRenderData.objectsList.objectsList
        .filter((o) => {
            const lowerBound = o.time - currentPreempt;
            const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);

            return (
                (lowerBound <= Math.min(draggingStartTime, draggingEndTime) && upperBound >= Math.max(draggingStartTime, draggingEndTime)) ||
                (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime)) ||
                (lowerBound >= Math.min(draggingStartTime, draggingEndTime) && lowerBound <= Math.max(draggingStartTime, draggingEndTime)) ||
                (upperBound >= Math.min(draggingStartTime, draggingEndTime) && upperBound <= Math.max(draggingStartTime, draggingEndTime))
            );
        })
        .filter((o) => {
            // console.log(Math.min(draggingStartTime, draggingEndTime), Math.max(draggingStartTime, draggingEndTime), o.time, lowerBound, upperBound);

            const coordLowerBound = {
                x: Math.min(x, start_X),
                y: Math.min(y, start_Y),
            };

            const coordUpperBound = {
                x: Math.max(x, start_X),
                y: Math.max(y, start_Y),
            };

            if (o.obj instanceof HitCircle) {
                const positionX = o.obj.originalX + stackOffset * o.obj.stackHeight;
                const positionY = (!mods.HR ? o.obj.originalY : 384 - o.obj.originalY) + stackOffset * o.obj.stackHeight;

                // console.log(
                //     o.time,
                //     lowerBound <= currentTime,
                //     upperBound >= currentTime,
                //     { x: positionX, y: positionY },
                //     coordLowerBound,
                //     coordUpperBound
                // );

                return (
                    positionX >= coordLowerBound.x &&
                    positionX <= coordUpperBound.x &&
                    positionY >= coordLowerBound.y &&
                    positionY <= coordUpperBound.y
                );
            }

            if (o.obj instanceof Slider) {
                const renderableAngleList = o.obj.angleList;

                const res = renderableAngleList.some((point) => {
                    const positionX = point.x + stackOffset * o.obj.stackHeight;
                    const positionY = (!mods.HR ? point.y : 384 - point.y) + stackOffset * o.obj.stackHeight;

                    return (
                        positionX + stackOffset * o.obj.stackHeight >= coordLowerBound.x &&
                        positionX + stackOffset * o.obj.stackHeight <= coordUpperBound.x &&
                        positionY + stackOffset * o.obj.stackHeight >= coordLowerBound.y &&
                        positionY + stackOffset * o.obj.stackHeight <= coordUpperBound.y
                    );
                });

                // console.log(o.time, res);
                return res;
            }

            return false;
        });

    // console.log("x: " + x + " y: " + y, selectedObj);

    if (selectedObjList.length) {
        selectedHitObject = selectedObjList.map((o) => o.time);
    } else if (e && !e.ctrlKey) {
        selectedHitObject = [];
    }

    if (!calledFromDraw) beatmapFile.beatmapRenderData.objectsList.draw(currentTime, true);

    // console.log(selectedHitObject);
};

// beatmapFile = new BeatmapFile(mapId);

bg.interactive = true;
bg.on("click", (e) => {
    if (beatmapFile) {
        const currentTime = beatmapFile.audioNode.getCurrentTime();

        // console.log(isDragging);

        let { x, y } = container.toLocal(e.global);
        x /= w / 512;
        y /= w / 512;

        const HRMultiplier = !mods.HR ? 1 : 4 / 3;
        const EZMultiplier = !mods.EZ ? 1 : 1 / 2;
        let currentHitCircleSize = 54.4 - 4.48 * circleSize * HRMultiplier * EZMultiplier;

        let currentAR = !mods.EZ ? approachRate : approachRate / 2;
        currentAR = !mods.HR ? currentAR : Math.min((currentAR * 4) / 3, 10);
        const currentPreempt = currentAR < 5 ? 1200 + (600 * (5 - currentAR)) / 5 : currentAR > 5 ? 1200 - (750 * (currentAR - 5)) / 5 : 1200;
        const drawOffset = currentHitCircleSize;

        const selectedObjList = beatmapFile.beatmapRenderData.objectsList.objectsList
            .filter((o) => {
                const lowerBound = o.time - currentPreempt;
                const upperBound = sliderAppearance.hitAnim ? o.endTime + 240 : Math.max(o.time + 800, o.endTime + 240);

                return (lowerBound <= currentTime && upperBound >= currentTime) || selectedHitObject.includes(o.time);
            })
            .filter((o) => {
                if (o.obj instanceof HitCircle) {
                    const positionX = o.obj.originalX + stackOffset * o.obj.stackHeight;
                    const positionY = (!mods.HR ? o.obj.originalY : 384 - o.obj.originalY) + stackOffset * o.obj.stackHeight;

                    return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
                }

                if (o.obj instanceof Slider) {
                    const renderableAngleList = o.obj.angleList;

                    const res = renderableAngleList.some((point) => {
                        const positionX = point.x + stackOffset * o.obj.stackHeight;
                        const positionY = (!mods.HR ? point.y : 384 - point.y) + stackOffset * o.obj.stackHeight;

                        return (x - positionX) ** 2 + (y - positionY) ** 2 <= drawOffset ** 2;
                    });

                    // console.log(o.time, res);
                    return res;
                }

                return false;
            });

        const selectedObj = selectedObjList.length
            ? selectedObjList.reduce((prev, curr) => {
                  const prevOffset = Math.abs(prev.time - currentTime);
                  const currOffset = Math.abs(curr.time - currentTime);

                  return prevOffset > currOffset ? curr : prev;
              })
            : undefined;

        // console.log("x: " + x + " y: " + y, selectedObj);

        if (selectedObj) {
            if (!e.ctrlKey) selectedHitObject = [selectedObj.time];
            else {
                selectedHitObject = selectedHitObject.concat([selectedObj.time]).filter((t, idx, a) => a.indexOf(t) === idx);
            }
        } else if (!didMove) {
            selectedHitObject = [];
        }

        // console.log(selectedHitObject);
        beatmapFile.beatmapRenderData.objectsList.draw(currentTime, true);
        didMove = false;
        // console.log("Mouse CLICK", didMove);
    }
});

bg.on("mousedown", (e) => {
    if (beatmapFile) {
        let { x, y } = container.toLocal(e.global);
        x /= w / 512;
        y /= w / 512;

        isDragging = true;
        draggingStartTime = beatmapFile.audioNode.getCurrentTime();
        startX = x;
        startY = y;

        dragWindow.clear();
        dragWindow.lineStyle({
            width: 2,
            color: 0xffffff,
            alpha: 1,
            alignment: 0,
        });

        dragWindow.drawRect(x, y, 0, 0);

        dragWindow.alpha = 1;

        // console.log("Mouse DOWN");
    }
});

bg.on("mouseup", (e) => {
    if (currentX !== -1 && currentY !== -1) {
        // console.log(selectedHitObject);
        // console.log(startX, startY, currentX, currentY);
    }
    // currentX = -1;
    // currentY = -1;
    isDragging = false;
    dragWindow.alpha = 0;
    // console.log("Mouse UP");
});

bg.on("mousemove", (e) => {
    if (beatmapFile)
        if (isDragging) {
            didMove = true;
            let { x, y } = container.toLocal(e.global);
            x /= w / 512;
            y /= w / 512;

            draggingEndTime = beatmapFile.audioNode.getCurrentTime();
            currentX = x;
            currentY = y;
            // console.log("Moving");
            handleCanvasDrag(e);

            dragWindow.clear();
            dragWindow.lineStyle({
                width: 2,
                color: 0xffffff,
                alpha: 1,
                alignment: 0,
            });

            dragWindow.drawRect(
                (Math.min(startX, x) * w) / 512,
                (Math.min(startY, y) * w) / 512,
                (Math.abs(x - startX) * w) / 512,
                (Math.abs(y - startY) * w) / 512
            );
            // console.log(startX, startY, currentX, currentY);
        }
});
