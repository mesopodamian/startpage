const art = document.getElementById("art");
const artNameSelect = document.getElementById("artName");
const randomArtCheckbox = document.getElementById("randomArt");

const ART_SETTINGS_KEY = "artSettings";

const artOptions = {
    images: [
        {
            name: "pink-cars",
            url: "https://w.wallhaven.cc/full/k8/wallhaven-k881zd.jpg",
        },
        {
            name: "blue-computers",
            url: "https://w.wallhaven.cc/full/7j/wallhaven-7jp81o.jpg",
        },
        {
            name: "japan-minimini",
            url: "https://w.wallhaven.cc/full/e8/wallhaven-e88yjo.jpg",
        },
        {
            name: "compic-painting",
            url: "https://w.wallhaven.cc/full/9o/wallhaven-9oozpx.png",
        },
        {
            name: "astronaut",
            url: "https://w.wallhaven.cc/full/qr/wallhaven-qrrlzr.jpg",
        },
        {
            name: "lagoon-town",
            url: "https://w.wallhaven.cc/full/5y/wallhaven-5ygeg7.jpg",
        },
    ],
};

function loadArtFromLocal() {
    const savedArtSettings = localStorage.getItem(ART_SETTINGS_KEY);
    if (savedArtSettings) {
        let deserialized = JSON.parse(savedArtSettings);
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

randomArtCheckbox.addEventListener("change", () => {
    setArt(artNameSelect.value, true, true);
});

function saveArtSettings() {
    saveArtSettingsToLocal();
    saveArtSettingsToRemote();
}

function saveArtSettingsToLocal() {
    localStorage.setItem(
        ART_SETTINGS_KEY,
        JSON.stringify({ artName: artName.value, random: randomArt.checked }),
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
        }),
    })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error(error));
}

function loadArtFromRemote() {
    if (!remoteBaseUrl) return;

    fetch(`${remoteBaseUrl}/art`)
        .then((response) => response.json())
        .then((data) => {
            setArt(data.artName, data.random, false);
        })
        .catch((error) => console.error(error));

    saveArtSettingsToLocal();
}

const setArt = (artName, random, save) => {
    const img = document.createElement("img");

    if (random) {
        let image =
            artOptions.images[
                Math.floor(Math.random() * artOptions.images.length)
            ];
        img.src = image.url;
        randomArtCheckbox.checked = true;
    } else {
        if (!artName) return;
        try {
            img.src = artOptions.images.filter(
                (x) => x.name === artName,
            )[0].url;
        } catch {
            art.remove();
        }
        artNameSelect.value = artName;
        randomArtCheckbox.checked = false;
    }

    art.innerHTML = "";
    art.appendChild(img);

    if (save) saveArtSettings();
};
