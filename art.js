const art = document.getElementById("art");
const artNameSelect = document.getElementById("artName");
const randomArtCheckbox = document.getElementById("randomArt");
const clockColorCheckbox = document.getElementById("artClockColor");
const clockElement = document.getElementById("clock");

const ART_SETTINGS_KEY = "artSettings";

let currentArtIndex = 0;

const artOptions = {
    images: [
        {
            name: "pink-cars",
            url: "https://w.wallhaven.cc/full/k8/wallhaven-k881zd.jpg",
            color: "#efbcd9",
        },
        {
            name: "purple-computers",
            url: "https://w.wallhaven.cc/full/7j/wallhaven-7jp81o.jpg",
            color: "#d87dd9",
        },
        {
            name: "girl-painting",
            url: "https://w.wallhaven.cc/full/9o/wallhaven-9oozpx.png",
            color: "#fe6b97",
        },
        {
            name: "astronaut",
            url: "https://w.wallhaven.cc/full/qr/wallhaven-qrrlzr.jpg",
            color: "#c9decb",
        },
        {
            name: "lagoon-town",
            url: "https://w.wallhaven.cc/full/5y/wallhaven-5ygeg7.jpg",
            color: "#b8d1da",
        },
        {
            name: "hacker",
            url: "https://w.wallhaven.cc/full/3q/wallhaven-3qqqkv.jpg",
            color: "#5aac5f",
        },
        {
            name: "hacker-2",
            url: "https://w.wallhaven.cc/full/vp/wallhaven-vpppml.jpg",
            color: "#41a4a1",
        },
        {
            name: "future-cartoon",
            url: "https://w.wallhaven.cc/full/5y/wallhaven-5yy737.jpg",
            color: "#eda654",
        },
        {
            name: "retro-computers",
            url: "https://w.wallhaven.cc/full/zp/wallhaven-zpxjjo.jpg",
            color: "#f64d3a",
        },
        {
            name: "japan-town",
            url: "https://w.wallhaven.cc/full/8g/wallhaven-8gxwwk.jpg",
            color: "#f7ce00",
        },
    ],
};

let defaultClockColor = clockElement.style.color;
function setClockColor(value) {
    if (value) {
        let color = artOptions.images[currentArtIndex].color;
        clockElement.style.setProperty("color", color);
    } else {
        clockElement.style.setProperty("color", defaultClockColor);
    }
}

function setClockColorSetting(value) {
    clockColorCheckbox.checked = value;
    setClockColor(value);
}

function loadArtFromLocal() {
    const savedArtSettings = localStorage.getItem(ART_SETTINGS_KEY);
    if (savedArtSettings) {
        let deserialized = JSON.parse(savedArtSettings);
        clockColorCheckbox.checked = deserialized.clockColorFromArt;
        setArt(deserialized.artName, deserialized.random, false);
    } else {
        setArt(undefined, true, true);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    artOptions.images.forEach((image) => {
        const option = document.createElement("option");
        option.value = image.name;
        option.textContent = image.name;
        artName.appendChild(option);
    });

    loadArtFromLocal();
    loadArtFromRemote();
});

artNameSelect.addEventListener("change", () => {
    setArt(artNameSelect.value, false, true);
    randomArtCheckbox.checked = false;
});

randomArtCheckbox.addEventListener("change", (e) => {
    setArt(artNameSelect.value, e.target.checked, true);
});

clockColorCheckbox.addEventListener("change", (e) => {
    setClockColorSetting(e.target.checked);
    saveArtSettings();
});

function saveArtSettings() {
    saveArtSettingsToLocal();
    saveArtSettingsToRemote();
}

function saveArtSettingsToLocal() {
    localStorage.setItem(
        ART_SETTINGS_KEY,
        JSON.stringify({
            artName: artName.value,
            random: randomArt.checked,
            clockColorFromArt: clockColorCheckbox.checked,
        }),
    );
}

function saveArtSettingsToRemote() {
    if (!remoteBaseUrl) return;

    fetch(`${remoteBaseUrl}/art`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            artName: artName.value,
            random: randomArt.checked,
            clockColorFromArt: clockColorCheckbox.checked,
        }),
    })
        .then((response) => response.json())
        .catch((error) => console.error(error));
}

function loadArtFromRemote() {
    if (!remoteBaseUrl) return;

    fetch(`${remoteBaseUrl}/art`)
        .then((response) => response.json())
        .then((data) => {
            setArt(data.artName, data.random, false);
            setClockColorSetting(data.clockColorFromArt);
        })
        .catch((error) => console.error(error));

    saveArtSettingsToLocal();
}

const setArt = (artName, random, save) => {
    const img = document.createElement("img");

    if (random) {
        currentArtIndex = Math.floor(Math.random() * artOptions.images.length);
        let image = artOptions.images[currentArtIndex];
        img.src = image.url;
        randomArtCheckbox.checked = true;
    } else {
        if (!artName) return;
        try {
            let image = artOptions.images.filter((x) => x.name === artName)[0];
            currentArtIndex = artOptions.images.indexOf(image);
            img.src = artOptions.images[currentArtIndex].url;
        } catch {
            art.remove();
        }
        artNameSelect.value = artName;
        randomArtCheckbox.checked = false;
    }

    art.innerHTML = "";
    art.appendChild(img);

    setClockColor();

    if (save) saveArtSettings();
};
