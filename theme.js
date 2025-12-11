const rootElement = document.documentElement;
const art = document.getElementById("art");
const artNameSelect = document.getElementById("artName");
const randomArtCheckbox = document.getElementById("randomArt");
const accentColorCheckbox = document.getElementById("artAccentColor");
const clockElement = document.getElementById("clock");

const THEME_SETTINGS_KEY = "themeSettings";

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

window.addEventListener("DOMContentLoaded", () => {
    artOptions.images.forEach((image) => {
        const option = document.createElement("option");
        option.value = image.name;
        option.textContent = image.name;
        artNameSelect.appendChild(option);
    });

    loadThemeSettingsFromLocal();
    loadThemeSettingsFromRemote();
});

artNameSelect.addEventListener("change", () => {
    setArt(artNameSelect.value, false, true);
    randomArtCheckbox.checked = false;
    setAccentColorSetting(accentColorCheckbox.checked);
});

randomArtCheckbox.addEventListener("change", (e) => {
    setArt(artNameSelect.value, e.target.checked, true);
});

accentColorCheckbox.addEventListener("change", (e) => {
    setAccentColorSetting(e.target.checked);
    saveThemeSettings();
});

function loadThemeSettingsFromLocal() {
    const savedArtSettings = localStorage.getItem(THEME_SETTINGS_KEY);
    if (savedArtSettings) {
        let deserialized = JSON.parse(savedArtSettings);
        setArt(deserialized.artName, deserialized.randomArt, false);
        setAccentColorSetting(deserialized.accentColorFromArt);
    } else {
        setArt(undefined, true, true);
    }
}

function saveThemeSettings() {
    saveThemeSettingsToLocal();
    saveThemeSettingsToRemote();
}

function saveThemeSettingsToLocal() {
    localStorage.setItem(
        THEME_SETTINGS_KEY,
        JSON.stringify({
            artName: artNameSelect.value,
            randomArt: randomArtCheckbox.checked,
            accentColorFromArt: accentColorCheckbox.checked,
        }),
    );
}

function saveThemeSettingsToRemote() {
    if (!remoteBaseUrl) return;

    fetch(`${remoteBaseUrl}/theme`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            artName: artNameSelect.value,
            randomArt: randomArtCheckbox.checked,
            accentColorFromArt: accentColorCheckbox.checked,
        }),
    })
        .then((response) => response.json())
        .catch((error) => console.error(error));
}

function loadThemeSettingsFromRemote() {
    if (!remoteBaseUrl) return;

    fetch(`${remoteBaseUrl}/theme`)
        .then((response) => response.json())
        .then((data) => {
            setArt(data.artName, data.randomArt, false);
            setAccentColorSetting(data.accentColorFromArt);
            saveThemeSettingsToLocal();
        })
        .catch((error) => console.error(error));
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

    if (save) saveThemeSettings();
};

function setAccentColorSetting(value) {
    accentColorCheckbox.checked = value;
    setClockColor(value);
}

const defaultClockColor = getComputedStyle(clockElement).color;
function setClockColor(value) {
    if (value) {
        let color = artOptions.images[currentArtIndex].color;
        rootElement.style.setProperty("--color-accent", color);
        rootElement.style.setProperty(
            "--color-accent-hover",
            darkenColorRGB(color, 20),
        );
        clockElement.style.setProperty("color", color);
    } else {
        rootElement.style.setProperty("--color-accent", defaultClockColor);
        rootElement.style.setProperty(
            "--color-accent-hover",
            darkenColorRGB(defaultClockColor, 20),
        );
        clockElement.style.setProperty("color", defaultClockColor);
    }
}

function darkenColorRGB(hexColor, darkenAmount) {
    // Convert hex to RGB
    let rgb = hexToRGB(hexColor);

    if (!rgb) {
        return null; // Invalid hex color
    }

    // Darken each component (R, G, B)
    let r = Math.max(0, Math.min(255, rgb.r - darkenAmount));
    let g = Math.max(0, Math.min(255, rgb.g - darkenAmount));
    let b = Math.max(0, Math.min(255, rgb.b - darkenAmount));

    // Convert RGB back to hex
    return RGBToHex(r, g, b);
}

function hexToRGB(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return null;
    }
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

function RGBToHex(r, g, b) {
    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
