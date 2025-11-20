const container = document.querySelector("main.container");
const loadBtn = document.getElementById("loadBtn");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");

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
const clearBtn = document.getElementById("clearBtn");

// hero and clock elements
const searchInput = document.getElementById("searchInput");
const hero = document.getElementById("hero");
const clock = document.getElementById("clock");

let data = null;
let currentData = null;
let currentGroup = null;
let groupToDelete = null;
let linkToDelete = { groupIndex: null, linkIndex: null };
let renderItemActions = true;

let selected = undefined;

// === Toggle Menu ===
menuToggle.addEventListener("click", () => {
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("show");
});

overlay.addEventListener("click", () => {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
});

window.addEventListener("DOMContentLoaded", () => {
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key == "ArrowUp") {
        navigateLinks(-1);
        e.preventDefault();
    }
    if (e.key == "ArrowDown") {
        navigateLinks(1);
        e.preventDefault();
    }
});

function navigateLinks(direction) {
    const links = Array.from(document.querySelectorAll(".link-item"));

    if (!selected || direction === 0) {
        // Handle the case where no element is initially highlighted
        selected = links[0]; // Select the first link
        selected.classList.add("highlighted");
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
    selected.classList.add("highlighted");

    // Optional: Scroll the selected element into view
    selected.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
    });
}

document.addEventListener("keydown", (e) => {
    if (!searchInput.value) {
        searchInput.focus();
        searchInput.select();
    }
});

// === Clear Local Data ===
clearBtn.addEventListener("click", () => {
    const confirmClear = confirm("Clear all locally saved data?");
    if (!confirmClear) return;
    localStorage.removeItem("linksData");
    data = { groups: [] };
    currentData = JSON.parse(JSON.stringify(data));
    renderGroups(data);
});

/* === Load from localStorage === */
loadFromLocal();

function loadFromLocal() {
    const saved = localStorage.getItem("linksData");
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
            renderGroups(data);
        } catch {
            container.innerHTML =
                "<p style='color:red;'>Invalid JSON structure.</p>";
        }
    };
    reader.readAsText(file);
});

// === Load Chrome bookmarks ===
const loadBookmarksBtn = document.getElementById("loadBookmarksBtn");
const bookmarksFile = document.getElementById("bookmarksFile");

loadBookmarksBtn.addEventListener("click", () => bookmarksFile.click());
bookmarksFile.addEventListener("change", handleBookmarksUpload);

function showBookmarks() {
    container.classList.remove("hidden");
    clock.style.display = "none";
    hero.classList.remove("hero-top");
}

function hideBookmarks() {
    container.classList.add("hidden");
    clock.style.display = "block";
    hero.classList.add("hero-top");
}

function toggleBookmarks() {
    container.classList.contains("hidden") ? showBookmarks() : hideBookmarks();
}

// When page first loads, hide the bookmarks grid
window.addEventListener("DOMContentLoaded", () => {
    hideBookmarks();
});

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
    localStorage.setItem("linksData", JSON.stringify(cleanData));
}

/* === Render Groups === */
function renderGroups(data, { expandAll = false } = {}) {
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
            const visible = isVisible(group);
            const section = document.createElement("section");
            section.classList.add("group");
            section.dataset.depth = group._depth;
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

            if (renderItemActions) {
                const addBtn = document.createElement("button");
                addBtn.classList.add("add-btn");
                addBtn.textContent = "+ Add link";
                addBtn.addEventListener("click", () => openLinkModal(group));
                section.appendChild(addBtn);
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

    if (query.startsWith(" ")) {
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

        filtered = query.startsWith(".")
            ? clean
            : filterDataTree(clean, query.toLowerCase());
    }

    showBookmarks();
    renderGroups(filtered, { expandAll: true });
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
    groupToDelete = { group, parent: parentGroup };

    const name = group.name || "Unnamed Group";
    removeGroupText.textContent = `Are you sure you want to remove the group: "${name}"?`;
    removeGroupModal.classList.add("show");
}

function closeRemoveGroupModal() {
    removeGroupModal.classList.remove("show");
    groupToDelete = null;
}

confirmRemoveGroup.addEventListener("click", () => {
    if (!groupToDelete || !groupToDelete.group) return;

    const { group, parent } = groupToDelete;

    function removeFromArray(arr, target) {
        const idx = arr.indexOf(target);
        if (idx !== -1) arr.splice(idx, 1);
    }

    if (parent) {
        // nested group → remove from its parent’s groups array
        removeFromArray(parent.groups, group);
    } else {
        // root group → remove from top-level
        removeFromArray(data.groups, group);
    }

    saveToLocal();
    renderGroups(data);
    closeRemoveGroupModal();
});

cancelRemoveGroup.addEventListener("click", () => closeRemoveGroupModal());
removeGroupModal.addEventListener("click", (e) => {
    if (e.target === removeGroupModal) closeRemoveGroupModal();
});

/* === Remove Link (Modal) === */
function openRemoveLinkModal(group, linkIndex) {
    linkToDelete = { group, linkIndex };

    const linkName = group.links[linkIndex].title;
    removeLinkText.textContent = `Remove link "${linkName}"?`;
    removeLinkModal.classList.add("show");
}

function closeRemoveLinkModal() {
    removeLinkModal.classList.remove("show");
    linkToDelete = { groupIndex: null, linkIndex: null };
}

confirmRemoveLink.addEventListener("click", () => {
    const { group, linkIndex } = linkToDelete;
    if (!group || linkIndex == null) return;

    group.links.splice(linkIndex, 1);
    saveToLocal();
    renderGroups(data);
    closeRemoveLinkModal();
});

cancelRemoveLink.addEventListener("click", closeRemoveLinkModal);
removeLinkModal.addEventListener("click", (e) => {
    if (e.target === removeLinkModal) closeRemoveLinkModal();
});

/* === Link Modal === */
function openLinkModal(group) {
    currentGroup = group;
    linkModal.classList.add("show");
    linkForm.reset();
}

function closeLinkModal() {
    linkModal.classList.remove("show");
}

linkModal.addEventListener("click", (e) => {
    if (e.target === linkModal) closeLinkModal();
});

cancelLinkModal.addEventListener("click", closeLinkModal);

linkForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("linkTitle").value.trim();
    const url = document.getElementById("linkUrl").value.trim();
    if (!title || !url) return;
    const newLink = { title, url };
    currentGroup.links.push(newLink);
    saveToLocal();
    renderGroups(data);
    closeLinkModal();
});

/* === Group Modal === */
groupModal.addEventListener("click", (e) => {
    if (e.target === groupModal) closeGroupModal();
});
cancelGroupModal.addEventListener("click", closeGroupModal);

function closeGroupModal() {
    groupModal.classList.remove("show");
}

groupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("groupName").value.trim();
    if (!name) return;
    if (!data) {
        data = { groups: [] };
        currentData = JSON.parse(JSON.stringify(data));
    }
    data.groups.push({ name, links: [] });
    saveToLocal();
    renderGroups(data);
    closeGroupModal();
});

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
