class BeatmapFile {
    osuFile;
    mapId;
    audioBlobURL;
    backgroundBlobURL;
    audio;
    beatmapRenderData;

    constructor(mapId) {
        this.mapId = mapId;
        this.constructMap();
    }

    async getOsuFile() {
        const rawOsuFile = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}/osu`)).data;
        this.osuFile = rawOsuFile;
    }

    async getOsz() {
        const mapsetData = (await axios.get(`https://tryz.vercel.app/api/b/${this.mapId}`)).data;
        const setId = mapsetData.id;

        const requestClient = axios.create({
            baseURL: `https://api.chimu.moe/v1/download/`,
        });
        const mapFileBlob = (
            await requestClient.get(`${setId}`, {
                responseType: "blob",
                onDownloadProgress: (progressEvent) => {
                    // console.log(progressEvent);
                },
            })
        ).data;

        await this.getOsuFile();
        const audioFilename = this.osuFile
            .split("\r\n")
            .filter((line) => line.match(/AudioFilename: /g))[0]
            .replace("AudioFilename: ", "");
        const backgroundFilename = this.osuFile
            .split("\r\n")
            .filter((line) => line.match(/0,0,"*.*"/g))[0]
            .match(/"[\/\\\!\(\)\[\]\{\}a-zA-Z0-9\s\._-]+\.[a-zA-Z0-9]+"/g)[0]
            .replaceAll('"', "");

        console.log(audioFilename, backgroundFilename);

        const mapFileBlobReader = new zip.BlobReader(mapFileBlob);
        const zipReader = new zip.ZipReader(mapFileBlobReader);

        const audioFile = (await zipReader.getEntries()).filter((e) => e.filename === audioFilename).shift();
        const audioBlob = await audioFile.getData(new zip.BlobWriter(`audio/${audioFilename.split(".").at(-1)}`));
        this.audioBlobURL = URL.createObjectURL(audioBlob);

        const backgroundFile = (await zipReader.getEntries()).filter((e) => e.filename === backgroundFilename).shift();
        const backgroundBlob = await backgroundFile.getData(new zip.BlobWriter(`image/${backgroundFilename.split(".").at(-1)}`));
        this.backgroundBlobURL = URL.createObjectURL(backgroundBlob);

        zipReader.close();
    }

    async constructMap() {
        await this.getOsz();
        // console.log(this.osuFile, this.audioBlobURL, this.backgroundBlobURL);

        this.audio = new Audio(this.audioBlobURL);
        this.beatmapRenderData = new Beatmap(this.osuFile, 0);
        document.querySelector("#playerContainer").style.backgroundImage = `url(${this.backgroundBlobURL})`;
        document.body.style.backgroundImage = `url(${this.backgroundBlobURL})`;

        document.querySelector("#playButton").addEventListener("click", () => {
            if (isPlaying) {
                document.querySelector("#playButton").style.backgroundImage =
                    document.querySelector("#playButton").style.backgroundImage === "" ? "url(./static/pause.png)" : "";
                if (document.querySelector("audio").paused) {
                    this.audio.play();
                    this.beatmapRenderData.render();
                } else {
                    playingFlag = false;
                    document.querySelector("audio").pause();
                    this.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000);
                }
            } else {
                this.beatmapRenderData.render();
            }
        });

        document.querySelector("#settingsButton").addEventListener("click", () => {
            if (isPlaying && !playingFlag) {
                let time;

                const troll = (currentTime) => {
                    if (time === undefined) time = currentTime;
                    const elapsed = currentTime - time;

                    if (elapsed <= 200) {
                        this.beatmapRenderData.objectsList.draw(document.querySelector("audio").currentTime * 1000);
                        window.requestAnimationFrame((nextTime) => troll(nextTime));
                    }
                };

                window.requestAnimationFrame((currentTime) => troll(currentTime));
            }
        });
    }
}