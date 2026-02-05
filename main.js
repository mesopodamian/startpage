const container = document.querySelector("main.container");

// Menu elements
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const remoteServerAddressInput = document.getElementById("remoteServerAddress");
const remoteServerAddressSaveButton = document.getElementById(
    "remoteServerAddressSave",
);

// hero and clock elements
const hero = document.getElementById("hero");
const clock = document.getElementById("clock");
const searchInput = document.getElementById("searchInput");
const help = document.getElementById("help");
const topContainer = document.getElementById("topcontainer");

const REMOTE_SERVER_ADDRESS_SETTING_KEY = "remoteServerAddress";

let remoteBaseUrl = undefined;

// === Toggle Menu ===
menuToggle.addEventListener("click", () => {
    const isOpen = sideMenu.classList.toggle("open");
    overlay.classList.toggle("show");
    menuToggle.setAttribute("aria-expanded", isOpen);
    sideMenu.setAttribute("aria-hidden", !isOpen);
    modalOpen = true;
});

overlay.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
    menuToggle.setAttribute("aria-expanded", "false");
    sideMenu.setAttribute("aria-hidden", "true");
    modalOpen = false;
});

// Keyboard navigation handler
document.addEventListener("keydown", (e) => {
    // Close modals with Escape key
    if (e.key === "Escape" && modalOpen) {
        if (sideMenu.classList.contains("open")) {
            sideMenu.classList.remove("open");
            overlay.classList.remove("show");
            menuToggle.setAttribute("aria-expanded", "false");
            sideMenu.setAttribute("aria-hidden", "true");
            return;
        }
    }

    // Auto-focus search input
    if (!searchInput.value) {
        searchInput.focus();
        searchInput.select();
    }
});

remoteServerAddressSaveButton.addEventListener("click", () => {
    console.log("Saving remote server address");
    saveRemoteServerAddress();
});

/* === Load from localStorage === */
loadRemoteServerAddressFromLocal();

/* --- Search handler --- */
/* --- attach input + Enter key --- */
if (searchInput) {
    // Press Enter → open first visible match
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) return;

            const target = isCtrlPressed(e) ? "_blank" : "_self";
            window.open(
                `https://duckduckgo.com/?q=${encodeURIComponent(q.trim())}`,
                target,
            );
            e.preventDefault();
        }
    });
}

function isCtrlPressed(event) {
    return event.ctrlKey;
}

function showTime() {
    const date = new Date();
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");

    const time = `${h}:${m}:${s}`;
    clock.textContent = time;

    setTimeout(showTime, 1000);
}

showTime();

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (
            +c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
        ).toString(16),
    );
}

remoteServerAddressInput.addEventListener("change", () => {
    remoteBaseUrl = remoteServerAddressInput.value;
});

function loadRemoteServerAddressFromLocal() {
    const storedAddress = localStorage.getItem(
        REMOTE_SERVER_ADDRESS_SETTING_KEY,
    );
    if (storedAddress) {
        remoteServerAddressInput.value = storedAddress;
        remoteBaseUrl = storedAddress;
    }
}

function saveRemoteServerAddress() {
    const enteredAddress = remoteServerAddressInput.value;
    if (enteredAddress) {
        localStorage.setItem(REMOTE_SERVER_ADDRESS_SETTING_KEY, enteredAddress);
        remoteBaseUrl = enteredAddress;
    } else {
        localStorage.removeItem(REMOTE_SERVER_ADDRESS_SETTING_KEY);
        remoteBaseUrl = undefined;
    }
}
