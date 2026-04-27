// --- Icon Image Support ---
function setupIconImageInput() {
    const fileInput = byId("app-icon-image");
    const browseBtn = byId("app-icon-image-btn");
    const extractBtn = byId("app-icon-extract-btn");
    const preview = byId("app-icon-image-preview");
    const removeBtn = byId("app-icon-image-remove");
    const dropzone = byId("app-icon-dropzone");
    const iconText = byId("app-icon");

    let imageDataUrl = null;

    function updatePreview() {
        if (imageDataUrl) {
            preview.style.backgroundImage = `url('${imageDataUrl}')`;
            preview.style.display = "inline-block";
            removeBtn.style.display = "inline-block";
            iconText.style.display = "none";
        } else {
            preview.style.backgroundImage = "none";
            preview.style.display = "none";
            removeBtn.style.display = "none";
            iconText.style.display = "inline-block";
        }
    }

    browseBtn.addEventListener("click", () => fileInput.click());

    extractBtn.addEventListener("click", async () => {
        const appPath = byId("app-path").value.trim();
        if (!appPath) {
            showToast("Please select an executable file first.", "warning");
            return;
        }

        if (!appPath.toLowerCase().endsWith(".exe")) {
            showToast("Icon extraction only works for .exe files.", "warning");
            return;
        }

        if (!isDesktop) {
            showToast("Icon extraction is only available in desktop mode.", "warning");
            return;
        }

        extractBtn.disabled = true;
        extractBtn.textContent = "Extracting...";

        try {
            const iconDataUrl = await window.launcherAPI.extractIcon(appPath);
            if (iconDataUrl) {
                imageDataUrl = iconDataUrl;
                updatePreview();
                showToast("Icon extracted successfully!", "success");
            } else {
                showToast("Failed to extract icon from the executable.", "error");
            }
        } catch (error) {
            console.error("Icon extraction error:", error);
            showToast("Error extracting icon: " + error.message, "error");
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = "Extract from EXE";
        }
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                imageDataUrl = ev.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    removeBtn.addEventListener("click", () => {
        imageDataUrl = null;
        fileInput.value = "";
        updatePreview();
    });

    // Drag and drop
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#ff7a1a";
    });
    dropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#aaa";
    });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.style.borderColor = "#aaa";
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                imageDataUrl = ev.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    // Save/Load integration
    return {
        getImageData: () => imageDataUrl,
        setImageData: (dataUrl) => {
            imageDataUrl = dataUrl;
            updatePreview();
        },
        clear: () => {
            imageDataUrl = null;
            updatePreview();
        }
    };
}

let iconImageInput = null;

// --- Context Menu ---
let contextMenuVisible = false;

function showContextMenu(x, y) {
    const menu = byId("context-menu");
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove("hidden");
    menu.setAttribute("aria-hidden", "false");
    contextMenuVisible = true;
}

function hideContextMenu() {
    const menu = byId("context-menu");
    menu.classList.add("hidden");
    menu.setAttribute("aria-hidden", "true");
    contextMenuVisible = false;
}

function isContextMenuTarget(element) {
    return element.closest("#context-menu") !== null;
}

document.addEventListener("DOMContentLoaded", () => {
    iconImageInput = setupIconImageInput();

    // Context menu - right-click on empty areas
    document.addEventListener("contextmenu", (e) => {
        const target = e.target;
        const isAppTile = target.closest(".app-tile");
        const isButton = target.closest("button");
        const isInput = target.closest("input");
        const isModal = target.closest(".modal");
        const isContextMenu = isContextMenuTarget(target);

        if (isAppTile || isButton || isInput || isModal || isContextMenu) {
            return;
        }

        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });

    // Dismiss context menu on click outside
    document.addEventListener("click", (e) => {
        if (contextMenuVisible && !isContextMenuTarget(e.target)) {
            hideContextMenu();
        }
    });

    // Dismiss context menu on ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && contextMenuVisible) {
            hideContextMenu();
        }
    });

    // Context menu - Edit Apps button
    byId("ctx-open-settings").addEventListener("click", async () => {
        hideContextMenu();
        await openSettingsModal();
    });

    // Top bar profile dropdown
    byId("profile-dropdown-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleProfileDropdown();
    });

    // Dismiss profile dropdown on click outside
    document.addEventListener("click", (e) => {
        if (profileDropdownVisible && !e.target.closest(".profile-dropdown-wrapper")) {
            hideProfileDropdown();
        }
    });

    // Dismiss profile dropdown on ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && profileDropdownVisible) {
            hideProfileDropdown();
        }
    });
});
const defaultConfig = {
    title: "Forge",
    subtitle: "",
    persistToTray: false,
    startupOnBoot: false,
    globalHotkey: "",
    settingsPinEnabled: false,
    settingsPinHash: "",
    tileSizePreset: "comfortable",
    tileSizeCustom: {
        minWidth: 190,
        minHeight: 150
    },
    showTileTips: true,
    theme: {
        bg1: "#1a0f08",
        bg2: "#3a2014",
        accent: "#ff7a1a",
        text: "#f7eee3",
        hover: "#ffb167"
    },
    themePresets: [
        {
            id: "obsidian-steelblue",
            name: "Obsidian Steel Blue",
            theme: {
                bg1: "#181c20",
                bg2: "#232a32",
                accent: "#4682b4",
                text: "#f8f8f2",
                hover: "#6fa3d9"
            }
        }
    ],
    apps: [
        {
            name: "Example Web App",
            type: "web",
            icon: "🌐",
            iconImage: null,
            description: "A sample web target",
            url: "https://example.com"
        }
    ],
    profiles: [
        {
            id: "default",
            name: "Default",
            apps: [
                {
                    name: "Example Web App",
                    type: "web",
                    icon: "🌐",
                    iconImage: null,
                    description: "A sample web target",
                    url: "https://example.com"
                }
            ]
        }
    ],
    activeProfileId: "default"
};

const CATEGORY_FILTER_ALL = "__all__";
const CATEGORY_FILTER_UNCATEGORIZED = "__uncategorized__";
const CATEGORY_FILTER_RECENT = "__recent__";
const CATEGORY_FILTER_MOST_USED = "__mostused__";

// Health check state — runtime only, never persisted.
const healthBroken = new Set();
let healthCheckGen = 0;

function isAppBroken(app) {
    return app.type === "local" && healthBroken.has(getTelemetryKey(app));
}

async function runHealthChecks() {
    if (!isDesktop) return;
    const gen = ++healthCheckGen;
    healthBroken.clear();
    const apps = getActiveApps();
    const localApps = apps.filter((a) => a.type === "local" && a.path);
    await Promise.all(localApps.map(async (app) => {
        const result = await window.launcherAPI.validateLocalPath(app.path);
        if (gen !== healthCheckGen) return;
        if (!result?.ok) {
            healthBroken.add(getTelemetryKey(app));
        }
    }));
    if (gen !== healthCheckGen) return;
    renderApps();
}

function getTelemetryKey(app) {
    const base = app.path || app.url || app.id || app.steamId || "";
    return `${app.type || "web"}:${(app.name || "").toLowerCase()}:${base}`;
}

function getAppTelemetry(app) {
    const telemetry = state.config.appTelemetry;
    if (!telemetry) return null;
    return telemetry[getTelemetryKey(app)] || null;
}

function getOrCreateAppTelemetry(app) {
    if (!state.config.appTelemetry) {
        state.config.appTelemetry = {};
    }

    const key = getTelemetryKey(app);
    const existing = state.config.appTelemetry[key] || {};
    const rec = {
        launchCount: existing.launchCount || 0,
        lastLaunched: existing.lastLaunched || null,
        lastError: existing.lastError || "",
        lastFailedAt: existing.lastFailedAt || null
    };

    state.config.appTelemetry[key] = rec;
    return rec;
}

function recordLaunch(app) {
    const rec = getOrCreateAppTelemetry(app);
    rec.launchCount = (rec.launchCount || 0) + 1;
    rec.lastLaunched = new Date().toISOString();
    persistConfig();
}

function recordLaunchFailure(app, errorMessage) {
    const rec = getOrCreateAppTelemetry(app);
    rec.lastError = String(errorMessage || "Unknown launch failure");
    rec.lastFailedAt = new Date().toISOString();
    persistConfig();
}

function clearLaunchFailure(app) {
    const telemetry = getAppTelemetry(app);
    if (!telemetry) {
        return;
    }

    if (telemetry.lastError || telemetry.lastFailedAt) {
        telemetry.lastError = "";
        telemetry.lastFailedAt = null;
        persistConfig();
    }
}

const state = {
    config: structuredClone(defaultConfig),
    editingAppIndex: null,
    searchQuery: "",
    categoryFilter: CATEGORY_FILTER_ALL,
    settingsTab: "general",
    selectedThemePresetId: "",
    pendingImport: null
};

const isDesktop = Boolean(window.launcherAPI);
let pendingSettingsPinResolver = null;
const SETTINGS_PIN_MAX_ATTEMPTS = 5;
const SETTINGS_PIN_LOCKOUT_MS = 30_000;
let settingsPinFailedAttempts = 0;
let settingsPinLockoutUntil = 0;
let settingsPinLockoutTimer = null;
let pendingPromptResolver = null;
let pendingPromptFocusTimer = null;
let promptReturnFocusElement = null;
let commandPaletteSelectionIndex = 0;
let commandPaletteReturnFocusElement = null;
let appHealthRefreshToken = 0;

async function hashPin(pin) {
    const text = String(pin || "").trim();
    const buffer = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifySettingsPin(pin) {
    if (!state.config.settingsPinHash) {
        return false;
    }

    const hash = await hashPin(pin);
    return hash === state.config.settingsPinHash;
}

function getSettingsPinLockoutRemainingMs() {
    return Math.max(0, settingsPinLockoutUntil - Date.now());
}

function isSettingsPinLockedOut() {
    return getSettingsPinLockoutRemainingMs() > 0;
}

function stopSettingsPinLockoutTicker() {
    if (settingsPinLockoutTimer) {
        clearInterval(settingsPinLockoutTimer);
        settingsPinLockoutTimer = null;
    }
}

function updateSettingsPinModalState(errorText = "") {
    const input = byId("settings-pin-input");
    const unlockButton = byId("unlock-settings-pin");
    const error = byId("settings-pin-error");
    if (!input || !unlockButton || !error) {
        return;
    }

    if (isSettingsPinLockedOut()) {
        const seconds = Math.ceil(getSettingsPinLockoutRemainingMs() / 1000);
        input.disabled = true;
        unlockButton.disabled = true;
        error.textContent = `Too many failed attempts. Try again in ${seconds}s.`;
        error.classList.remove("hidden");
        return;
    }

    input.disabled = false;
    unlockButton.disabled = false;

    if (errorText) {
        error.textContent = errorText;
        error.classList.remove("hidden");
    } else {
        error.classList.add("hidden");
    }
}

function startSettingsPinLockoutTicker() {
    stopSettingsPinLockoutTicker();
    updateSettingsPinModalState();

    settingsPinLockoutTimer = setInterval(() => {
        if (!isSettingsPinLockedOut()) {
            stopSettingsPinLockoutTicker();
        }

        updateSettingsPinModalState();
    }, 250);
}

const TILE_SIZE_PRESETS = {
    compact: { minWidth: "132px", minHeight: "108px" },
    comfortable: { minWidth: "170px", minHeight: "136px" },
    large: { minWidth: "228px", minHeight: "170px" }
};

const TILE_SIZE_LIMITS = {
    minWidth: { min: 120, max: 280 },
    minHeight: { min: 100, max: 220 }
};

function normalizeTileSizePreset(value) {
    const preset = String(value || "").toLowerCase();
    return TILE_SIZE_PRESETS[preset] || preset === "custom" ? preset : "comfortable";
}

function clampNumber(value, min, max, fallback) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return fallback;
    }

    return Math.min(Math.max(Math.round(num), min), max);
}

function normalizeTileSizeCustom(value) {
    const source = value || {};
    return {
        minWidth: clampNumber(
            source.minWidth,
            TILE_SIZE_LIMITS.minWidth.min,
            TILE_SIZE_LIMITS.minWidth.max,
            defaultConfig.tileSizeCustom.minWidth
        ),
        minHeight: clampNumber(
            source.minHeight,
            TILE_SIZE_LIMITS.minHeight.min,
            TILE_SIZE_LIMITS.minHeight.max,
            defaultConfig.tileSizeCustom.minHeight
        )
    };
}

function syncCustomTileSizeUI() {
    const panel = byId("tile-size-custom-controls");
    const widthInput = byId("cfg-tile-min-width");
    const heightInput = byId("cfg-tile-min-height");
    const widthValue = byId("cfg-tile-min-width-value");
    const heightValue = byId("cfg-tile-min-height-value");

    const custom = normalizeTileSizeCustom(state.config.tileSizeCustom);
    state.config.tileSizeCustom = custom;

    if (widthInput) {
        widthInput.value = String(custom.minWidth);
    }
    if (heightInput) {
        heightInput.value = String(custom.minHeight);
    }
    if (widthValue) {
        widthValue.textContent = `${custom.minWidth}px`;
    }
    if (heightValue) {
        heightValue.textContent = `${custom.minHeight}px`;
    }

    if (panel) {
        panel.classList.toggle("hidden", normalizeTileSizePreset(state.config.tileSizePreset) !== "custom");
    }
}

function applyTileSizePreset(value) {
    const preset = normalizeTileSizePreset(value);
    const custom = normalizeTileSizeCustom(state.config.tileSizeCustom);
    const size = preset === "custom"
        ? { minWidth: `${custom.minWidth}px`, minHeight: `${custom.minHeight}px` }
        : TILE_SIZE_PRESETS[preset];
    const root = document.documentElement;
    root.style.setProperty("--tile-min", size.minWidth);
    root.style.setProperty("--tile-min-height", size.minHeight);
    state.config.tileSizePreset = preset;
    state.config.tileSizeCustom = custom;
    syncCustomTileSizeUI();
}

function normalizeHotkeyInput(raw) {
    const parts = String(raw || "")
        .split("+")
        .map((part) => part.trim())
        .filter(Boolean);

    if (!parts.length) {
        return "";
    }

    const normalized = parts.map((part) => {
        const lower = part.toLowerCase();

        if (lower === "ctrl" || lower === "control" || lower === "cmdorctrl") {
            return "CommandOrControl";
        }

        if (lower === "alt" || lower === "option") {
            return "Alt";
        }

        if (lower === "shift") {
            return "Shift";
        }

        if (lower === "meta" || lower === "win" || lower === "super" || lower === "command") {
            return "Super";
        }

        if (lower === "space" || lower === "spacebar") {
            return "Space";
        }

        if (/^f\d{1,2}$/i.test(part)) {
            return part.toUpperCase();
        }

        if (part.length === 1) {
            return part.toUpperCase();
        }

        return part;
    });

    const unique = [];
    normalized.forEach((part) => {
        if (!unique.includes(part)) {
            unique.push(part);
        }
    });

    const modifiers = ["CommandOrControl", "Alt", "Shift", "Super"];
    const orderedModifiers = modifiers.filter((key) => unique.includes(key));
    const primary = unique.find((part) => !modifiers.includes(part));

    if (!primary) {
        return "";
    }

    return [...orderedModifiers, primary].join("+");
}

function acceleratorFromKeyEvent(event) {
    const isModifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(event.key);
    if (isModifierOnly) {
        return "";
    }

    let primary = "";
    if (event.key === " ") {
        primary = "Space";
    } else if (/^F\d{1,2}$/.test(event.key)) {
        primary = event.key.toUpperCase();
    } else if (event.key.length === 1) {
        primary = event.key.toUpperCase();
    } else {
        const keyMap = {
            Enter: "Enter",
            Escape: "Esc",
            Tab: "Tab",
            Backspace: "Backspace",
            Delete: "Delete",
            Insert: "Insert",
            Home: "Home",
            End: "End",
            PageUp: "PageUp",
            PageDown: "PageDown",
            ArrowUp: "Up",
            ArrowDown: "Down",
            ArrowLeft: "Left",
            ArrowRight: "Right"
        };
        primary = keyMap[event.key] || "";
    }

    if (!primary) {
        return "";
    }

    const parts = [];
    if (event.ctrlKey || event.metaKey) {
        parts.push("CommandOrControl");
    }
    if (event.altKey) {
        parts.push("Alt");
    }
    if (event.shiftKey) {
        parts.push("Shift");
    }

    // Keep accidental single-key global shortcuts from being registered.
    if (!parts.length) {
        return "";
    }

    parts.push(primary);
    return parts.join("+");
}

function createProfileId() {
    return `profile-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalizeThemePresets(rawPresets) {
    if (!Array.isArray(rawPresets)) {
        return [];
    }

    const seenIds = new Set();
    const output = [];

    rawPresets.forEach((preset, index) => {
        if (output.length >= 3) {
            return;
        }

        const idBase = preset?.id ? String(preset.id) : `theme-preset-${index + 1}`;
        const id = seenIds.has(idBase) ? `${idBase}-${index + 1}` : idBase;
        seenIds.add(id);

        const legacyTheme = {
            bg1: preset?.bg1,
            bg2: preset?.bg2,
            accent: preset?.accent,
            text: preset?.text,
            hover: preset?.hover
        };
        const sourceTheme = (preset?.theme && typeof preset.theme === "object")
            ? preset.theme
            : legacyTheme;

        output.push({
            id,
            name: preset?.name ? String(preset.name) : `Theme ${index + 1}`,
            theme: {
                ...defaultConfig.theme,
                ...(sourceTheme || {})
            }
        });
    });

    return output;
}

function normalizeConfigObject(config) {
    const fallbackApps = Array.isArray(config.apps) ? config.apps : [];
    let profiles = Array.isArray(config.profiles) ? config.profiles : [];

    if (!profiles.length) {
        profiles = [{ id: "default", name: "Default", apps: fallbackApps }];
    }

    profiles = profiles.map((profile, index) => ({
        id: profile?.id ? String(profile.id) : createProfileId(),
        name: profile?.name ? String(profile.name) : `Profile ${index + 1}`,
        apps: Array.isArray(profile?.apps) ? profile.apps : []
    }));

    let activeProfileId = config.activeProfileId;
    if (!profiles.some((profile) => profile.id === activeProfileId)) {
        activeProfileId = profiles[0].id;
    }

    const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0];

    return {
        ...config,
        profiles,
        activeProfileId,
        apps: [...activeProfile.apps],
        tileSizePreset: normalizeTileSizePreset(config.tileSizePreset),
        tileSizeCustom: normalizeTileSizeCustom(config.tileSizeCustom),
        themePresets: normalizeThemePresets(config.themePresets)
    };
}

function normalizeConfig() {
    state.config = normalizeConfigObject(state.config);
}

function getActiveProfile() {
    return state.config.profiles.find((profile) => profile.id === state.config.activeProfileId) || state.config.profiles[0];
}

function getActiveApps() {
    return getActiveProfile().apps;
}

function syncAppsMirror() {
    state.config.apps = [...getActiveApps()];
}

async function persistConfig() {
    syncAppsMirror();
    if (isDesktop) {
        await window.launcherAPI.saveConfig(JSON.stringify(state.config));
        return;
    }

    localStorage.setItem("forge-launcher-settings", JSON.stringify(state.config));
}

function byId(id) {
    return document.getElementById(id);
}

function showImportPreviewModal(visible) {
    const modal = byId("import-preview-modal");
    modal.classList.toggle("hidden", !visible);
    modal.setAttribute("aria-hidden", String(!visible));
}

function showSettingsPinModal(visible) {
    const modal = byId("settings-pin-modal");
    modal.classList.toggle("hidden", !visible);
    modal.setAttribute("aria-hidden", String(!visible));
}

function showModal(visible) {
    const modal = byId("settings-modal");
    modal.classList.toggle("hidden", !visible);
    modal.setAttribute("aria-hidden", String(!visible));
    document.body.classList.toggle("settings-open", visible);
}

function setSettingsTab(tabKey) {
    const tabsRoot = byId("settings-tabs");
    const panelsRoot = byId("settings-panels");
    if (!tabsRoot || !panelsRoot) {
        return;
    }

    const buttons = Array.from(tabsRoot.querySelectorAll(".settings-tab-btn[data-settings-tab]"));
    const panels = Array.from(panelsRoot.querySelectorAll(".settings-panel[data-settings-panel]"));
    const validKeys = new Set(buttons.map((button) => button.getAttribute("data-settings-tab")));
    const next = validKeys.has(tabKey) ? tabKey : "general";
    state.settingsTab = next;

    buttons.forEach((button) => {
        const key = button.getAttribute("data-settings-tab");
        const active = key === next;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = 0;
    });

    panels.forEach((panel) => {
        const key = panel.getAttribute("data-settings-panel");
        const active = key === next;
        panel.classList.toggle("hidden", !active);
    });

    if (next === "data") {
        loadConfigBackupList();
    }
}

function getSettingsTabButtons() {
    const tabsRoot = byId("settings-tabs");
    if (!tabsRoot) {
        return [];
    }
    return Array.from(tabsRoot.querySelectorAll(".settings-tab-btn[data-settings-tab]"));
}

function focusAndActivateSettingsTabByIndex(index) {
    const buttons = getSettingsTabButtons();
    if (!buttons.length) {
        return;
    }

    const nextIndex = Math.min(Math.max(index, 0), buttons.length - 1);
    const button = buttons[nextIndex];
    const tabKey = button.getAttribute("data-settings-tab") || "general";
    setSettingsTab(tabKey);
    button.focus();
}

function focusSettingsTab(tabKey) {
    const buttons = getSettingsTabButtons();
    if (!buttons.length) {
        return;
    }

    const key = tabKey || state.settingsTab || "general";
    const match = buttons.find((button) => button.getAttribute("data-settings-tab") === key) || buttons[0];
    match.focus();
}

function getFocusableElements(root) {
    if (!root) {
        return [];
    }

    const candidates = Array.from(root.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    ));

    return candidates.filter((el) => {
        if (!(el instanceof HTMLElement)) {
            return false;
        }
        if (el.hasAttribute("disabled") || el.getAttribute("aria-hidden") === "true") {
            return false;
        }
        return el.offsetParent !== null;
    });
}

function getCategoryFilterButtons() {
    const rail = byId("category-rail");
    if (!rail) {
        return [];
    }

    return Array.from(rail.querySelectorAll("button[data-category-filter]"));
}

function focusCategoryFilterByKey(key) {
    const buttons = getCategoryFilterButtons();
    const match = buttons.find((button) => button.getAttribute("data-category-filter") === key);
    match?.focus();
}

function showHelpModal(visible) {
    const modal = byId("help-modal");
    modal.classList.toggle("hidden", !visible);
    modal.setAttribute("aria-hidden", String(!visible));
}

function showToast(message, kind = "info", durationMs = 2800) {
    const region = byId("toast-region");
    if (!region) {
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${kind}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;
    region.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, durationMs);
}

function showCommandPaletteModal(visible) {
    const modal = byId("command-palette-modal");
    modal.classList.toggle("hidden", !visible);
    modal.setAttribute("aria-hidden", String(!visible));
}

function isCommandPaletteOpen() {
    return !byId("command-palette-modal").classList.contains("hidden");
}

async function openSettingsModal() {
    const unlocked = await requestSettingsUnlock();
    if (!unlocked) {
        return false;
    }

    syncSettingsForm();
    setSettingsTab(state.settingsTab || "general");
    showModal(true);
    setTimeout(() => focusSettingsTab(state.settingsTab), 0);
    return true;
}

async function togglePersistToTray() {
    state.config.persistToTray = !state.config.persistToTray;
    if (isDesktop) {
        await window.launcherAPI.setCloseToTray(state.config.persistToTray);
    }
    await persistConfig();
    showToast(`Persist to tray ${state.config.persistToTray ? "enabled" : "disabled"}.`, "success");
}

function getCommandPaletteCommands() {
    const commands = [
        {
            kind: "command",
            icon: "⚙️",
            title: "Open Settings",
            meta: "Command",
            searchText: "open settings preferences config",
            run: async () => {
                await openSettingsModal();
            }
        },
        {
            kind: "command",
            icon: "❓",
            title: "Open Help",
            meta: "Command",
            searchText: "open help tips",
            run: () => {
                showHelpModal(true);
            }
        },
        {
            kind: "command",
            icon: "➕",
            title: "New App",
            meta: "Command",
            searchText: "new app create add",
            run: async () => {
                const opened = await openSettingsModal();
                if (!opened) {
                    return;
                }
                setSettingsTab("profiles");
                clearAppEditor();
                focusAppEditorNameField();
            }
        },
        {
            kind: "command",
            icon: "💾",
            title: "Export Config",
            meta: "Command",
            searchText: "export config backup",
            run: exportConfig
        },
        {
            kind: "command",
            icon: "📥",
            title: "Import Config",
            meta: "Command",
            searchText: "import config restore merge replace",
            run: importConfig
        },
        {
            kind: "command",
            icon: state.config.persistToTray ? "🟢" : "⚪",
            title: state.config.persistToTray ? "Disable Persist To Tray" : "Enable Persist To Tray",
            meta: "Command",
            searchText: "tray persist close behavior toggle",
            run: togglePersistToTray
        }
    ];

    state.config.profiles.forEach((profile) => {
        commands.push({
            kind: "command",
            icon: profile.id === state.config.activeProfileId ? "✅" : "👤",
            title: `Switch Profile: ${profile.name}`,
            meta: "Command",
            searchText: `switch profile ${profile.name}`,
            run: async () => {
                await switchProfile(profile.id);
            }
        });
    });

    return commands;
}

function getCommandPaletteResults() {
    const query = byId("command-palette-input").value.trim().toLowerCase();
    const appResults = getActiveApps().map((app, idx) => {
        const type = app.type || "web";
        const category = app.category && app.category.trim() ? app.category.trim() : "Uncategorized";
        return {
            kind: "app",
            app,
            appIndex: idx,
            icon: app.icon || "📦",
            title: app.name || "Untitled",
            meta: `${type} • ${category}`,
            searchText: [
                app.name,
                app.description,
                app.category,
                app.type,
                app.url,
                app.path,
                app.id,
                app.steamId
            ].filter(Boolean).join(" ").toLowerCase()
        };
    });

    const all = [...getCommandPaletteCommands(), ...appResults];
    if (!query) {
        return all;
    }

    return all.filter((entry) => {
        const haystack = `${entry.title} ${entry.meta || ""} ${entry.searchText || ""}`.toLowerCase();
        return haystack.includes(query);
    });
}

function renderCommandPaletteResults() {
    const list = byId("command-palette-results");
    const results = getCommandPaletteResults();
    if (!results.length) {
        commandPaletteSelectionIndex = -1;
        list.innerHTML = "<li class=\"command-palette-empty\">No apps match your query.</li>";
        return;
    }

    if (commandPaletteSelectionIndex < 0 || commandPaletteSelectionIndex >= results.length) {
        commandPaletteSelectionIndex = 0;
    }

    list.innerHTML = "";
    results.forEach((result, displayIndex) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = `command-palette-item ${displayIndex === commandPaletteSelectionIndex ? "active" : ""}`;
        button.setAttribute("data-index", String(displayIndex));

        const icon = result.icon || "📦";
        const name = result.title || "Untitled";
        const meta = result.meta || "";

        const iconEl = document.createElement("span");
        iconEl.className = "icon";
        iconEl.textContent = icon;

        const mainEl = document.createElement("span");
        mainEl.className = "command-palette-main";

        const titleEl = document.createElement("span");
        titleEl.className = "command-palette-title";
        titleEl.textContent = name;

        const metaEl = document.createElement("span");
        metaEl.className = "command-palette-meta";
        metaEl.textContent = meta;

        mainEl.appendChild(titleEl);
        mainEl.appendChild(metaEl);
        button.appendChild(iconEl);
        button.appendChild(mainEl);

        button.addEventListener("mousemove", () => {
            if (commandPaletteSelectionIndex !== displayIndex) {
                commandPaletteSelectionIndex = displayIndex;
                renderCommandPaletteResults();
            }
        });

        button.addEventListener("click", () => {
            executeCommandPaletteResult(result);
        });

        item.appendChild(button);
        list.appendChild(item);
    });
}

async function executeCommandPaletteResult(result) {
    if (!result) {
        return;
    }

    closeCommandPalette({ restoreFocus: false });

    if (result.kind === "app") {
        launchApp(result.app);
        return;
    }

    if (result.kind === "command" && typeof result.run === "function") {
        await result.run();
    }
}

function moveCommandPaletteSelection(offset) {
    const results = getCommandPaletteResults();
    if (!results.length) {
        commandPaletteSelectionIndex = -1;
        renderCommandPaletteResults();
        return;
    }

    const current = commandPaletteSelectionIndex < 0 ? 0 : commandPaletteSelectionIndex;
    commandPaletteSelectionIndex = (current + offset + results.length) % results.length;
    renderCommandPaletteResults();

    const activeButton = byId("command-palette-results").querySelector(".command-palette-item.active");
    activeButton?.scrollIntoView({ block: "nearest" });
}

function launchCommandPaletteSelection() {
    const results = getCommandPaletteResults();
    if (!results.length || commandPaletteSelectionIndex < 0) {
        return;
    }

    const selected = results[commandPaletteSelectionIndex];
    if (!selected) {
        return;
    }

    executeCommandPaletteResult(selected);
}

function openCommandPalette() {
    if (isCommandPaletteOpen()) {
        return;
    }

    commandPaletteReturnFocusElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    commandPaletteSelectionIndex = 0;
    showCommandPaletteModal(true);
    byId("command-palette-input").value = "";
    renderCommandPaletteResults();

    setTimeout(() => {
        byId("command-palette-input").focus();
    }, 0);
}

function closeCommandPalette(options = {}) {
    if (!isCommandPaletteOpen()) {
        return;
    }

    const restoreFocus = options.restoreFocus !== false;

    showCommandPaletteModal(false);
    byId("command-palette-input").value = "";
    byId("command-palette-results").innerHTML = "";
    commandPaletteSelectionIndex = 0;

    const focusTarget = commandPaletteReturnFocusElement;
    commandPaletteReturnFocusElement = null;
    if (restoreFocus && focusTarget instanceof HTMLElement && focusTarget.isConnected) {
        setTimeout(() => focusTarget.focus(), 0);
    }
}

function handleGlobalKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isCommandPaletteOpen()) {
            closeCommandPalette();
        } else {
            openCommandPalette();
        }
    }
}

function buildImportedConfig(source) {
    return normalizeConfigObject({
        ...structuredClone(defaultConfig),
        ...source,
        theme: {
            ...defaultConfig.theme,
            ...(source.theme || {})
        },
        apps: Array.isArray(source.apps) ? source.apps : [],
        profiles: Array.isArray(source.profiles) ? source.profiles : [],
        activeProfileId: source.activeProfileId || "",
        tileSizePreset: normalizeTileSizePreset(source.tileSizePreset || defaultConfig.tileSizePreset),
        tileSizeCustom: normalizeTileSizeCustom(source.tileSizeCustom || defaultConfig.tileSizeCustom)
    });
}

function appMergeKey(app) {
    return JSON.stringify({
        name: (app.name || "").trim().toLowerCase(),
        type: app.type || "",
        url: app.url || "",
        path: app.path || "",
        id: app.id || app.steamId || "",
        category: (app.category || "").trim().toLowerCase()
    });
}

function mergeAppLists(existingApps, importedApps) {
    const merged = [...existingApps];
    const seen = new Set(existingApps.map((app) => appMergeKey(app)));
    let added = 0;
    let skipped = 0;

    importedApps.forEach((app) => {
        const key = appMergeKey(app);
        if (seen.has(key)) {
            skipped += 1;
            return;
        }

        seen.add(key);
        merged.push(app);
        added += 1;
    });

    return { apps: merged, added, skipped };
}

function mergeImportedConfig(currentConfig, importedConfig) {
    const merged = normalizeConfigObject(structuredClone(currentConfig));
    const existingProfilesByName = new Map(
        merged.profiles.map((profile) => [profile.name.trim().toLowerCase(), profile])
    );

    let profilesAdded = 0;
    let profilesMerged = 0;
    let appsAdded = 0;
    let duplicatesSkipped = 0;
    const profileDetails = [];

    importedConfig.profiles.forEach((importedProfile) => {
        const profileName = importedProfile.name.trim().toLowerCase();
        const existingProfile = existingProfilesByName.get(profileName);

        if (!existingProfile) {
            const newProfile = {
                id: merged.profiles.some((profile) => profile.id === importedProfile.id)
                    ? createProfileId()
                    : importedProfile.id,
                name: importedProfile.name,
                apps: [...importedProfile.apps]
            };

            merged.profiles.push(newProfile);
            existingProfilesByName.set(profileName, newProfile);
            profilesAdded += 1;
            appsAdded += importedProfile.apps.length;
            profileDetails.push({
                name: importedProfile.name,
                mode: "add",
                appsAdded: importedProfile.apps.length,
                duplicatesSkipped: 0
            });
            return;
        }

        const result = mergeAppLists(existingProfile.apps, importedProfile.apps);
        existingProfile.apps = result.apps;
        profilesMerged += 1;
        appsAdded += result.added;
        duplicatesSkipped += result.skipped;
        profileDetails.push({
            name: importedProfile.name,
            mode: "merge",
            appsAdded: result.added,
            duplicatesSkipped: result.skipped
        });
    });

    return {
        config: normalizeConfigObject(merged),
        summary: { profilesAdded, profilesMerged, appsAdded, duplicatesSkipped, profileDetails }
    };
}

function renderImportPreview() {
    const pending = state.pendingImport;
    if (!pending) {
        return;
    }

    const importedProfiles = pending.config.profiles;
    const importedAppCount = importedProfiles.reduce((sum, profile) => sum + profile.apps.length, 0);
    const currentAppCount = state.config.profiles.reduce((sum, profile) => sum + profile.apps.length, 0);

    byId("import-preview-summary").textContent =
        `Current: ${state.config.profiles.length} profiles / ${currentAppCount} apps. ` +
        `Import: ${importedProfiles.length} profiles / ${importedAppCount} apps.`;

    const mergePreview = mergeImportedConfig(state.config, pending.config).summary;
    byId("import-preview-merge-breakdown").textContent =
        `Merge preview: +${mergePreview.profilesAdded} new profile(s), ` +
        `${mergePreview.profilesMerged} matching profile(s), ` +
        `+${mergePreview.appsAdded} app(s), ` +
        `${mergePreview.duplicatesSkipped} duplicate app(s) skipped.`;

    const profileDetailMap = new Map(
        mergePreview.profileDetails.map((detail) => [detail.name.trim().toLowerCase(), detail])
    );

    const list = byId("import-preview-profiles");
    list.innerHTML = "";
    importedProfiles.forEach((profile) => {
        const detail = profileDetailMap.get(profile.name.trim().toLowerCase());
        const item = document.createElement("li");
        if (detail?.mode === "add") {
            item.className = "import-preview-item import-preview-item-add";
            item.textContent = `${profile.name}: add profile (+${detail.appsAdded} app${detail.appsAdded === 1 ? "" : "s"})`;
        } else {
            item.className = "import-preview-item import-preview-item-merge";
            item.textContent =
                `${profile.name}: merge (+${detail?.appsAdded || 0} app${(detail?.appsAdded || 0) === 1 ? "" : "s"}, ` +
                `${detail?.duplicatesSkipped || 0} duplicate${(detail?.duplicatesSkipped || 0) === 1 ? "" : "s"} skipped)`;
        }
        list.appendChild(item);
    });
}

function closeImportPreview() {
    state.pendingImport = null;
    showImportPreviewModal(false);
}

async function commitConfig(config) {
    state.config = normalizeConfigObject(config);

    if (isDesktop) {
        await window.launcherAPI.setStartupOnBoot(state.config.startupOnBoot === true);
        const hotkeyResult = await window.launcherAPI.setGlobalHotkey(state.config.globalHotkey || "");
        if (!hotkeyResult.ok) {
            state.config.globalHotkey = "";
            showToast(`Hotkey was not applied: ${hotkeyResult.error}`, "warning", 4200);
        }
        await persistConfig();
        await window.launcherAPI.setCloseToTray(state.config.persistToTray === true);
    } else {
        await persistConfig();
    }

    syncHeader();
    applyTheme(state.config.theme);
    applyTileSizePreset(state.config.tileSizePreset);
    syncSettingsForm();
    renderApps();
    applyTileTipsVisibility();
}

async function requestSettingsUnlock() {
    if (state.config.settingsPinEnabled !== true || !state.config.settingsPinHash) {
        return true;
    }

    const input = byId("settings-pin-input");
    input.value = "";
    updateSettingsPinModalState();
    showSettingsPinModal(true);

    if (isSettingsPinLockedOut()) {
        startSettingsPinLockoutTicker();
    }

    return new Promise((resolve) => {
        pendingSettingsPinResolver = resolve;
        if (!isSettingsPinLockedOut()) {
            setTimeout(() => input.focus(), 0);
        }
    });
}

async function tryUnlockSettings() {
    const input = byId("settings-pin-input");
    if (isSettingsPinLockedOut()) {
        updateSettingsPinModalState();
        return;
    }

    const ok = await verifySettingsPin(input.value);
    if (!ok) {
        settingsPinFailedAttempts += 1;
        const attemptsLeft = SETTINGS_PIN_MAX_ATTEMPTS - settingsPinFailedAttempts;

        if (attemptsLeft <= 0) {
            settingsPinFailedAttempts = 0;
            settingsPinLockoutUntil = Date.now() + SETTINGS_PIN_LOCKOUT_MS;
            startSettingsPinLockoutTicker();
            return;
        }

        updateSettingsPinModalState(
            `Incorrect PIN. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`
        );
        input.select();
        return;
    }

    settingsPinFailedAttempts = 0;
    settingsPinLockoutUntil = 0;
    stopSettingsPinLockoutTicker();
    updateSettingsPinModalState();

    showSettingsPinModal(false);
    if (pendingSettingsPinResolver) {
        const resolve = pendingSettingsPinResolver;
        pendingSettingsPinResolver = null;
        resolve(true);
    }
}

function cancelUnlockSettings() {
    stopSettingsPinLockoutTicker();
    showSettingsPinModal(false);
    if (pendingSettingsPinResolver) {
        const resolve = pendingSettingsPinResolver;
        pendingSettingsPinResolver = null;
        resolve(false);
    }
}

function showPrompt(label, defaultValue = "") {
    return new Promise((resolve) => {
        pendingPromptResolver = resolve;
        promptReturnFocusElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        byId("mini-prompt-label").textContent = label;
        const input = byId("mini-prompt-input");
        input.value = defaultValue;
        byId("mini-prompt-modal").classList.remove("hidden");
        byId("mini-prompt-modal").setAttribute("aria-hidden", "false");

        if (pendingPromptFocusTimer) {
            clearTimeout(pendingPromptFocusTimer);
        }

        pendingPromptFocusTimer = setTimeout(() => {
            input.focus();
            input.select();
            pendingPromptFocusTimer = null;
        }, 0);
    });
}

function commitPrompt() {
    const value = byId("mini-prompt-input").value.trim();
    closePrompt(value || null);
}

function closePrompt(value) {
    if (pendingPromptFocusTimer) {
        clearTimeout(pendingPromptFocusTimer);
        pendingPromptFocusTimer = null;
    }

    byId("mini-prompt-input").blur();
    byId("mini-prompt-modal").classList.add("hidden");
    byId("mini-prompt-modal").setAttribute("aria-hidden", "true");

    if (pendingPromptResolver) {
        const resolve = pendingPromptResolver;
        pendingPromptResolver = null;
        resolve(value);
    }

    const restoreTarget = promptReturnFocusElement;
    promptReturnFocusElement = null;
    if (restoreTarget instanceof HTMLElement && restoreTarget.isConnected) {
        setTimeout(() => restoreTarget.focus(), 0);
    }
}

function syncQuickTipsVisibility() {
    const tipsDismissed = localStorage.getItem("forge-launcher-tips-dismissed") === "1";
    byId("quick-tips").classList.toggle("hidden", tipsDismissed);
}

function dismissQuickTips() {
    localStorage.setItem("forge-launcher-tips-dismissed", "1");
    syncQuickTipsVisibility();
}

const tileTipSessionKey = "forge-launcher-tile-tip-seen";

function applyTileTipsVisibility() {
    const showTips = state.config.showTileTips !== false;
    const seenThisSession = sessionStorage.getItem(tileTipSessionKey) === "1";
    document.body.classList.toggle("tile-tips-enabled", showTips && !seenThisSession);
}

function markTileTipSeen() {
    if (state.config.showTileTips === false) {
        return;
    }

    if (sessionStorage.getItem(tileTipSessionKey) === "1") {
        return;
    }

    sessionStorage.setItem(tileTipSessionKey, "1");
    applyTileTipsVisibility();
}

function applyTheme(theme) {
    const root = document.documentElement;
    const safeTheme = {
        ...defaultConfig.theme,
        ...(theme || {})
    };

    root.style.setProperty("--bg-1", safeTheme.bg1);
    root.style.setProperty("--bg-2", safeTheme.bg2);
    root.style.setProperty("--accent", safeTheme.accent);
    root.style.setProperty("--accent-2", safeTheme.accent);
    root.style.setProperty("--hover-glow", safeTheme.hover);
    root.style.setProperty("--tile-glow", `${safeTheme.hover}5c`);
    root.style.setProperty("--text", safeTheme.text);
    root.style.setProperty("--line", `${safeTheme.text}33`);
    root.style.setProperty("--surface-header", `${safeTheme.bg2}dd`);
    root.style.setProperty("--surface-panel", `${safeTheme.bg2}f2`);
    root.style.setProperty("--surface-panel-strong", `${safeTheme.bg2}f5`);

    // Keep secondary text readable against custom themes.
    root.style.setProperty("--text-soft", `${safeTheme.text}cc`);
}

function syncHeader() {
    byId("launcher-title").textContent = state.config.title || defaultConfig.title;
    byId("launcher-subtitle").textContent = state.config.subtitle || defaultConfig.subtitle;
}

function setTypeFields(type) {
    byId("field-web").classList.toggle("hidden", type !== "web");
    byId("field-local").classList.toggle("hidden", type !== "local");
    byId("field-local-args").classList.toggle("hidden", type !== "local");
    byId("field-steam").classList.toggle("hidden", type !== "steam");
}

function refreshCategoryList() {
    const datalist = byId("category-list");
    datalist.innerHTML = "";
    const seen = new Set();
    
    // Collect categories from all profiles
    state.config.profiles.forEach((profile) => {
        profile.apps.forEach((app) => {
            const cat = app.category && app.category.trim();
            if (cat && !seen.has(cat)) {
                seen.add(cat);
                const option = document.createElement("option");
                option.value = cat;
                datalist.appendChild(option);
            }
        });
    });
}

function clearAppEditor() {
    refreshCategoryList();
    state.editingAppIndex = null;
    byId("app-name").value = "";
    byId("app-type").value = "web";
    byId("app-icon").value = "🚀";
    byId("app-description").value = "";
    byId("app-category").value = "";
    byId("app-url").value = "";
    byId("app-path").value = "";
    byId("app-args").value = "";
    byId("app-id").value = "";
    byId("app-select").value = "";
    setTypeFields("web");
    if (iconImageInput) iconImageInput.clear();
    syncAppSelectionActions();
    refreshAppHealthPanel();
}

function focusAppEditorField(fieldId) {
    const input = byId(fieldId);
    setTimeout(() => {
        input.focus();
        input.select();
    }, 0);
}

function focusAppEditorNameField() {
    focusAppEditorField("app-name");
}

function showAppEditorError(message, fieldId, type) {
    const error = byId("app-editor-error");
    error.textContent = message;
    error.classList.remove("hidden");
    if (type) {
        setTypeFields(type);
    }
    if (fieldId) {
        focusAppEditorField(fieldId);
    }
}

function clearAppEditorError() {
    const error = byId("app-editor-error");
    error.textContent = "";
    error.classList.add("hidden");
}

function setHealthValue(id, text, tone = "muted") {
    const el = byId(id);
    if (!el) {
        return;
    }

    el.textContent = text;
    el.classList.remove("health-value--ok", "health-value--warn", "health-value--error", "health-value--muted");
    el.classList.add(`health-value--${tone}`);
}

function formatHealthDate(isoString) {
    if (!isoString) {
        return "Never";
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return "Never";
    }

    return date.toLocaleString();
}

async function refreshAppHealthPanel() {
    const panel = byId("app-health-panel");
    if (!panel) {
        return;
    }

    const app = state.editingAppIndex === null ? null : getActiveApps()[state.editingAppIndex];
    if (!app) {
        panel.classList.add("hidden");
        panel.setAttribute("aria-hidden", "true");
        return;
    }

    panel.classList.remove("hidden");
    panel.setAttribute("aria-hidden", "false");

    const telemetry = getAppTelemetry(app);
    const clearErrorBtn = byId("clear-app-health-error");
    const launchCount = telemetry?.launchCount || 0;
    const typeLabel = app.type === "local" ? "Local" : app.type === "steam" ? "Steam" : "Web";
    setHealthValue("app-health-type", typeLabel, "muted");
    setHealthValue("app-health-count", `${launchCount}`, launchCount > 0 ? "ok" : "muted");
    setHealthValue("app-health-last-launch", formatHealthDate(telemetry?.lastLaunched), telemetry?.lastLaunched ? "ok" : "muted");

    if (telemetry?.lastError) {
        const failedAt = telemetry.lastFailedAt ? ` (${formatHealthDate(telemetry.lastFailedAt)})` : "";
        setHealthValue("app-health-last-error", `${telemetry.lastError}${failedAt}`, "error");
        clearErrorBtn?.toggleAttribute("disabled", false);
    } else {
        setHealthValue("app-health-last-error", "None", "ok");
        clearErrorBtn?.toggleAttribute("disabled", true);
    }

    if (app.type !== "local") {
        setHealthValue("app-health-path", "Not applicable (non-local app)", "muted");
        return;
    }

    if (!app.path) {
        setHealthValue("app-health-path", "No local path set", "warn");
        return;
    }

    if (!isDesktop) {
        setHealthValue("app-health-path", "Path validation available in desktop mode only", "muted");
        return;
    }

    const token = ++appHealthRefreshToken;
    setHealthValue("app-health-path", "Checking local path...", "muted");
    const result = await window.launcherAPI.validateLocalPath(app.path);
    if (token !== appHealthRefreshToken) {
        return;
    }

    if (result?.ok) {
        setHealthValue("app-health-path", `Valid (${result.kind})`, "ok");
    } else {
        setHealthValue("app-health-path", result?.error || "Path is invalid", "error");
    }
}

function loadAppIntoEditor(index) {
    refreshCategoryList();
    const app = getActiveApps()[index];
    if (!app) {
        clearAppEditor();
        return;
    }

    state.editingAppIndex = index;
    byId("app-select").value = String(index);
    byId("app-name").value = app.name || "";
    byId("app-type").value = app.type || "web";
    byId("app-icon").value = app.icon || "🚀";
    byId("app-description").value = app.description || "";
    byId("app-category").value = app.category || "";
    byId("app-url").value = app.url || "";
    byId("app-path").value = app.path || "";
    byId("app-args").value = app.args || "";
    byId("app-id").value = app.id || app.steamId || "";
    setTypeFields(app.type || "web");
    setSettingsTab("profiles");
    if (iconImageInput) iconImageInput.setImageData(app.iconImage || null);

    if (isDesktop && isAppBroken(app)) {
        showAppEditorError("⚠️ Path not found on disk — click Browse to update it, then save.", "app-path", "local");
    }

    syncAppSelectionActions();
    refreshAppHealthPanel();
}
// --- Patch app save logic to include iconImage ---
function getAppEditorData() {
    return {
        name: byId("app-name").value.trim(),
        type: byId("app-type").value,
        icon: byId("app-icon").value.trim(),
        iconImage: iconImageInput ? iconImageInput.getImageData() : null,
        description: byId("app-description").value.trim(),
        category: byId("app-category").value.trim(),
        url: byId("app-url").value.trim(),
        path: byId("app-path").value.trim(),
        args: byId("app-args").value.trim(),
        id: byId("app-id").value.trim()
    };
}
// --- Patch app rendering to support iconImage ---
function renderAppIcon(app) {
    if (app.iconImage) {
        return `<span class="icon" style="background-image:url('${app.iconImage}'); background-size:contain; background-repeat:no-repeat; background-position:center; display:inline-block; width:1.5em; height:1.5em; vertical-align:middle;"></span>`;
    }
    return `<span class="icon">${app.icon || "📦"}</span>`;
}

function renderAppSelector() {
    const select = byId("app-select");
    const previous = select.value;

    select.innerHTML = "<option value=''>Add new app...</option>";
    getActiveApps().forEach((app, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `${app.icon || "📦"} ${app.name || `App ${index + 1}`}`;
        select.appendChild(option);
    });

    if (previous && getActiveApps()[Number(previous)]) {
        select.value = previous;
    }

    syncAppSelectionActions();
}

function syncAppSelectionActions() {
    const selectedValue = byId("app-select")?.value;
    const hasSelectedApp = selectedValue !== "" && getActiveApps()[Number(selectedValue)] !== undefined;
    byId("delete-app")?.toggleAttribute("disabled", !hasSelectedApp);
    byId("remove-selected-app")?.toggleAttribute("disabled", !hasSelectedApp);
    byId("clear-app-health-error")?.toggleAttribute("disabled", true);
}

function renderProfileSelector() {
    const select = byId("profile-select");
    if (!select) {
        return;
    }

    select.innerHTML = "";
    state.config.profiles.forEach((profile) => {
        const option = document.createElement("option");
        option.value = profile.id;
        option.textContent = profile.name;
        select.appendChild(option);
    });

    select.value = state.config.activeProfileId;
}

function renderTopBarProfileDropdown() {
    const panel = byId("profile-dropdown-panel");
    const label = byId("profile-dropdown-label");
    if (!panel || !label) {
        return;
    }

    panel.innerHTML = "";
    state.config.profiles.forEach((profile) => {
        const button = document.createElement("button");
        button.className = "profile-option";
        button.textContent = profile.name;
        button.dataset.profileId = profile.id;
        
        if (profile.id === state.config.activeProfileId) {
            button.classList.add("active");
        }
        
        button.addEventListener("click", () => {
            switchProfile(profile.id);
            hideProfileDropdown();
        });
        
        panel.appendChild(button);
    });

    const activeProfile = getActiveProfile();
    label.textContent = activeProfile ? activeProfile.name : "Default";
}

let profileDropdownVisible = false;

function showProfileDropdown() {
    const panel = byId("profile-dropdown-panel");
    const btn = byId("profile-dropdown-btn");
    if (!panel || !btn) {
        return;
    }
    
    panel.classList.remove("hidden");
    panel.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    profileDropdownVisible = true;
}

function hideProfileDropdown() {
    const panel = byId("profile-dropdown-panel");
    const btn = byId("profile-dropdown-btn");
    if (!panel || !btn) {
        return;
    }
    
    panel.classList.add("hidden");
    panel.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    profileDropdownVisible = false;
}

function toggleProfileDropdown() {
    if (profileDropdownVisible) {
        hideProfileDropdown();
    } else {
        showProfileDropdown();
    }
}

async function switchProfile(profileId) {
    if (!state.config.profiles.some((profile) => profile.id === profileId)) {
        return;
    }

    state.config.activeProfileId = profileId;
    syncAppsMirror();
    await persistConfig();
    state.editingAppIndex = null;
    renderProfileSelector();
    renderTopBarProfileDropdown();
    renderAppSelector();
    clearAppEditor();
    renderApps();
    runHealthChecks();
}

async function createProfile() {
    const name = await showPrompt("New profile name:");
    if (!name) {
        return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
        return;
    }

    const newProfile = {
        id: createProfileId(),
        name: trimmed,
        apps: []
    };

    state.config.profiles.push(newProfile);
    state.config.activeProfileId = newProfile.id;
    syncAppsMirror();
    await persistConfig();
    state.editingAppIndex = null;
    renderProfileSelector();
    renderTopBarProfileDropdown();
    renderAppSelector();
    clearAppEditor();
}

async function renameProfile() {
    const profile = getActiveProfile();
    const name = await showPrompt("Rename profile:", profile.name);
    if (!name) {
        return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
        return;
    }

    profile.name = trimmed;
    await persistConfig();
    renderProfileSelector();
    renderTopBarProfileDropdown();
}

async function deleteProfile() {
    if (state.config.profiles.length <= 1) {
        showToast("You must keep at least one profile.", "warning");
        return;
    }

    const profile = getActiveProfile();
    const confirmed = window.confirm(`Delete profile \"${profile.name}\" and all its apps?`);
    if (!confirmed) {
        return;
    }

    state.config.profiles = state.config.profiles.filter((p) => p.id !== profile.id);
    state.config.activeProfileId = state.config.profiles[0].id;
    await persistConfig();
    state.editingAppIndex = null;
    renderProfileSelector();
    renderTopBarProfileDropdown();
    renderAppSelector();
    clearAppEditor();
    renderApps();
}

function syncSettingsForm() {
    byId("cfg-title").value = state.config.title || "";
    byId("cfg-subtitle").value = state.config.subtitle || "";
    byId("cfg-persist-to-tray").checked = state.config.persistToTray === true;
    byId("cfg-settings-pin-enabled").checked = state.config.settingsPinEnabled === true;
    byId("cfg-settings-pin").value = "";
    byId("cfg-settings-pin-confirm").value = "";
    byId("cfg-startup-on-boot").checked = state.config.startupOnBoot === true;
    byId("cfg-global-hotkey").value = normalizeHotkeyInput(state.config.globalHotkey || "");
    byId("cfg-tile-size").value = normalizeTileSizePreset(state.config.tileSizePreset);
    byId("cfg-show-tile-tips").checked = state.config.showTileTips !== false;
    syncCustomTileSizeUI();

    const theme = {
        ...defaultConfig.theme,
        ...(state.config.theme || {})
    };
    byId("cfg-bg-1").value = theme.bg1;
    byId("cfg-bg-2").value = theme.bg2;
    byId("cfg-accent").value = theme.accent;
    byId("cfg-text").value = theme.text;
    byId("cfg-hover").value = theme.hover;
    renderThemePresetSelect();

    renderProfileSelector();
    renderTopBarProfileDropdown();
    renderAppSelector();
    clearAppEditor();
}

function renderThemePresetSelect() {
    const select = byId("theme-preset-select");
    if (!select) {
        return;
    }

    // Always include the built-in Obsidian Steel Blue preset
    const builtInPreset = {
        id: "obsidian-steelblue",
        name: "Obsidian Steel Blue",
        theme: {
            bg1: "#181c20",
            bg2: "#232a32",
            accent: "#4682b4",
            text: "#f8f8f2",
            hover: "#6fa3d9"
        }
    };

    let presets = Array.isArray(state.config.themePresets) ? [...state.config.themePresets] : [];
    if (!presets.some(p => p.id === builtInPreset.id)) {
        presets.unshift(builtInPreset);
    }

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select saved theme...";
    select.appendChild(placeholder);

    presets.forEach((preset) => {
        const safeTheme = {
            ...defaultConfig.theme,
            ...(preset.theme || {})
        };
        const option = document.createElement("option");
        option.value = preset.id;
        option.textContent = preset.name;
        select.appendChild(option);

        // Keep in-memory preset shape forward-compatible with new theme fields.
        preset.theme = safeTheme;
    });

    const hasSelected = presets.some((preset) => preset.id === state.selectedThemePresetId);
    if (!hasSelected) {
        state.selectedThemePresetId = "";
    }

    select.value = state.selectedThemePresetId;
    const hasChoice = Boolean(state.selectedThemePresetId);
    byId("apply-theme-preset")?.toggleAttribute("disabled", !hasChoice);
    byId("delete-theme-preset")?.toggleAttribute("disabled", !hasChoice);

    renderThemePresetThumbnails(presets);
}

function renderThemePresetThumbnails(presets) {
    const list = byId("theme-preset-list");
    if (!list) {
        return;
    }

    list.innerHTML = "";

    if (!presets.length) {
        const empty = document.createElement("p");
        empty.className = "theme-preset-empty";
        empty.textContent = "No saved themes yet.";
        list.appendChild(empty);
        return;
    }

    presets.forEach((preset, index) => {
        const safeTheme = {
            ...defaultConfig.theme,
            ...(preset.theme || {})
        };
        const swatch = document.createElement("button");
        swatch.type = "button";
        const isActive = state.selectedThemePresetId === preset.id;
        swatch.className = `theme-preset-thumb${isActive ? " active" : ""}`;
        swatch.setAttribute("data-theme-preset-id", preset.id);
        swatch.setAttribute("title", `Apply ${preset.name}`);
        swatch.tabIndex = (isActive || (!state.selectedThemePresetId && index === 0)) ? 0 : -1;

        swatch.innerHTML = `
            <span class="theme-preset-preview" style="--p-bg1:${safeTheme.bg1}; --p-bg2:${safeTheme.bg2}; --p-accent:${safeTheme.accent}; --p-hover:${safeTheme.hover};"></span>
            <span class="theme-preset-name">${preset.name}</span>
        `;
        list.appendChild(swatch);
    });
}

async function saveThemePreset() {
    if (!Array.isArray(state.config.themePresets)) {
        state.config.themePresets = [];
    }

    const existing = state.config.themePresets;
    const name = await showPrompt("Theme preset name:");
    if (!name) {
        return;
    }

    const trimmed = name.trim();
    if (!trimmed) {
        return;
    }

    const existingByName = existing.find((preset) => preset.name.toLowerCase() === trimmed.toLowerCase());
    if (existingByName) {
        existingByName.theme = collectThemeFromForm();
        state.selectedThemePresetId = existingByName.id;
        renderThemePresetSelect();
        showToast(`Updated theme preset "${existingByName.name}". Click Save Settings to keep changes.`, "success", 3600);
        return;
    }

    if (existing.length >= 3) {
        showToast("Theme preset limit reached (max 3). Delete one to save a new preset.", "warning", 4200);
        return;
    }

    const preset = {
        id: `theme-preset-${Date.now()}`,
        name: trimmed,
        theme: collectThemeFromForm()
    };

    existing.push(preset);
    state.selectedThemePresetId = preset.id;
    renderThemePresetSelect();
    showToast(`Saved theme preset "${trimmed}". Click Save Settings to keep changes.`, "success", 3600);
}

function applySelectedThemePreset() {
    const id = byId("theme-preset-select")?.value || "";
    applyThemePresetById(id);
}

function applyThemePresetById(id, options = {}) {
    const announce = options.announce !== false;
    if (!id) {
        return;
    }

    // Always include the built-in preset for lookup
    const builtInPreset = {
        id: "obsidian-steelblue",
        name: "Obsidian Steel Blue",
        theme: {
            bg1: "#181c20",
            bg2: "#232a32",
            accent: "#4682b4",
            text: "#f8f8f2",
            hover: "#6fa3d9"
        }
    };
    let allPresets = Array.isArray(state.config.themePresets) ? [...state.config.themePresets] : [];
    if (!allPresets.some(p => p.id === builtInPreset.id)) {
        allPresets.unshift(builtInPreset);
    }

    const preset = allPresets.find((entry) => entry.id === id);
    if (!preset) {
        return;
    }

    const safeTheme = {
        ...defaultConfig.theme,
        ...(preset.theme || {})
    };

    // Upgrade preset in memory so future edits don't lose newly added fields.
    preset.theme = safeTheme;

    byId("cfg-bg-1").value = safeTheme.bg1;
    byId("cfg-bg-2").value = safeTheme.bg2;
    byId("cfg-accent").value = safeTheme.accent;
    byId("cfg-text").value = safeTheme.text;
    byId("cfg-hover").value = safeTheme.hover;
    applyTheme(safeTheme);
    state.selectedThemePresetId = id;
    renderThemePresetSelect();
    if (announce) {
        showToast(`Applied theme preset "${preset.name}". Click Save Settings to keep changes.`, "info", 3400);
    }
}

function deleteSelectedThemePreset() {
    const id = byId("theme-preset-select")?.value || "";
    if (!id) {
        return;
    }

    const idx = (state.config.themePresets || []).findIndex((entry) => entry.id === id);
    if (idx < 0) {
        return;
    }

    const [removed] = state.config.themePresets.splice(idx, 1);
    state.selectedThemePresetId = "";
    renderThemePresetSelect();
    showToast(`Deleted theme preset "${removed.name}". Click Save Settings to keep changes.`, "warning", 3400);
}

function tileMarkup(app) {
    const type = app.type || "web";
    const icon = app.icon || "📦";
    const name = app.name || "Untitled";
    const desc = app.description || "No description";
    const broken = isAppBroken(app);

    const typeLabel = type === "local" ? "Local" : type === "steam" ? "Steam" : "Web";
    return `
        <div class="tile-header">
            ${renderAppIcon(app)}
            <span class="type-pill">${typeLabel}</span>
            ${broken ? `<span class="tile-broken-badge">⚠️</span>` : ""}
        </div>
        <div class="name">${name}</div>
        <p class="desc">${desc}</p>
        ${broken ? `<button class="tile-health-fix-btn" type="button" title="Open App Editor to fix local path">Fix Path</button>` : ""}
    `;
}

async function launchApp(app) {
    recordLaunch(app);

    if (isDesktop) {
        const result = await window.launcherAPI.openTarget(app);
        if (result && result.ok === false) {
            recordLaunchFailure(app, result.error || "Launch failed");
            showToast(result.error || "Forge could not launch that target.", "error", 4200);
            refreshAppHealthPanel();
            return;
        }
        clearLaunchFailure(app);
        refreshAppHealthPanel();
        return;
    }

    if (app.type === "web" && app.url) {
        window.open(app.url, "_blank", "noopener,noreferrer");
        clearLaunchFailure(app);
        refreshAppHealthPanel();
        return;
    }

    recordLaunchFailure(app, "Desktop launch targets are available in the Electron build.");
    showToast("Desktop launch targets are available in the Electron build.", "info", 3600);
    refreshAppHealthPanel();
}

async function openBrokenPathQuickFix(appIndex) {
    const opened = await openSettingsModal();
    if (!opened) {
        return;
    }

    loadAppIntoEditor(appIndex);
    const pathInput = byId("app-path");
    if (pathInput) {
        pathInput.focus();
        pathInput.select();
    }
}

const drag = { sourceIndex: null, lastDropTime: 0 };
let appGridDropHandlersWired = false;

function wireAppGridDropHandlers() {
    if (appGridDropHandlersWired) {
        return;
    }

    const container = byId("app-grid");
    if (!container) {
        return;
    }

    container.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
    });

    container.addEventListener("drop", (e) => {
        e.preventDefault();
        // Only handle if dropping on empty space (not on a tile)
        if (e.target.closest(".app-tile")) return;
        if (drag.sourceIndex === null) return;

        // Prevent duplicate drops within 200ms
        const now = Date.now();
        if (now - drag.lastDropTime < 200) return;
        drag.lastDropTime = now;

        const items = getActiveApps();
        const sourceApp = items[drag.sourceIndex];

        if (e.ctrlKey) {
            // Duplicate the app and append to end
            const duplicate = { ...sourceApp };
            duplicate.name = `${sourceApp.name} (copy)`;
            items.push(duplicate);
        } else {
            // Move the app to end
            const [moved] = items.splice(drag.sourceIndex, 1);
            items.push(moved);
        }

        persistApps();
        renderApps();
    });

    appGridDropHandlersWired = true;
}

function getTileElements() {
    return Array.from(document.querySelectorAll(".app-tile"));
}

function focusTileByOffset(currentTile, offset) {
    const tiles = getTileElements();
    const currentIndex = tiles.indexOf(currentTile);
    if (currentIndex === -1) {
        return;
    }

    const nextIndex = Math.min(Math.max(currentIndex + offset, 0), tiles.length - 1);
    tiles[nextIndex]?.focus();
}

function makeTile(app, appIndex) {
    const tile = document.createElement("article");
    const broken = isAppBroken(app);
    tile.className = `app-tile${broken ? " app-tile--broken" : ""}`;
    tile.innerHTML = tileMarkup(app);
    tile.draggable = true;
    tile.tabIndex = 0;
    tile.setAttribute("role", "button");
    const ariaType = app.type === "local" ? "Local" : app.type === "steam" ? "Steam" : "Web";
    tile.setAttribute("aria-label", `${app.name || "App"} (${ariaType})${broken ? " — path broken" : ""}`);
    tile.setAttribute("data-tip", "Click to launch | Right-click to edit | Drag to reorder | Tab + Enter for keyboard");

    tile.addEventListener("mousemove", (event) => {
        const rect = tile.getBoundingClientRect();
        tile.style.setProperty("--x", `${event.clientX - rect.left}px`);
        tile.style.setProperty("--y", `${event.clientY - rect.top}px`);
    });

    tile.addEventListener("mouseleave", () => {
        tile.style.setProperty("--x", "50%");
        tile.style.setProperty("--y", "50%");
        markTileTipSeen();
    });

    const fixButton = tile.querySelector(".tile-health-fix-btn");
    if (fixButton) {
        fixButton.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await openBrokenPathQuickFix(appIndex);
        });

        fixButton.addEventListener("keydown", (event) => {
            event.stopPropagation();
        });
    }

    tile.addEventListener("click", async () => {
        await launchApp(app);
    });

    tile.addEventListener("keydown", async (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            await launchApp(app);
            return;
        }

        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            focusTileByOffset(tile, 1);
            return;
        }

        if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            focusTileByOffset(tile, -1);
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            getTileElements()[0]?.focus();
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            const tiles = getTileElements();
            tiles[tiles.length - 1]?.focus();
        }
    });

    tile.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        syncSettingsForm();
        loadAppIntoEditor(appIndex);
        showModal(true);
        byId("app-name").focus();
    });

    tile.addEventListener("dragstart", (e) => {
        drag.sourceIndex = appIndex;
        tile.classList.add("tile-dragging");
        e.dataTransfer.effectAllowed = "copyMove";
        e.dataTransfer.setData("text/plain", String(appIndex));
    });

    tile.addEventListener("dragend", () => {
        drag.sourceIndex = null;
        drag.dropHandled = false;
        tile.classList.remove("tile-dragging");
        tile.classList.remove("tile-dragging-copy");
        document.querySelectorAll(".tile-drag-over").forEach((el) => el.classList.remove("tile-drag-over"));
    });

    tile.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.ctrlKey ? "copy" : "move";
        if (e.ctrlKey) {
            tile.classList.add("tile-drag-over-copy");
        } else {
            tile.classList.remove("tile-drag-over-copy");
        }
        tile.classList.add("tile-drag-over");
    });

    tile.addEventListener("dragleave", () => {
        tile.classList.remove("tile-drag-over");
        tile.classList.remove("tile-drag-over-copy");
    });

    tile.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        tile.classList.remove("tile-drag-over");
        tile.classList.remove("tile-drag-over-copy");
        if (drag.sourceIndex === null || drag.sourceIndex === appIndex) return;
        
        // Prevent duplicate drops within 200ms
        const now = Date.now();
        if (now - drag.lastDropTime < 200) return;
        drag.lastDropTime = now;
        
        const items = getActiveApps();
        const sourceApp = items[drag.sourceIndex];

        if (e.ctrlKey) {
            // Duplicate the app
            const duplicate = { ...sourceApp };
            duplicate.name = `${sourceApp.name} (copy)`;
            const insertAt = drag.sourceIndex < appIndex ? appIndex : appIndex + 1;
            items.splice(insertAt, 0, duplicate);
        } else {
            // Move the app
            const [moved] = items.splice(drag.sourceIndex, 1);
            const insertAt = drag.sourceIndex < appIndex ? appIndex - 1 : appIndex;
            items.splice(insertAt, 0, moved);
        }
        
        persistApps();
        renderApps();
    });

    return tile;
}

function matchesSearch(app, query) {
    if (!query) {
        return true;
    }

    const searchText = [
        app.name,
        app.description,
        app.category,
        app.type,
        app.url,
        app.path,
        app.id,
        app.steamId
    ].filter(Boolean).join(" ").toLowerCase();

    return searchText.includes(query);
}

function syncSearchUI() {
    const input = byId("app-search");
    const clear = byId("clear-search");
    if (!input || !clear) {
        return;
    }

    if (input.value !== state.searchQuery) {
        input.value = state.searchQuery;
    }

    clear.classList.toggle("hidden", !state.searchQuery);
}

function getCategoryFilterKey(app) {
    const category = app?.category && app.category.trim();
    return category ? category.toLowerCase() : CATEGORY_FILTER_UNCATEGORIZED;
}

function renderCategoryRail(searchMatchedApps) {
    const rail = byId("category-rail");
    if (!rail) {
        return;
    }

    const counts = new Map();
    const labels = new Map();
    searchMatchedApps.forEach(({ app }) => {
        const category = app.category && app.category.trim();
        const key = category ? category.toLowerCase() : CATEGORY_FILTER_UNCATEGORIZED;
        counts.set(key, (counts.get(key) || 0) + 1);
        if (!labels.has(key)) {
            labels.set(key, category || "Uncategorized");
        }
    });

    const isSpecialFilter = state.categoryFilter === CATEGORY_FILTER_RECENT || state.categoryFilter === CATEGORY_FILTER_MOST_USED;
    if (!isSpecialFilter && state.categoryFilter !== CATEGORY_FILTER_ALL && !counts.has(state.categoryFilter)) {
        state.categoryFilter = CATEGORY_FILTER_ALL;
    }

    const hasAnyTelemetry = searchMatchedApps.some(({ app }) => getAppTelemetry(app) !== null);

    const entries = [];
    if (hasAnyTelemetry) {
        entries.push({ key: CATEGORY_FILTER_RECENT, label: "🕐 Recent" });
        entries.push({ key: CATEGORY_FILTER_MOST_USED, label: "🔥 Most Used" });
    }
    entries.push({
        key: CATEGORY_FILTER_ALL,
        label: `All (${searchMatchedApps.length})`
    });

    Array.from(labels.entries())
        .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }))
        .forEach(([key, label]) => {
            entries.push({ key, label: `${label} (${counts.get(key) || 0})` });
        });

    rail.innerHTML = "";
    entries.forEach((entry) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `category-filter-btn ${state.categoryFilter === entry.key ? "active" : ""}`;
        button.setAttribute("data-category-filter", entry.key);
        button.textContent = entry.label;
        rail.appendChild(button);
    });
}

function renderApps() {
    const container = byId("app-grid");
    container.innerHTML = "";

    const query = state.searchQuery.trim().toLowerCase();
    const apps = getActiveApps();
    const searchMatchedApps = apps
        .map((app, idx) => ({ app, idx }))
        .filter(({ app }) => matchesSearch(app, query));

    syncSearchUI();
    renderCategoryRail(searchMatchedApps);

    // Special telemetry views: Recent and Most Used
    if (state.categoryFilter === CATEGORY_FILTER_RECENT || state.categoryFilter === CATEGORY_FILTER_MOST_USED) {
        const withTelemetry = searchMatchedApps
            .map(({ app, idx }) => ({ app, idx, tel: getAppTelemetry(app) }))
            .filter(({ tel }) => tel && tel.launchCount > 0);

        if (state.categoryFilter === CATEGORY_FILTER_RECENT) {
            withTelemetry.sort((a, b) => (b.tel.lastLaunched || "").localeCompare(a.tel.lastLaunched || ""));
        } else {
            withTelemetry.sort((a, b) => (b.tel.launchCount || 0) - (a.tel.launchCount || 0));
        }

        if (!withTelemetry.length) {
            const empty = document.createElement("p");
            empty.className = "empty-state";
            empty.textContent = "No launches recorded yet. Launch an app to see it here.";
            container.appendChild(empty);
            return;
        }

        const grid = document.createElement("div");
        grid.className = "grid";
        withTelemetry.forEach(({ app, idx }) => grid.appendChild(makeTile(app, idx)));
        container.appendChild(grid);
        return;
    }

    const visibleApps = searchMatchedApps.filter(({ app }) => {
        if (state.categoryFilter === CATEGORY_FILTER_ALL) {
            return true;
        }
        return getCategoryFilterKey(app) === state.categoryFilter;
    });

    if (!visibleApps.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = query
            ? `No apps match "${state.searchQuery}".`
            : "No apps yet. Open Settings to add your first app.";
        container.appendChild(empty);
        return;
    }

    const hasCategories = visibleApps.some(({ app }) => app.category && app.category.trim());

    if (!hasCategories) {
        const grid = document.createElement("div");
        grid.className = "grid";
        visibleApps.forEach(({ app, idx }) => grid.appendChild(makeTile(app, idx)));
        container.appendChild(grid);
        return;
    }

    // Build ordered map: named categories first (insertion order), then uncategorized last.
    const categoryMap = new Map();
    visibleApps.forEach(({ app, idx }) => {
        const key = (app.category && app.category.trim()) ? app.category.trim() : "";
        if (!categoryMap.has(key)) categoryMap.set(key, []);
        categoryMap.get(key).push({ app, idx });
    });

    // Render named categories first, then uncategorized.
    const order = [...categoryMap.keys()].filter((k) => k !== "");
    if (categoryMap.has("")) order.push("");

    order.forEach((key) => {
        const section = document.createElement("section");
        section.className = "category-section";

        const heading = document.createElement("h2");
        heading.className = "category-heading";
        heading.textContent = key || "Uncategorized";
        section.appendChild(heading);

        const grid = document.createElement("div");
        grid.className = "grid";
        categoryMap.get(key).forEach(({ app, idx }) => grid.appendChild(makeTile(app, idx)));
        section.appendChild(grid);

        container.appendChild(section);
    });
}

function collectThemeFromForm() {
    return {
        bg1: byId("cfg-bg-1").value,
        bg2: byId("cfg-bg-2").value,
        accent: byId("cfg-accent").value,
        text: byId("cfg-text").value,
        hover: byId("cfg-hover").value
    };
}

function resetThemeInputsToDefault() {
    const theme = defaultConfig.theme;
    byId("cfg-bg-1").value = theme.bg1;
    byId("cfg-bg-2").value = theme.bg2;
    byId("cfg-accent").value = theme.accent;
    byId("cfg-text").value = theme.text;
    byId("cfg-hover").value = theme.hover;
    applyTheme(theme);
}

function collectAppFromEditor() {
    clearAppEditorError();
    const type = byId("app-type").value;
    const name = byId("app-name").value.trim();

    if (!name) {
        showAppEditorError("App name is required.", "app-name");
        return null;
    }

    const app = {
        name,
        type,
        icon: byId("app-icon").value.trim() || "📦",
        iconImage: iconImageInput ? iconImageInput.getImageData() : null,
        description: byId("app-description").value.trim(),
        category: byId("app-category").value.trim()
    };

    if (type === "web") {
        const url = byId("app-url").value.trim();
        if (!url) {
            showAppEditorError("URL is required for web apps.", "app-url", "web");
            return null;
        }
        app.url = url;
    }

    if (type === "local") {
        const path = byId("app-path").value.trim();
        if (!path) {
            showAppEditorError(
                "A full file or folder path is required for local apps (e.g. C:/Games/MyGame.exe or C:/Games/MyFolder).",
                "app-path",
                "local"
            );
            return null;
        }
        app.path = path;
        app.args = byId("app-args").value.trim();
    }

    if (type === "steam") {
        const id = byId("app-id").value.trim();
        if (!id) {
            showAppEditorError(
                "Steam App ID is required (e.g. 730 for CS2). Find it in the game's Steam store page URL.",
                "app-id",
                "steam"
            );
            return null;
        }
        app.id = id;
    }

    return app;
}

function collectRawEditorDraft() {
    return {
        name: byId("app-name").value.trim(),
        type: byId("app-type").value,
        icon: byId("app-icon").value.trim() || "🚀",
        iconImage: iconImageInput ? iconImageInput.getImageData() : null,
        description: byId("app-description").value.trim(),
        category: byId("app-category").value.trim(),
        url: byId("app-url").value.trim(),
        path: byId("app-path").value.trim(),
        args: byId("app-args").value.trim(),
        id: byId("app-id").value.trim()
    };
}

function isAppEditorDirty() {
    const draft = collectRawEditorDraft();

    if (state.editingAppIndex === null) {
        return Boolean(
            draft.name ||
            draft.description ||
            draft.category ||
            draft.url ||
            draft.path ||
            draft.args ||
            draft.id ||
            draft.type !== "web" ||
            draft.icon !== "🚀"
        );
    }

    const existing = getActiveApps()[state.editingAppIndex];
    if (!existing) {
        return false;
    }

    const existingComparable = {
        name: existing.name || "",
        type: existing.type || "web",
        icon: existing.icon || "🚀",
        description: existing.description || "",
        category: existing.category || "",
        url: existing.url || "",
        path: existing.path || "",
        args: existing.args || "",
        id: existing.id || existing.steamId || ""
    };

    return JSON.stringify(draft) !== JSON.stringify(existingComparable);
}

async function exportConfig() {
    syncAppsMirror();
    const json = JSON.stringify({
        ...state.config
    }, null, 2);

    if (isDesktop) {
        const saved = await window.launcherAPI.exportConfig(json);
        if (saved) {
            showToast("Config exported successfully.", "success");
        }
        return;
    }

    // Browser fallback: download as file.
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-config.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Config exported successfully.", "success");
}

async function importConfig() {
    if (isDesktop) {
        const raw = await window.launcherAPI.importConfig();
        if (!raw) {
            return;
        }

        await prepareImportedConfig(raw);
        return;
    }

    // Browser fallback: file input.
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
        if (!input.files.length) {
            return;
        }

        const raw = await input.files[0].text();
        await prepareImportedConfig(raw);
    });
    input.click();
}

async function loadConfigBackupList() {
    const container = byId("backup-list");
    if (!container) {
        return;
    }

    if (!isDesktop) {
        container.innerHTML = '<p class="backup-empty">Backups are only available in the desktop app.</p>';
        return;
    }

    container.innerHTML = '<p class="backup-empty">Loading\u2026</p>';
    const backups = await window.launcherAPI.listConfigBackups();
    renderConfigBackupList(backups);
}

function renderConfigBackupList(backups) {
    const container = byId("backup-list");
    if (!container) {
        return;
    }

    if (!backups || backups.length === 0) {
        container.innerHTML = '<p class="backup-empty">No backups found.</p>';
        return;
    }

    container.innerHTML = "";
    backups.forEach(({ name, label, sizeKb }) => {
        const entry = document.createElement("div");
        entry.className = "backup-entry";
        entry.innerHTML = `
            <span class="backup-label">${label}</span>
            <span class="backup-size">${sizeKb}\u00a0KB</span>
            <button class="btn ghost backup-restore-btn" type="button" data-name="${name}">Restore</button>
        `;
        entry.querySelector(".backup-restore-btn").addEventListener("click", () => restoreConfigBackup(name));
        container.appendChild(entry);
    });
}

async function restoreConfigBackup(filename) {
    if (!isDesktop) {
        return;
    }

    const raw = await window.launcherAPI.loadConfigBackup(filename);
    if (!raw) {
        showToast("Could not read backup file.", "error", 4200);
        return;
    }

    await prepareImportedConfig(raw);
}

async function prepareImportedConfig(raw) {
    let imported;
    try {
        imported = JSON.parse(raw);
    } catch {
        showToast("Invalid config file.", "error", 4200);
        return;
    }

    state.pendingImport = {
        config: buildImportedConfig(imported)
    };
    renderImportPreview();
    showImportPreviewModal(true);
}

async function applyImportReplace() {
    if (!state.pendingImport) {
        return;
    }

    await commitConfig(state.pendingImport.config);
    closeImportPreview();
}

async function applyImportMerge() {
    if (!state.pendingImport) {
        return;
    }

    const result = mergeImportedConfig(state.config, state.pendingImport.config);
    await commitConfig(result.config);
    closeImportPreview();
    showToast(
        `Merged import: ${result.summary.profilesAdded} new profile(s), ` +
        `${result.summary.profilesMerged} merged profile(s), ` +
        `${result.summary.appsAdded} new app(s) added, ` +
        `${result.summary.duplicatesSkipped} duplicate app(s) skipped.`,
        "success",
        5200
    );
}

async function persistApps() {
    await persistConfig();
}

async function saveApp() {
    const app = collectAppFromEditor();
    if (!app) {
        return false;
    }

    if (isDesktop && app.type === "local") {
        const validation = await window.launcherAPI.validateLocalPath(app.path);
        if (!validation?.ok) {
            showAppEditorError(validation?.error || "That local path is not valid.", "app-path", "local");
            return false;
        }

        if (validation.kind === "directory" && app.args) {
            showAppEditorError(
                "Arguments are only supported when Path points to a file. Clear Arguments or choose a file target instead.",
                "app-args",
                "local"
            );
            return false;
        }

        app.path = validation.path;
    }

    clearAppEditorError();

    if (state.editingAppIndex === null) {
        getActiveApps().push(app);
    } else {
        getActiveApps()[state.editingAppIndex] = app;
    }

    await persistApps();
    renderApps();
    renderAppSelector();
    clearAppEditor();
    runHealthChecks();
    return true;
}

async function deleteApp() {
    if (state.editingAppIndex === null) {
        showAppEditorError("Select an existing app to delete.", "app-name");
        return;
    }

    const app = getActiveApps()[state.editingAppIndex];
    if (!app) {
        return;
    }

    const confirmed = window.confirm(`Delete ${app.name}?`);
    if (!confirmed) {
        return;
    }

    getActiveApps().splice(state.editingAppIndex, 1);
    await persistApps();
    renderApps();
    renderAppSelector();
    clearAppEditor();
}

async function removeSelectedApp() {
    const selected = byId("app-select").value;
    if (!selected) {
        showToast("Select an existing app to remove.", "warning", 2800);
        return;
    }

    clearAppEditorError();
    loadAppIntoEditor(Number(selected));
    await deleteApp();
}

function clearSelectedAppHealthError() {
    if (state.editingAppIndex === null) {
        return;
    }

    const app = getActiveApps()[state.editingAppIndex];
    if (!app) {
        return;
    }

    clearLaunchFailure(app);
    refreshAppHealthPanel();
    showToast("Cleared last launch error for selected app.", "success", 2400);
}

async function browseExecutable() {
    if (!isDesktop) {
        showToast("Native file browsing is available in the Electron desktop launcher.", "info", 3600);
        return;
    }

    const path = await window.launcherAPI.browseExecutable();
    if (path) {
        byId("app-path").value = path;
        clearAppEditorError();
    }
}

async function browseFolder() {
    if (!isDesktop) {
        showToast("Native folder browsing is available in the Electron desktop launcher.", "info", 3600);
        return;
    }

    const path = await window.launcherAPI.browseFolder();
    if (path) {
        byId("app-path").value = path;
        clearAppEditorError();
    }
}

async function saveSettings() {
    if (isAppEditorDirty()) {
        const saveAppChanges = window.confirm(
            "You have unsaved App Editor changes. Click OK to save app changes too, or Cancel to save settings only."
        );

        if (saveAppChanges) {
            const appSaved = await saveApp();
            if (!appSaved) {
                return;
            }
        }
    }

    state.config.title = byId("cfg-title").value.trim() || defaultConfig.title;
    state.config.subtitle = byId("cfg-subtitle").value.trim() || defaultConfig.subtitle;
    state.config.persistToTray = byId("cfg-persist-to-tray").checked;
    const nextPinEnabled = byId("cfg-settings-pin-enabled").checked;
    const pinValue = byId("cfg-settings-pin").value.trim();
    const pinConfirm = byId("cfg-settings-pin-confirm").value.trim();

    if (nextPinEnabled) {
        if (!state.config.settingsPinHash && !pinValue) {
            showToast("Set a PIN before enabling Settings lock.", "warning", 4200);
            byId("cfg-settings-pin").focus();
            return;
        }

        if (pinValue) {
            if (!/^\d{4,}$/.test(pinValue)) {
                showToast("PIN must be at least 4 digits.", "warning", 4200);
                byId("cfg-settings-pin").focus();
                return;
            }

            if (pinValue !== pinConfirm) {
                showToast("PIN and confirmation do not match.", "warning", 4200);
                byId("cfg-settings-pin-confirm").focus();
                return;
            }

            state.config.settingsPinHash = await hashPin(pinValue);
        }

        state.config.settingsPinEnabled = true;
    } else {
        state.config.settingsPinEnabled = false;
        state.config.settingsPinHash = "";
    }

    state.config.startupOnBoot = byId("cfg-startup-on-boot").checked;
    state.config.globalHotkey = normalizeHotkeyInput(byId("cfg-global-hotkey").value.trim());
    byId("cfg-global-hotkey").value = state.config.globalHotkey;
    state.config.tileSizePreset = normalizeTileSizePreset(byId("cfg-tile-size").value);
    state.config.tileSizeCustom = normalizeTileSizeCustom({
        minWidth: byId("cfg-tile-min-width").value,
        minHeight: byId("cfg-tile-min-height").value
    });
    state.config.showTileTips = byId("cfg-show-tile-tips").checked;
    state.config.theme = collectThemeFromForm();

    syncHeader();
    applyTheme(state.config.theme);
    applyTileSizePreset(state.config.tileSizePreset);

    if (isDesktop) {
        await window.launcherAPI.setCloseToTray(state.config.persistToTray);
        const startupApplied = await window.launcherAPI.setStartupOnBoot(state.config.startupOnBoot === true);
        state.config.startupOnBoot = startupApplied;

        const hotkeyResult = await window.launcherAPI.setGlobalHotkey(state.config.globalHotkey || "");
        if (!hotkeyResult.ok) {
            showToast(`Hotkey was not applied: ${hotkeyResult.error}`, "warning", 4200);
            state.config.globalHotkey = "";
            byId("cfg-global-hotkey").value = "";
            byId("cfg-global-hotkey").focus();
        } else {
            state.config.globalHotkey = hotkeyResult.hotkey || "";
            byId("cfg-global-hotkey").value = state.config.globalHotkey;
        }

        await persistConfig();
    } else {
        await persistConfig();
    }

    byId("cfg-settings-pin").value = "";
    byId("cfg-settings-pin-confirm").value = "";

    applyTileTipsVisibility();

    showModal(false);
}

function applyRawSettings(raw) {
    if (!raw) {
        return;
    }

    try {
        const settings = JSON.parse(raw);
        state.config = {
            ...state.config,
            ...settings,
            theme: {
                ...state.config.theme,
                ...(settings.theme || {})
            },
            apps: Array.isArray(settings.apps) ? settings.apps : state.config.apps,
            profiles: Array.isArray(settings.profiles) ? settings.profiles : state.config.profiles,
            activeProfileId: settings.activeProfileId || state.config.activeProfileId
        };

        state.config.tileSizePreset = normalizeTileSizePreset(settings.tileSizePreset || state.config.tileSizePreset);
        state.config.tileSizeCustom = normalizeTileSizeCustom(settings.tileSizeCustom || state.config.tileSizeCustom);
        state.config.settingsPinEnabled = settings.settingsPinEnabled === true;
        state.config.settingsPinHash = typeof settings.settingsPinHash === "string" ? settings.settingsPinHash : "";

        normalizeConfig();
    } catch {
        // Ignore malformed data.
    }
}

function loadSavedSettings() {
    applyRawSettings(localStorage.getItem("forge-launcher-settings"));
}

async function loadConfigFile() {
    try {
        const response = await fetch("./config.json", { cache: "no-store" });
        if (!response.ok) {
            return;
        }

        const configFromFile = await response.json();
        state.config = {
            ...state.config,
            ...configFromFile,
            theme: {
                ...state.config.theme,
                ...(configFromFile.theme || {})
            },
            apps: Array.isArray(configFromFile.apps) ? configFromFile.apps : state.config.apps,
            profiles: Array.isArray(configFromFile.profiles) ? configFromFile.profiles : state.config.profiles,
            activeProfileId: configFromFile.activeProfileId || state.config.activeProfileId
        };

        state.config.tileSizePreset = normalizeTileSizePreset(configFromFile.tileSizePreset || state.config.tileSizePreset);
        state.config.tileSizeCustom = normalizeTileSizeCustom(configFromFile.tileSizeCustom || state.config.tileSizeCustom);

        normalizeConfig();
    } catch {
        // Default config is already loaded.
    }
}

function wireEvents() {
    byId("open-help").addEventListener("click", () => showHelpModal(true));

    document.addEventListener("keydown", handleGlobalKeydown);

    byId("command-palette-input").addEventListener("input", () => {
        commandPaletteSelectionIndex = 0;
        renderCommandPaletteResults();
    });

    byId("command-palette-input").addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveCommandPaletteSelection(1);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            moveCommandPaletteSelection(-1);
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            launchCommandPaletteSelection();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeCommandPalette();
        }
    });

    byId("command-palette-modal").addEventListener("mousedown", (event) => {
        if (event.target === byId("command-palette-modal")) {
            closeCommandPalette();
        }
    });

    byId("app-search").addEventListener("input", (event) => {
        state.searchQuery = event.target.value;
        renderApps();
    });
    wireAppGridDropHandlers();

    byId("app-search").addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            state.searchQuery = "";
            event.target.value = "";
            renderApps();
        }
    });

    byId("clear-search").addEventListener("click", () => {
        state.searchQuery = "";
        byId("app-search").value = "";
        renderApps();
        byId("app-search").focus();
    });

    byId("category-rail").addEventListener("click", (event) => {
        const button = event.target.closest("button[data-category-filter]");
        if (!button) {
            return;
        }

        state.categoryFilter = button.getAttribute("data-category-filter") || CATEGORY_FILTER_ALL;
        renderApps();
    });

    byId("category-rail").addEventListener("keydown", (event) => {
        const button = event.target.closest("button[data-category-filter]");
        if (!button) {
            return;
        }

        const buttons = getCategoryFilterButtons();
        if (!buttons.length) {
            return;
        }

        const currentIndex = buttons.indexOf(button);
        if (currentIndex === -1) {
            return;
        }

        let nextIndex = currentIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % buttons.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        } else if (event.key === "Home") {
            event.preventDefault();
            nextIndex = 0;
        } else if (event.key === "End") {
            event.preventDefault();
            nextIndex = buttons.length - 1;
        } else {
            return;
        }

        const nextButton = buttons[nextIndex];
        const nextFilter = nextButton.getAttribute("data-category-filter") || CATEGORY_FILTER_ALL;
        state.categoryFilter = nextFilter;
        renderApps();
        focusCategoryFilterByKey(nextFilter);
    });

    byId("close-help").addEventListener("click", () => showHelpModal(false));
    byId("cancel-import-preview").addEventListener("click", closeImportPreview);
    byId("replace-import-preview").addEventListener("click", applyImportReplace);
    byId("merge-import-preview").addEventListener("click", applyImportMerge);
    byId("dismiss-tips").addEventListener("click", dismissQuickTips);

    byId("open-settings").addEventListener("click", async () => {
        await openSettingsModal();
    });

    byId("settings-tabs")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-settings-tab]");
        if (!button) {
            return;
        }

        const tabKey = button.getAttribute("data-settings-tab") || "general";
        setSettingsTab(tabKey);
    });

    byId("settings-tabs")?.addEventListener("keydown", (event) => {
        const button = event.target.closest("button[data-settings-tab]");
        if (!button) {
            return;
        }

        const buttons = getSettingsTabButtons();
        if (!buttons.length) {
            return;
        }

        const currentIndex = buttons.indexOf(button);
        if (currentIndex === -1) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            event.preventDefault();
            focusAndActivateSettingsTabByIndex(currentIndex + 1);
            return;
        }

        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            event.preventDefault();
            focusAndActivateSettingsTabByIndex(currentIndex - 1);
            return;
        }

        if (event.key === "Home") {
            event.preventDefault();
            focusAndActivateSettingsTabByIndex(0);
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            focusAndActivateSettingsTabByIndex(buttons.length - 1);
            return;
        }

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const tabKey = button.getAttribute("data-settings-tab") || "general";
            setSettingsTab(tabKey);
        }
    });

    byId("settings-modal")?.addEventListener("keydown", (event) => {
        if (event.key !== "Tab") {
            return;
        }

        const modal = byId("settings-modal");
        if (!modal || modal.classList.contains("hidden")) {
            return;
        }

        const focusables = getFocusableElements(modal);
        if (!focusables.length) {
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    });

    byId("mini-prompt-ok").addEventListener("click", commitPrompt);
    byId("mini-prompt-cancel").addEventListener("click", () => closePrompt(null));
    byId("mini-prompt-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            commitPrompt();
            return;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            closePrompt(null);
        }
    });

    byId("unlock-settings-pin").addEventListener("click", tryUnlockSettings);
    byId("cancel-settings-pin").addEventListener("click", cancelUnlockSettings);
    byId("settings-pin-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            tryUnlockSettings();
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            cancelUnlockSettings();
        }
    });

    byId("close-settings").addEventListener("click", () => showModal(false));
    byId("save-settings").addEventListener("click", saveSettings);

    byId("new-app").addEventListener("click", () => {
        clearAppEditor();
        focusAppEditorNameField();
    });
    byId("save-app").addEventListener("click", saveApp);
    byId("delete-app").addEventListener("click", deleteApp);
    byId("remove-selected-app").addEventListener("click", removeSelectedApp);
    byId("clear-app-health-error").addEventListener("click", clearSelectedAppHealthError);
    byId("profile-select").addEventListener("change", (event) => switchProfile(event.target.value));
    byId("new-profile").addEventListener("click", createProfile);
    byId("rename-profile").addEventListener("click", renameProfile);
    byId("delete-profile").addEventListener("click", deleteProfile);

    byId("cfg-tile-size").addEventListener("change", (event) => {
        applyTileSizePreset(event.target.value);
    });

    ["cfg-tile-min-width", "cfg-tile-min-height"].forEach((id) => {
        byId(id).addEventListener("input", () => {
            state.config.tileSizeCustom = normalizeTileSizeCustom({
                minWidth: byId("cfg-tile-min-width").value,
                minHeight: byId("cfg-tile-min-height").value
            });
            syncCustomTileSizeUI();
            if (normalizeTileSizePreset(state.config.tileSizePreset) === "custom") {
                applyTileSizePreset("custom");
            }
        });
    });

    const hotkeyInput = byId("cfg-global-hotkey");
    hotkeyInput.addEventListener("focus", () => hotkeyInput.select());
    hotkeyInput.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" || event.key === "Delete" || event.key === "Escape") {
            event.preventDefault();
            hotkeyInput.value = "";
            return;
        }

        const accelerator = acceleratorFromKeyEvent(event);
        if (!accelerator) {
            return;
        }

        event.preventDefault();
        hotkeyInput.value = accelerator;
    });

    byId("browse-exe").addEventListener("click", browseExecutable);
    byId("browse-folder").addEventListener("click", browseFolder);
    byId("export-config").addEventListener("click", exportConfig);
    byId("import-config").addEventListener("click", importConfig);
    byId("refresh-backups").addEventListener("click", loadConfigBackupList);

    byId("app-type").addEventListener("change", (event) => {
        clearAppEditorError();
        setTypeFields(event.target.value);
        refreshAppHealthPanel();
    });

    byId("app-select").addEventListener("change", (event) => {
        clearAppEditorError();
        const value = event.target.value;
        if (!value) {
            clearAppEditor();
            focusAppEditorNameField();
            syncAppSelectionActions();
            return;
        }

        loadAppIntoEditor(Number(value));
        focusAppEditorNameField();
        syncAppSelectionActions();
    });

    ["app-name", "app-icon", "app-description", "app-category", "app-url", "app-path", "app-args", "app-id"].forEach((id) => {
        byId(id).addEventListener("input", clearAppEditorError);
    });

    byId("app-path").addEventListener("change", refreshAppHealthPanel);

    ["cfg-bg-1", "cfg-bg-2", "cfg-accent", "cfg-text", "cfg-hover"].forEach((id) => {
        byId(id).addEventListener("input", () => {
            applyTheme(collectThemeFromForm());
        });
    });

    byId("theme-preset-select")?.addEventListener("change", (event) => {
        const id = event.target.value || "";
        if (!id) {
            state.selectedThemePresetId = "";
            renderThemePresetSelect();
            return;
        }

        applyThemePresetById(id, { announce: false });
    });

    byId("theme-preset-list")?.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-theme-preset-id]");
        if (!button) {
            return;
        }

        const id = button.getAttribute("data-theme-preset-id") || "";
        applyThemePresetById(id);
    });

    byId("theme-preset-list")?.addEventListener("keydown", (event) => {
        const list = byId("theme-preset-list");
        const thumbs = Array.from(list.querySelectorAll("button[data-theme-preset-id]"));
        if (!thumbs.length) {
            return;
        }

        const focused = document.activeElement;
        const currentIndex = thumbs.indexOf(focused);

        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const dir = event.key === "ArrowRight" ? 1 : -1;
            const base = currentIndex < 0 ? 0 : currentIndex;
            const nextIndex = (base + dir + thumbs.length) % thumbs.length;
            thumbs.forEach((t, i) => { t.tabIndex = i === nextIndex ? 0 : -1; });
            thumbs[nextIndex].focus();
            return;
        }

        if ((event.key === "Enter" || event.key === " ") && currentIndex >= 0) {
            event.preventDefault();
            const id = focused.getAttribute("data-theme-preset-id") || "";
            applyThemePresetById(id);
            // Re-focus the active thumb after re-render.
            const list2 = byId("theme-preset-list");
            const active = list2?.querySelector("button[data-theme-preset-id].active");
            active?.focus();
        }
    });

    byId("save-theme-preset")?.addEventListener("click", saveThemePreset);
    byId("apply-theme-preset")?.addEventListener("click", applySelectedThemePreset);
    byId("delete-theme-preset")?.addEventListener("click", deleteSelectedThemePreset);

    byId("reset-theme-default")?.addEventListener("click", () => {
        resetThemeInputsToDefault();
        showToast("Theme reset to default Forge palette. Click Save Settings to keep changes.", "info", 3400);
    });

    const controls = byId("window-controls");
    if (isDesktop) {
        controls.classList.remove("hidden");

        byId("window-minimize").addEventListener("click", () => {
            window.launcherAPI.minimizeWindow();
        });

        byId("window-maximize").addEventListener("click", () => {
            window.launcherAPI.maximizeWindow();
        });

        byId("window-close").addEventListener("click", () => {
            window.launcherAPI.closeWindow();
        });
    }
}

async function bootstrap() {
    await loadConfigFile();

    if (isDesktop) {
        const raw = await window.launcherAPI.loadConfig();
        if (raw) {
            applyRawSettings(raw);
        } else {
            // One-time migration: move any existing localStorage data to encrypted storage.
            const localRaw = localStorage.getItem("forge-launcher-settings");
            if (localRaw) {
                applyRawSettings(localRaw);
                await window.launcherAPI.saveConfig(localRaw);
                localStorage.removeItem("forge-launcher-settings");
            }
        }
    } else {
        loadSavedSettings();
    }

    normalizeConfig();

    applyTileTipsVisibility();
    syncHeader();
    applyTheme(state.config.theme);
    applyTileSizePreset(state.config.tileSizePreset);
    syncSettingsForm();
    renderApps();
    wireEvents();
    syncQuickTipsVisibility();
    runHealthChecks();

    if (isDesktop) {
        await window.launcherAPI.setCloseToTray(state.config.persistToTray === true);
        const startupState = await window.launcherAPI.getStartupOnBoot();
        if (startupState !== state.config.startupOnBoot) {
            await window.launcherAPI.setStartupOnBoot(state.config.startupOnBoot === true);
        }

        const hotkeyResult = await window.launcherAPI.setGlobalHotkey(state.config.globalHotkey || "");
        if (!hotkeyResult.ok) {
            state.config.globalHotkey = "";
            byId("cfg-global-hotkey").value = "";
        }
    }
}

bootstrap();
