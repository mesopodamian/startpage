const container = document.querySelector("main.container");

// Modals
const linkModal = document.getElementById("linkModal");
const linkForm = document.getElementById("linkForm");
const cancelLinkModal = document.getElementById("cancelLinkModal");

const groupModal = document.getElementById("groupModal");
const groupForm = document.getElementById("groupForm");
const cancelGroupModal = document.getElementById("cancelGroupModal");

const removeGroupModal = document.getElementById("removeGroupModal");
const removeGroupText = document.getElementById("removeGroupText");
const confirmRemoveGroup = document.getElementById("confirmRemoveGroup");
const cancelRemoveGroup = document.getElementById("cancelRemoveGroup");

const removeLinkModal = document.getElementById("removeLinkModal");
const removeLinkText = document.getElementById("removeLinkText");
const confirmRemoveLink = document.getElementById("confirmRemoveLink");
const cancelRemoveLink = document.getElementById("cancelRemoveLink");

// Menu elements
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const loadBtn = document.getElementById("loadBtn");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");
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

const LINKS_DATA_KEY = "linksData";
const REMOTE_SERVER_ADDRESS_SETTING_KEY = "remoteServerAddress";

let remoteBaseUrl = undefined;
let data = null;
let currentData = null;
let currentGroup = null;
let groupToDelete = null;
let linkToDelete = { groupId: null, linkIndex: null };
let renderItemActions = true;

let modalOpen = false;

let selected = undefined;

const helpText = `
'.' show all bookmarks
' ' search the web
`;

const BOOKMARKS_SEARCH_CHAR = ".";
const WEB_SEARCH_CHAR = " ";

window.addEventListener("DOMContentLoaded", () => {
    hideBookmarks();
    setHelpText(helpText);
});

// === Toggle Menu ===
menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("show");
    modalOpen = true;
});

overlay.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
    modalOpen = false;
});

// Move highlighted link with arrow keys
document.addEventListener("keydown", (e) => {
    if (e.key == "ArrowUp") {
        navigateLinks(-1);
        e.preventDefault();
    }
    if (e.key == "ArrowDown") {
        if (!searchInput.value) {
            searchInput.value = BOOKMARKS_SEARCH_CHAR;
            handleSearch(searchInput.value);
            return;
        }

        navigateLinks(1);
        e.preventDefault();
    }
});

document.addEventListener("keydown", (e) => {
    if (modalOpen) return;

    if (!searchInput.value || searchInput.value === BOOKMARKS_SEARCH_CHAR) {
        if (e.key == "ArrowUp" || e.key == "ArrowDown") return;
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
loadLinksFromLocal();
loadLinksFromRemote();

function navigateLinks(direction) {
    const links = Array.from(document.querySelectorAll(".link-item"));

    if (!selected || direction === 0) {
        // Handle the case where no element is initially highlighted
        selected = links[0]; // Select the first link
        if (selected) selected.classList.add("highlighted");
        return;
    }

    let currentIndex = links.indexOf(selected);
    let nextIndex = currentIndex + direction;

    // Wrap around if we reach the beginning or end of the list
    if (nextIndex < 0) {
        nextIndex = links.length - 1;
    } else if (nextIndex >= links.length) {
        nextIndex = 0;
    }

    // Remove highlighted class from the current selected element
    selected.classList.remove("highlighted");

    // Update selected and add highlighted class to the new element
    selected = links[nextIndex];
    if (selected) {
        selected.classList.add("highlighted");
        selected.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
        });
    }
}

function loadLinksFromLocal() {
    const saved = localStorage.getItem(LINKS_DATA_KEY);
    if (saved) {
        data = JSON.parse(saved);
        currentData = JSON.parse(JSON.stringify(data));
        renderGroups(data);
    }
}

/* === Load JSON manually === */
loadBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            data = JSON.parse(event.target.result);
            saveToLocal();
            saveLinksToRemote();
            renderGroups(data);
        } catch {
            // TODO: Show some error message to the user
            console.error("Invalid JSON structure");
        }
    };
    reader.readAsText(file);
});

// === Clear Local Data ===
clearBtn.addEventListener("click", () => {
    const confirmClear = confirm("Clear all locally saved data?");
    if (!confirmClear) return;
    localStorage.removeItem(LINKS_DATA_KEY);
    data = { groups: [] };
    currentData = JSON.parse(JSON.stringify(data));
    renderGroups(data);
});

// === Load Chrome bookmarks ===
const loadBookmarksBtn = document.getElementById("loadBookmarksBtn");
const bookmarksFile = document.getElementById("bookmarksFile");

loadBookmarksBtn.addEventListener("click", () => bookmarksFile.click());
bookmarksFile.addEventListener("change", handleBookmarksUpload);

function showBookmarks() {
    container.style.display = "block";
    clock.style.display = "none";
    help.style.display = "none";
    hero.classList.remove("hero-top");
    topContainer.classList.remove("top-container-hidden-items");

    art.style.display = "none";
}

function hideBookmarks() {
    container.style.display = "none";
    clock.style.display = "block";
    help.style.display = "flex";
    hero.classList.add("hero-top");
    topContainer.classList.add("top-container-hidden-items");

    art.style.display = "flex";
}

function toggleBookmarks() {
    container.classList.contains("hidden") ? showBookmarks() : hideBookmarks();
}

function setHelpText(text) {
    help.innerHTML = `<code>${text.trim()}</code>`;
}

function handleBookmarksUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const html = event.target.result;
            const parsedData = parseBookmarksHTML(html);

            if (!data) data = { groups: [] };
            // merge groups
            data = parsedData;
            currentData = JSON.parse(JSON.stringify(data));

            saveToLocal();
            saveLinksToRemote();
            renderGroups(data);
            alert("Bookmarks imported successfully!");
        } catch (err) {
            console.error("Failed to parse bookmarks:", err);
            alert("Invalid Chrome bookmarks HTML");
        }
    };
    reader.readAsText(file);
}

/**
 * Parse Chrome Bookmarks HTML into your JSON format:
 * Each <H3> folder becomes a group.
 * Subfolders are treated as separate groups.
 */
function parseBookmarksHTML(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    function parseDL(dl) {
        const groups = [];
        let currentGroup = null;

        Array.from(dl.children).forEach((node) => {
            if (node.tagName !== "DT") return;
            const first = node.firstElementChild;
            if (!first) return;

            if (first.tagName === "H3") {
                // Folder
                const folderName = first.textContent.trim() || "Unnamed Folder";
                const innerDL = node.querySelector(":scope > DL");
                const subGroups = innerDL ? parseDL(innerDL) : [];

                currentGroup = {
                    name: folderName,
                    links: [],
                    groups: subGroups,
                    id: uuidv4(),
                };

                // collect direct links inside this folder (not nested)
                if (innerDL) {
                    Array.from(innerDL.children).forEach((child) => {
                        if (child.tagName !== "DT") return;
                        const a = child.querySelector(":scope > A");
                        if (a && a.href) {
                            let title = a.textContent.trim();
                            const url = a.href;
                            if (!title) {
                                try {
                                    const u = new URL(url);
                                    title = u.hostname.replace(/^www\./, "");
                                } catch {
                                    title = url;
                                }
                            }
                            currentGroup.links.push({ title, url });
                        }
                    });
                }

                groups.push(currentGroup);
                currentGroup = null;
            }
        });

        return groups;
    }

    const rootDL = doc.querySelector("DL");
    if (!rootDL) return { groups: [] };

    const parsed = { groups: parseDL(rootDL) };
    return parsed;
}

function stripHelpers(obj) {
    if (Array.isArray(obj)) {
        return obj.map(stripHelpers);
    } else if (obj && typeof obj === "object") {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
            if (k === "_parent" || k === "_depth") continue;
            out[k] = stripHelpers(v);
        }
        return out;
    }
    return obj;
}

/* === Save to localStorage === */
function saveToLocal() {
    if (!data) return;
    const cleanData = stripHelpers(data);
    localStorage.setItem(LINKS_DATA_KEY, JSON.stringify(cleanData));
}

/* === Render Groups === */
function renderGroups(data, { expandAll = false, showEmpty = false } = {}) {
    container.innerHTML = "";

    if (!data || !data.groups || !data.groups.length === 0) {
        container.innerHTML =
            "<p style='opacity:0.7'>No bookmarks loaded yet.</p>";
        return;
    }

    // --- Flatten the nested tree and record parent relationships ---
    const flatGroups = [];
    const flatten = (groups, parent = null, depth = 0) => {
        groups.forEach((g, index) => {
            g._parent = parent;
            g._depth = depth;
            flatGroups.push(g);
            if (g.groups && g.groups.length) flatten(g.groups, g, depth + 1);
        });
    };
    flatten(data.groups);

    // --- openSet: determines which groups are expanded ---
    const openSet = expandAll
        ? new Set(flatGroups) // all expanded
        : new Set(); // all collapsed by default

    // --- helper: visible if all ancestors are open ---
    function isVisible(group) {
        if (group._depth === 0) return true;
        let p = group._parent;
        while (p) {
            if (!openSet.has(p)) return false;
            p = p._parent;
        }
        return true;
    }

    // --- build whole UI ---
    function buildUI() {
        container.innerHTML = "";

        flatGroups.forEach((group, gIndex) => {
            if (group.links.length === 0 && !showEmpty) return;
            const visible = isVisible(group);
            const section = document.createElement("section");
            section.classList.add("group");
            section.style.display = visible ? "" : "none";

            // HEADER
            const header = document.createElement("div");
            header.classList.add("group-header");

            const h2 = document.createElement("h2");
            h2.textContent = group.name;

            const toggle = document.createElement("span");
            toggle.classList.add("toggle-icon");

            const hasChildren = group.groups && group.groups.length > 0;

            if (hasChildren) {
                const open = openSet.has(group);
                toggle.textContent = open ? "▼" : "▶";
                toggle.style.opacity = "0.3";
                header.addEventListener("click", () => {
                    if (openSet.has(group)) {
                        // close group and all descendants
                        const closeRecursively = (g) => {
                            openSet.delete(g);
                            g.groups?.forEach(closeRecursively);
                        };
                        closeRecursively(group);
                    } else {
                        openSet.add(group);
                    }
                    buildUI();
                });
            } else {
                toggle.textContent = "•";
                toggle.style.opacity = "0.3";
            }

            let deleteBtn = undefined;
            if (renderItemActions) {
                deleteBtn = document.createElement("button");
                deleteBtn.classList.add("remove-btn", "remove-x");
                deleteBtn.textContent = "×";
                deleteBtn.title = "Remove group";
                deleteBtn.addEventListener("click", () =>
                    openRemoveGroupModal(group, group._parent),
                );
            }

            header.appendChild(h2);
            if (renderItemActions) {
                const addBtn = document.createElement("button");
                addBtn.classList.add("remove-btn", "remove-x");
                addBtn.textContent = "+";
                addBtn.addEventListener("click", () => openLinkModal(group));
                header.appendChild(addBtn);
            }
            if (deleteBtn) {
                header.appendChild(deleteBtn);
            }
            header.appendChild(toggle);
            section.appendChild(header);

            // LINKS
            if (group.links && group.links.length > 0) {
                const ul = document.createElement("ul");
                ul.classList.add("link-list");
                group.links.forEach((link, lIndex) => {
                    const li = document.createElement("li");
                    li.classList.add("link-item");
                    const a = document.createElement("a");
                    a.href = link.url;
                    a.target = "_blank";
                    a.textContent = link.title;

                    let linkRemoveBtn = undefined;
                    if (renderItemActions) {
                        linkRemoveBtn = document.createElement("button");
                        linkRemoveBtn.classList.add("link-remove-btn");
                        linkRemoveBtn.textContent = "×";
                        linkRemoveBtn.title = "Remove link";
                        linkRemoveBtn.addEventListener("click", () =>
                            openRemoveLinkModal(group, lIndex),
                        );
                    }

                    li.appendChild(a);
                    if (linkRemoveBtn) li.appendChild(linkRemoveBtn);
                    ul.appendChild(li);
                });
                section.appendChild(ul);
            }

            container.appendChild(section);
        });

        if (renderItemActions) {
            const addGroupBtn = document.createElement("button");
            addGroupBtn.classList.add("add-btn");
            addGroupBtn.textContent = "+ Add group";
            addGroupBtn.style.alignSelf = "flex-start";
            addGroupBtn.addEventListener("click", () => {
                groupModal.classList.add("show");
                groupForm.reset();
                document.getElementById("groupName").focus();
            });
            container.appendChild(addGroupBtn);
        }
    }

    buildUI();
}

/* === SEARCH === */

/* clone currentData without helper props */
function cloneClean(obj) {
    return JSON.parse(
        JSON.stringify(obj, (k, v) =>
            k === "_parent" || k === "_depth" ? undefined : v,
        ),
    );
}

/* --- deep recursive search for schema with nested "groups" --- */
function filterDataTree(source, query) {
    if (!source || !Array.isArray(source.groups)) return { groups: [] };

    function filterGroup(g) {
        const nameMatch = (g.name || "").toLowerCase().includes(query);

        const matchedLinks = (g.links || []).filter((l) =>
            (l.title || "").toLowerCase().includes(query),
        );

        const matchedChildren = (g.groups || [])
            .map(filterGroup)
            .filter(Boolean);

        if (nameMatch || matchedLinks.length || matchedChildren.length) {
            return {
                name: g.name,
                links: matchedLinks,
                groups: matchedChildren,
            };
        }
        return null;
    }

    return {
        groups: (source.groups || []).map(filterGroup).filter(Boolean),
    };
}

/* --- Search handler --- */
function handleSearch(query) {
    let filtered = {};

    if (query.startsWith(WEB_SEARCH_CHAR)) {
        if (!query.trim()) {
            renderGroups(cloneClean(currentData)); // reset
            hideBookmarks();
            return;
        }

        renderItemActions = false;
        // Handle space prefix logic here
        filtered = {
            groups: [
                {
                    name: "DuckDuckGo.com",
                    links: [
                        {
                            title: `Search for: ${query.trim()}`,
                            url: `https://duckduckgo.com/?q=${query.trim()}`,
                        },
                    ],
                    groups: [],
                },
            ],
        };
    } else {
        if (!currentData) return;

        query = query.trim();

        const clean = cloneClean(currentData);

        if (!query) {
            renderGroups(clean); // reset
            hideBookmarks();
            return;
        }

        filtered = query.startsWith(BOOKMARKS_SEARCH_CHAR)
            ? clean
            : filterDataTree(clean, query.toLowerCase());
    }

    showBookmarks();
    renderGroups(filtered, {
        expandAll: true,
        showEmpty: query.startsWith(BOOKMARKS_SEARCH_CHAR),
    });
    navigateLinks(0);
    renderItemActions = true;
}

/* --- attach input + Enter key --- */
if (searchInput) {
    searchInput.addEventListener("input", () => {
        handleSearch(searchInput.value.toLowerCase());
    });

    // Press Enter → open first visible match
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) return;

            if (selected) {
                const target = isCtrlPressed(e) ? "_blank" : "_self";
                window.open(selected.firstChild.href, target);
                e.preventDefault();
            }
        }
    });
}

function isCtrlPressed(event) {
    return event.ctrlKey;
}

function showTime() {
    var date = new Date();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();

    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;

    var time = h + ":" + m + ":" + s;
    clock.innerText = time;
    clock.textContent = time;

    setTimeout(showTime, 1000);
}

showTime();

/* === Remove Group (Modal) === */
function openRemoveGroupModal(group, parentGroup = null) {
    modalOpen = true;
    groupToDelete = { group, parent: parentGroup };

    const name = group.name || "Unnamed Group";
    removeGroupText.textContent = `Are you sure you want to remove the group: "${name}"?`;
    removeGroupModal.classList.add("show");
}

function closeRemoveGroupModal() {
    removeGroupModal.classList.remove("show");
    groupToDelete = null;
    modalOpen = false;
}

confirmRemoveGroup.addEventListener("click", () => {
    if (!groupToDelete || !groupToDelete.group) return;

    const { group, parent } = groupToDelete;

    function removeFromArray(arr, target) {
        var group = arr.filter((x) => x.id == target.id)[0];
        if (group) {
            var idx = arr.indexOf(group);
            if (idx !== -1) arr.splice(idx, 1);
        }
    }

    if (parent) {
        // nested group → remove from its parent’s groups array
        removeFromArray(parent.groups, group);
    } else {
        // root group → remove from top-level
        removeFromArray(data.groups, group);
    }

    saveToLocal();
    saveLinksToRemote();
    renderGroups(data, { showEmpty: true, expandAll: true });
    closeRemoveGroupModal();
});

cancelRemoveGroup.addEventListener("click", () => closeRemoveGroupModal());
removeGroupModal.addEventListener("click", (e) => {
    if (e.target === removeGroupModal) closeRemoveGroupModal();
});

/* === Remove Link (Modal) === */
function openRemoveLinkModal(group, linkIndex) {
    modalOpen = true;
    linkToDelete = { groupId: group.id, linkIndex };

    const linkName = group.links[linkIndex].title;
    removeLinkText.textContent = `Remove link "${linkName}"?`;
    removeLinkModal.classList.add("show");
}

function closeRemoveLinkModal() {
    removeLinkModal.classList.remove("show");
    linkToDelete = { groupId: null, linkIndex: null };
    modalOpen = false;
}

confirmRemoveLink.addEventListener("click", () => {
    const { groupId, linkIndex } = linkToDelete;
    if (!groupId || linkIndex == null) return;

    let group = findGroupRecursively(data, groupId);
    if (group) {
        group.links.splice(linkIndex, 1);
        saveToLocal();
        saveLinksToRemote();
        renderGroups(data, { showEmpty: true, expandAll: true });
    }

    closeRemoveLinkModal();
});

cancelRemoveLink.addEventListener("click", closeRemoveLinkModal);
removeLinkModal.addEventListener("click", (e) => {
    if (e.target === removeLinkModal) closeRemoveLinkModal();
});

/* === Link Modal === */
function openLinkModal(group) {
    modalOpen = true;
    currentGroup = group;
    linkModal.classList.add("show");
    linkForm.reset();
}

function closeLinkModal() {
    linkModal.classList.remove("show");
    modalOpen = false;
}

linkModal.addEventListener("click", (e) => {
    if (e.target === linkModal) closeLinkModal();
});

cancelLinkModal.addEventListener("click", closeLinkModal);

// Add new link handler
linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("linkTitle").value.trim();
    const url = document.getElementById("linkUrl").value.trim();
    if (!title || !url) return;
    const newLink = { title, url };
    let group = findGroupRecursively(data, currentGroup.id);
    if (group) {
        group.links.push(newLink);
        saveToLocal();
        saveLinksToRemote();
        renderGroups(data, { expandAll: true, showEmpty: true });
    }
    closeLinkModal();
});

/* === Group Modal === */
groupModal.addEventListener("click", (e) => {
    if (e.target === groupModal) closeGroupModal();
});

cancelGroupModal.addEventListener("click", closeGroupModal);

function closeGroupModal() {
    groupModal.classList.remove("show");
    modalOpen = false;
}

// Add new group handler
groupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("groupName").value.trim();
    if (!name) return;
    if (!data) {
        data = { groups: [] };
        currentData = JSON.parse(JSON.stringify(data));
    }
    data.groups.push({ name, links: [], groups: [], id: uuidv4() });
    saveToLocal();
    saveLinksToRemote();
    renderGroups(data, { expandAll: true, showEmpty: true });
    closeGroupModal();
});

function findGroupRecursively(data, groupId) {
    if (!data || typeof data !== "object") {
        return null;
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            const result = findGroupRecursively(item, groupId);
            if (result) {
                return result;
            }
        }
        return null;
    }

    if (data.groups && Array.isArray(data.groups)) {
        for (const group of data.groups) {
            if (group.id === groupId) {
                return group;
            }
            const result = findGroupRecursively(group, groupId);
            if (result) {
                return result;
            }
        }
    }

    if (data.links && Array.isArray(data.links)) {
        for (const link of data.links) {
            const result = findGroupRecursively(link, groupId);
            if (result) {
                return result;
            }
        }
    }

    return null;
}

/* === Download JSON === */
downloadBtn.addEventListener("click", () => {
    if (!data) {
        alert("No data loaded yet!");
        return;
    }

    // remove circular helper keys before saving
    const cleanData = stripHelpers(data);

    const blob = new Blob([JSON.stringify(cleanData, null, 2)], {
        type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "links.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

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
    }
}

function loadLinksFromRemote() {
    if (!remoteBaseUrl) return;

    remoteServerAddressInput.value = remoteBaseUrl;

    fetch(`${remoteBaseUrl}/links`)
        .then((response) => response.json())
        .then((data) => {
            data = data;
            currentData = JSON.parse(JSON.stringify(data));
            saveToLocal();
        })
        .catch((error) => console.error(error));
}

function saveLinksToRemote() {
    if (!remoteBaseUrl) return;

    const cleanData = stripHelpers(data);

    fetch(`${remoteBaseUrl}/links`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
    })
        .then((response) => response.json())
        .then((data) => console.log(data))
        .catch((error) => console.error(error));
}
