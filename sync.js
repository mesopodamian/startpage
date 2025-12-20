// === Sync Configuration ===
const SHOW_SUCCESS_TOASTS = false; // Set to false to disable success notifications

// === Sync Fetch Wrapper ===
/**
 * Wrapper around fetch with standardized error handling
 * @param {string} endpoint - The API endpoint (will be appended to remoteBaseUrl)
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<{ok: boolean, data: any, error: string|null}>}
 */
async function syncFetch(endpoint, options = {}) {
    if (!remoteBaseUrl) {
        return { ok: false, data: null, error: "No server configured" };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    try {
        const response = await fetch(`${remoteBaseUrl}${endpoint}`, {
            ...options,
            signal: controller.signal,
        });

        if (!response.ok) {
            return {
                ok: false,
                data: null,
                error: `Server returned ${response.status}`,
            };
        }

        const data = await response.json();
        return { ok: true, data, error: null };
    } catch (error) {
        console.error("Sync error:", error);
        if (error.name === "AbortError") {
            return { ok: false, data: null, error: "Request timed out" };
        }
        return {
            ok: false,
            data: null,
            error: error.message || "Connection failed",
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

// === Links Sync Functions ===
function loadLinksFromRemote() {
    if (!remoteBaseUrl) return;

    syncFetch("/links").then((result) => {
        if (result.ok) {
            data = result.data;
            currentData = JSON.parse(JSON.stringify(result.data));
            saveToLocal();
            renderGroups(data);
            if (SHOW_SUCCESS_TOASTS) {
                showToast("Bookmarks synced", "success");
            }
        } else {
            showToast("Failed to load bookmarks", "error");
        }
    });
}

function saveLinksToRemote() {
    if (!remoteBaseUrl) return;

    const cleanData = stripHelpers(data);

    syncFetch("/links", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
    }).then((result) => {
        if (!result.ok) {
            showToast("Failed to save bookmarks", "error");
        }
    });
}

// === Theme Sync Functions ===
function loadThemeSettingsFromRemote() {
    if (!remoteBaseUrl) return;

    syncFetch("/theme").then((result) => {
        if (result.ok) {
            setArt(result.data.artName, result.data.randomArt, false);
            setAccentColorSetting(result.data.accentColorFromArt);
            setClockFont(result.data.clockFont, false);
            saveThemeSettingsToLocal();
            if (SHOW_SUCCESS_TOASTS) {
                showToast("Theme synced", "success");
            }
        } else {
            showToast("Failed to load theme", "error");
        }
    });
}

function saveThemeSettingsToRemote() {
    if (!remoteBaseUrl) return;

    syncFetch("/theme", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            artName: artNameSelect.value,
            randomArt: randomArtCheckbox.checked,
            accentColorFromArt: accentColorCheckbox.checked,
            clockFont: clockFontSelect.value,
        }),
    }).then((result) => {
        if (!result.ok) {
            showToast("Failed to save theme", "error");
        }
    });
}
