const { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, safeStorage, screen, shell, Tray } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

let mainWindow;
let tray;
let closeToTray = false;
let isQuitting = false;
let trayNoticeShown = false;
let registeredHotkey = "";
const registeredAppHotkeys = new Map(); // Maps hotkey string to app data

const DEFAULT_WINDOW_BOUNDS = {
    width: 1120,
    height: 760,
    minWidth: 520,
    minHeight: 480
};
const CONFIG_BACKUP_LIMIT = 20;

function getConfigPath() {
    return path.join(app.getPath("userData"), "launcher-config.bin");
}

function getConfigBackupDirPath() {
    return path.join(app.getPath("userData"), "backups");
}

function getBackupTimestamp() {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    const sec = String(date.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
}

function createConfigBackup() {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
        return;
    }

    const backupDir = getConfigBackupDirPath();
    fs.mkdirSync(backupDir, { recursive: true });

    const stamp = getBackupTimestamp();
    const encrypted = fs.readFileSync(configPath);

    // Prefer readable JSON backups for easy restore via Import Config.
    try {
        const decrypted = safeStorage.decryptString(encrypted);
        const backupPath = path.join(backupDir, `forge-config-${stamp}.json`);
        fs.writeFileSync(backupPath, decrypted, "utf8");
    } catch {
        // Fallback to encrypted blob if decryption fails.
        const backupPath = path.join(backupDir, `forge-config-${stamp}.bin`);
        fs.writeFileSync(backupPath, encrypted);
    }

    const backups = fs.readdirSync(backupDir)
        .filter((name) => name.startsWith("forge-config-") && (name.endsWith(".json") || name.endsWith(".bin")))
        .map((name) => {
            const fullPath = path.join(backupDir, name);
            const stat = fs.statSync(fullPath);
            return { fullPath, mtimeMs: stat.mtimeMs };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);

    backups.slice(CONFIG_BACKUP_LIMIT).forEach((entry) => {
        try {
            fs.unlinkSync(entry.fullPath);
        } catch {
            // Ignore cleanup failures.
        }
    });
}

function getWindowStatePath() {
    return path.join(app.getPath("userData"), "window-state.json");
}

function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function rectsIntersect(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function shouldRestoreWindowPosition(state) {
    if (!isFiniteNumber(state?.x) || !isFiniteNumber(state?.y)) {
        return false;
    }

    const probeRect = {
        x: state.x,
        y: state.y,
        width: Math.max(100, Number(state.width) || DEFAULT_WINDOW_BOUNDS.width),
        height: Math.max(100, Number(state.height) || DEFAULT_WINDOW_BOUNDS.height)
    };

    return screen.getAllDisplays().some((display) => rectsIntersect(probeRect, display.workArea));
}

function readWindowState() {
    const statePath = getWindowStatePath();
    if (!fs.existsSync(statePath)) {
        return null;
    }

    try {
        const raw = fs.readFileSync(statePath, "utf8");
        const parsed = JSON.parse(raw);
        const width = Math.max(DEFAULT_WINDOW_BOUNDS.minWidth, Number(parsed.width) || DEFAULT_WINDOW_BOUNDS.width);
        const height = Math.max(DEFAULT_WINDOW_BOUNDS.minHeight, Number(parsed.height) || DEFAULT_WINDOW_BOUNDS.height);
        return {
            width,
            height,
            x: isFiniteNumber(parsed.x) ? parsed.x : undefined,
            y: isFiniteNumber(parsed.y) ? parsed.y : undefined,
            maximized: parsed.maximized === true
        };
    } catch {
        return null;
    }
}

function saveWindowState() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    try {
        const maximized = mainWindow.isMaximized();
        const bounds = maximized ? mainWindow.getNormalBounds() : mainWindow.getBounds();
        const state = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            maximized
        };
        fs.writeFileSync(getWindowStatePath(), JSON.stringify(state), "utf8");
    } catch {
        // Ignore persistence failures and continue.
    }
}

function configureAppCachePaths() {
    const userDataPath = app.getPath("userData");
    const cachePath = path.join(userDataPath, "Cache");
    const sessionPath = path.join(userDataPath, "SessionData");

    fs.mkdirSync(cachePath, { recursive: true });
    fs.mkdirSync(sessionPath, { recursive: true });

    app.setPath("cache", cachePath);
    app.setPath("sessionData", sessionPath);
}

// Prevent Chromium from attempting GPU shader disk cache in restricted locations.
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
configureAppCachePaths();

function createMainWindow() {
    const windowState = readWindowState();
    const browserWindowOptions = {
        width: windowState?.width || DEFAULT_WINDOW_BOUNDS.width,
        height: windowState?.height || DEFAULT_WINDOW_BOUNDS.height,
        minWidth: DEFAULT_WINDOW_BOUNDS.minWidth,
        minHeight: DEFAULT_WINDOW_BOUNDS.minHeight,
        resizable: true,
        frame: false,
        titleBarStyle: "hidden",
        backgroundColor: "#0a1a2d",
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
            scrollBounce: false
        }
    };

    if (windowState && shouldRestoreWindowPosition(windowState)) {
        browserWindowOptions.x = windowState.x;
        browserWindowOptions.y = windowState.y;
    }

    mainWindow = new BrowserWindow({
        ...browserWindowOptions
    });

    if (windowState?.maximized) {
        mainWindow.maximize();
    }

    mainWindow.loadFile("index.html");

    mainWindow.on("resize", saveWindowState);
    mainWindow.on("move", saveWindowState);

    mainWindow.on("close", (event) => {
        if (closeToTray && tray && !isQuitting) {
            event.preventDefault();
            mainWindow.hide();

            if (!trayNoticeShown && typeof tray.displayBalloon === "function") {
                tray.displayBalloon({
                    iconType: "info",
                    title: "Forge is still running",
                    content: "Forge was minimized to system tray. Click the tray icon to reopen."
                });
                trayNoticeShown = true;
            }
            return;
        }

        saveWindowState();
    });
}

function showMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        createMainWindow();
        return;
    }

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }

    mainWindow.show();
    mainWindow.focus();
}

function createTray() {
    const iconPath = path.join(__dirname, "assets", "icon.ico");
    if (!fs.existsSync(iconPath)) {
        return;
    }

    tray = new Tray(iconPath);
    tray.setToolTip("Forge");
    tray.setContextMenu(Menu.buildFromTemplate([
        {
            label: "Open Forge",
            click: () => showMainWindow()
        },
        {
            type: "separator"
        },
        {
            label: "Exit",
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]));

    tray.on("click", () => showMainWindow());
}

function getDialogSelectionPath(result) {
    if (!result || result.canceled || !Array.isArray(result.filePaths) || !result.filePaths.length) {
        return "";
    }
    return result.filePaths[0];
}

function registerGlobalHotkey(accelerator) {
    const normalized = String(accelerator || "").trim();

    if (registeredHotkey) {
        globalShortcut.unregister(registeredHotkey);
        registeredHotkey = "";
    }

    if (!normalized) {
        return { ok: true, hotkey: "" };
    }

    try {
        const success = globalShortcut.register(normalized, () => {
            showMainWindow();
        });

        if (!success) {
            return { ok: false, error: "Hotkey is unavailable or already in use." };
        }

        registeredHotkey = normalized;
        return { ok: true, hotkey: normalized };
    } catch {
        return { ok: false, error: "Invalid hotkey format." };
    }
}

function parseLaunchArgs(rawArgs) {
    const input = String(rawArgs || "").trim();
    if (!input) {
        return [];
    }

    const args = [];
    let current = "";
    let activeQuote = "";

    for (let i = 0; i < input.length; i += 1) {
        const char = input[i];
        const next = input[i + 1];

        if (activeQuote) {
            if (char === "\\" && (next === activeQuote || next === "\\")) {
                current += next;
                i += 1;
                continue;
            }

            if (char === activeQuote) {
                activeQuote = "";
                continue;
            }

            current += char;
            continue;
        }

        if (char === '"' || char === "'") {
            activeQuote = char;
            continue;
        }

        if (/\s/.test(char)) {
            if (current) {
                args.push(current);
                current = "";
            }
            continue;
        }

        current += char;
    }

    if (current) {
        args.push(current);
    }

    return args;
}

async function launchLocalTarget(target) {
    const validation = validateLocalTargetPath(target.path);
    if (!validation.ok) {
        return validation;
    }

    const args = parseLaunchArgs(target.args);
    const extension = validation.kind === "file" ? path.extname(validation.path).toLowerCase() : "";
    const spawnOptions = {
        detached: true,
        stdio: "ignore",
        windowsHide: true
    };

    function spawnDetached(command, commandArgs) {
        const child = spawn(command, commandArgs, spawnOptions);
        child.on("error", (error) => {
            console.error("Failed to launch local target:", error);
        });
        child.unref();
    }

    async function openPathChecked(localPath, label) {
        const openError = await shell.openPath(localPath);
        if (openError) {
            return { ok: false, error: `Forge could not open that ${label}: ${openError}` };
        }
        return { ok: true, kind: validation.kind, path: localPath };
    }

    function resolveAutoHotkeyExecutable() {
        const candidates = [];
        const programFiles = process.env.ProgramFiles;
        const programFilesX86 = process.env["ProgramFiles(x86)"];
        const localAppData = process.env.LOCALAPPDATA;

        if (programFiles) {
            candidates.push(path.join(programFiles, "AutoHotkey", "AutoHotkey.exe"));
            candidates.push(path.join(programFiles, "AutoHotkey", "v2", "AutoHotkey64.exe"));
            candidates.push(path.join(programFiles, "AutoHotkey", "v2", "AutoHotkey.exe"));
        }

        if (programFilesX86) {
            candidates.push(path.join(programFilesX86, "AutoHotkey", "AutoHotkey.exe"));
            candidates.push(path.join(programFilesX86, "AutoHotkey", "v2", "AutoHotkeyU64.exe"));
            candidates.push(path.join(programFilesX86, "AutoHotkey", "v2", "AutoHotkey.exe"));
        }

        if (localAppData) {
            candidates.push(path.join(localAppData, "Programs", "AutoHotkey", "AutoHotkey.exe"));
            candidates.push(path.join(localAppData, "Programs", "AutoHotkey", "v2", "AutoHotkey64.exe"));
            candidates.push(path.join(localAppData, "Programs", "AutoHotkey", "v2", "AutoHotkey.exe"));
        }

        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }

        try {
            const whereResult = spawnSync("where.exe", ["AutoHotkey.exe"], { encoding: "utf8", windowsHide: true });
            if (whereResult.status === 0 && whereResult.stdout) {
                const first = whereResult.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
                if (first && fs.existsSync(first)) {
                    return first;
                }
            }
        } catch {
            // Ignore lookup failures and fall through.
        }

        return "";
    }

    if (validation.kind === "directory") {
        return openPathChecked(validation.path, "folder");
    }

    if (extension === ".ps1") {
        try {
            spawnDetached("powershell.exe", ["-ExecutionPolicy", "Bypass", "-File", validation.path, ...args]);
            return { ok: true, kind: validation.kind, path: validation.path };
        } catch {
            return { ok: false, error: "Forge could not launch that PowerShell script." };
        }
    }

    if (extension === ".bat" || extension === ".cmd") {
        try {
            spawnDetached("cmd.exe", ["/d", "/s", "/c", `"${validation.path}"`, ...args]);
            return { ok: true, kind: validation.kind, path: validation.path };
        } catch {
            return { ok: false, error: "Forge could not launch that batch file." };
        }
    }

    if (extension === ".lnk") {
        return openPathChecked(validation.path, "shortcut");
    }

    if (extension === ".ahk") {
        const ahkExecutable = resolveAutoHotkeyExecutable();
        if (!ahkExecutable) {
            return {
                ok: false,
                error: "AutoHotkey executable was not found. Install AutoHotkey or re-associate .ahk files."
            };
        }

        try {
            spawnDetached(ahkExecutable, [validation.path, ...args]);
            return { ok: true, kind: validation.kind, path: validation.path };
        } catch {
            return { ok: false, error: "Forge could not launch that AutoHotkey script." };
        }
    }

    if (!args.length) {
        const label = extension === ".exe"
            ? "application"
            : extension === ".lnk"
                ? "shortcut"
                : "file";
        return openPathChecked(validation.path, label);
    }

    try {
        spawnDetached(validation.path, args);
        return { ok: true, kind: validation.kind, path: validation.path };
    } catch {
        return { ok: false, error: "Forge could not launch that local file." };
    }
}

function validateLocalTargetPath(targetPath) {
    const value = String(targetPath || "").trim();
    if (!value) {
        return { ok: false, error: "A full file or folder path is required for local apps." };
    }

    if (!path.isAbsolute(value)) {
        return { ok: false, error: "Use a full absolute file or folder path for local apps, not a relative path." };
    }

    const normalized = path.normalize(value);
    if (!fs.existsSync(normalized)) {
        return { ok: false, error: "That local path does not exist. Use Browse or enter a valid existing file or folder." };
    }

    try {
        const stats = fs.statSync(normalized);
        if (stats.isDirectory()) {
            return { ok: true, kind: "directory", path: normalized };
        }

        if (stats.isFile()) {
            return { ok: true, kind: "file", path: normalized };
        }
    } catch {
        return { ok: false, error: "Forge could not read that local path." };
    }

    return { ok: false, error: "Local targets must point to an existing file or folder." };
}

app.whenReady().then(() => {
    createMainWindow();
    createTray();

    ipcMain.handle("window:minimize", () => {
        mainWindow?.minimize();
    });

    ipcMain.handle("window:maximize", () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });

    ipcMain.handle("window:close", () => {
        mainWindow?.close();
    });

    ipcMain.handle("window:setCloseToTray", (_event, enabled) => {
        closeToTray = Boolean(enabled);
    });

    ipcMain.handle("app:getStartupOnBoot", () => {
        return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle("app:setStartupOnBoot", (_event, enabled) => {
        app.setLoginItemSettings({ openAtLogin: Boolean(enabled) });
        return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle("app:setGlobalHotkey", (_event, accelerator) => {
        return registerGlobalHotkey(accelerator);
    });

    ipcMain.handle("app:quit", () => {
        isQuitting = true;
        app.quit();
    });

    ipcMain.handle("target:open", async (_event, target) => {
        if (!target || typeof target !== "object") {
            return { ok: false, error: "Invalid launch target." };
        }

        if (target.type === "web" && target.url) {
            await shell.openExternal(target.url);
            return { ok: true };
        }

        if (target.type === "steam" && (target.id || target.steamId)) {
            const id = target.id || target.steamId;
            await shell.openExternal(`steam://run/${id}`);
            return { ok: true };
        }

        if (target.type === "local") {
            return await launchLocalTarget(target);
        }

        return { ok: false, error: "Unsupported launch target type." };
    });

    ipcMain.handle("target:validateLocalPath", (_event, targetPath) => {
        return validateLocalTargetPath(targetPath);
    });

    ipcMain.handle("target:browseExecutable", async () => {
        if (!mainWindow) {
            return "";
        }

        const result = await dialog.showOpenDialog(mainWindow, {
            title: "Select a local app, script, or shortcut",
            properties: ["openFile"],
            filters: [
                { name: "Applications", extensions: ["exe", "bat", "cmd", "lnk", "ps1"] },
                { name: "All Files", extensions: ["*"] }
            ]
        });

        return getDialogSelectionPath(result);
    });

    ipcMain.handle("target:browseFolder", async () => {
        if (!mainWindow) {
            return "";
        }

        const result = await dialog.showOpenDialog(mainWindow, {
            title: "Select a local folder",
            properties: ["openDirectory"]
        });

        return getDialogSelectionPath(result);
    });

    ipcMain.handle("icon:extract", async (_event, exePath) => {
        if (!exePath || typeof exePath !== "string") {
            return null;
        }

        const normalizedPath = path.normalize(exePath);
        if (!fs.existsSync(normalizedPath)) {
            return null;
        }

        try {
            const stats = fs.statSync(normalizedPath);
            if (!stats.isFile() || !normalizedPath.toLowerCase().endsWith(".exe")) {
                return null;
            }

            // Use PowerShell to extract the icon and convert to base64
            const tempDir = path.join(app.getPath("temp"), "forge-icon-extraction");
            fs.mkdirSync(tempDir, { recursive: true });

            const tempIconPath = path.join(tempDir, `icon-${Date.now()}.png`);

            const psScript = `
                Add-Type -AssemblyName System.Drawing
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${normalizedPath.replace(/\\/g, '\\\\')}')
                $bitmap = $icon.ToBitmap()
                $bitmap.Save('${tempIconPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
                $bitmap.Dispose()
                $icon.Dispose()
            `;

            await new Promise((resolve, reject) => {
                const ps = spawn("powershell.exe", ["-Command", psScript]);
                ps.on("close", (code) => code === 0 ? resolve() : reject(new Error(`PowerShell exited with code ${code}`)));
                ps.on("error", reject);
            });

            if (!fs.existsSync(tempIconPath)) {
                return null;
            }

            const iconBuffer = fs.readFileSync(tempIconPath);
            fs.unlinkSync(tempIconPath);

            const base64 = iconBuffer.toString("base64");
            return `data:image/png;base64,${base64}`;
        } catch (error) {
            console.error("Icon extraction error:", error);
            return null;
        }
    });

    ipcMain.handle("hotkey:register", (_event, appData) => {
        if (!appData || !appData.hotkey) {
            return { success: false, error: "Invalid app data" };
        }

        const hotkey = appData.hotkey.trim();
        if (!hotkey) {
            return { success: false, error: "Empty hotkey" };
        }

        try {
            // Register the hotkey
            const registered = globalShortcut.register(hotkey, () => {
                if (mainWindow) {
                    mainWindow.webContents.send("launch-app-by-hotkey", appData);
                }
            });

            if (registered) {
                registeredAppHotkeys.set(hotkey, appData);
                console.log(`Hotkey registered: ${hotkey} -> ${appData.name}`);
                return { success: true };
            } else {
                return { success: false, error: "Hotkey registration failed (may be in use by system)" };
            }
        } catch (error) {
            console.error("Hotkey registration error:", error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle("hotkey:unregister", (_event, hotkey) => {
        if (!hotkey) {
            return { success: false };
        }

        try {
            globalShortcut.unregister(hotkey);
            registeredAppHotkeys.delete(hotkey);
            console.log(`Hotkey unregistered: ${hotkey}`);
            return { success: true };
        } catch (error) {
            console.error("Hotkey unregister error:", error);
            return { success: false };
        }
    });

    ipcMain.handle("config:load", () => {
        if (!safeStorage.isEncryptionAvailable()) {
            return null;
        }

        const configPath = getConfigPath();
        if (!fs.existsSync(configPath)) {
            return null;
        }

        try {
            const encrypted = fs.readFileSync(configPath);
            return safeStorage.decryptString(encrypted);
        } catch {
            return null;
        }
    });

    ipcMain.handle("config:save", (_event, jsonString) => {
        if (!safeStorage.isEncryptionAvailable()) {
            return false;
        }

        try {
            const configPath = getConfigPath();
            if (fs.existsSync(configPath)) {
                try {
                    const currentEncrypted = fs.readFileSync(configPath);
                    const currentJson = safeStorage.decryptString(currentEncrypted);
                    if (currentJson === jsonString) {
                        return true;
                    }
                } catch {
                    // If we cannot compare current content, continue with backup+write.
                }

                createConfigBackup();
            }

            const encrypted = safeStorage.encryptString(jsonString);
            fs.writeFileSync(configPath, encrypted);
            return true;
        } catch {
            return false;
        }
    });

    ipcMain.handle("config:listBackups", () => {
        const backupDir = getConfigBackupDirPath();
        if (!fs.existsSync(backupDir)) {
            return [];
        }

        const entries = fs.readdirSync(backupDir)
            .filter((name) => name.startsWith("forge-config-") && (name.endsWith(".json") || name.endsWith(".bin")))
            .map((name) => {
                const fullPath = path.join(backupDir, name);
                const stat = fs.statSync(fullPath);
                return { name, sizeBytes: stat.size, mtimeMs: stat.mtimeMs };
            })
            .sort((a, b) => b.mtimeMs - a.mtimeMs);

        return entries.map(({ name, sizeBytes, mtimeMs }) => {
            const date = new Date(mtimeMs);
            const label = date.toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric",
                hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
            });
            const sizeKb = (sizeBytes / 1024).toFixed(1);
            return { name, label, sizeKb };
        });
    });

    ipcMain.handle("config:loadBackup", (_event, filename) => {
        // Validate filename to prevent path traversal attacks.
        if (!/^forge-config-\d{8}-\d{6}\.(json|bin)$/.test(filename)) {
            return null;
        }

        const backupDir = getConfigBackupDirPath();
        const fullPath = path.join(backupDir, filename);
        if (!fs.existsSync(fullPath)) {
            return null;
        }

        if (filename.endsWith(".json")) {
            return fs.readFileSync(fullPath, "utf8");
        }

        // .bin fallback: decrypt encrypted backup.
        try {
            const encrypted = fs.readFileSync(fullPath);
            return safeStorage.decryptString(encrypted);
        } catch {
            return null;
        }
    });

    ipcMain.handle("config:export", async (_event, jsonString) => {
        if (!mainWindow) {
            return false;
        }

        const result = await dialog.showSaveDialog(mainWindow, {
            title: "Export Launcher Config",
            defaultPath: "forge-config.json",
            filters: [{ name: "JSON", extensions: ["json"] }]
        });

        if (result.canceled || !result.filePath) {
            return false;
        }

        fs.writeFileSync(result.filePath, jsonString, "utf8");
        return true;
    });

    ipcMain.handle("config:import", async () => {
        if (!mainWindow) {
            return null;
        }

        const result = await dialog.showOpenDialog(mainWindow, {
            title: "Import Launcher Config",
            properties: ["openFile"],
            filters: [{ name: "JSON", extensions: ["json"] }]
        });

        if (result.canceled || !result.filePaths.length) {
            return null;
        }

        return fs.readFileSync(result.filePaths[0], "utf8");
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        } else {
            showMainWindow();
        }
    });
});

app.on("before-quit", () => {
    isQuitting = true;
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
