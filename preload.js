const { contextBridge, ipcRenderer, webUtils } = require("electron");

const launcherAPI = {
    minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
    maximizeWindow: () => ipcRenderer.invoke("window:maximize"),
    closeWindow: () => ipcRenderer.invoke("window:close"),
    setCloseToTray: (enabled) => ipcRenderer.invoke("window:setCloseToTray", enabled),
    getStartupOnBoot: () => ipcRenderer.invoke("app:getStartupOnBoot"),
    setStartupOnBoot: (enabled) => ipcRenderer.invoke("app:setStartupOnBoot", enabled),
    setGlobalHotkey: (accelerator) => ipcRenderer.invoke("app:setGlobalHotkey", accelerator),
    quitApp: () => ipcRenderer.invoke("app:quit"),
    openTarget: (target) => ipcRenderer.invoke("target:open", target),
    validateLocalPath: (targetPath) => ipcRenderer.invoke("target:validateLocalPath", targetPath),
    browseExecutable: () => ipcRenderer.invoke("target:browseExecutable"),
    browseFolder: () => ipcRenderer.invoke("target:browseFolder"),
    extractIcon: (exePath) => ipcRenderer.invoke("icon:extract", exePath),
    getDroppedFilePath: (file) => {
        try {
            if (!file) {
                return "";
            }
            return webUtils.getPathForFile(file) || "";
        } catch {
            return "";
        }
    },
    registerHotkey: (appData) => ipcRenderer.invoke("hotkey:register", appData),
    unregisterHotkey: (hotkey) => ipcRenderer.invoke("hotkey:unregister", hotkey),
    onLaunchAppByHotkey: (callback) => {
        if (typeof callback !== "function") {
            return () => {};
        }

        const listener = (_event, appData) => callback(appData);
        ipcRenderer.on("launch-app-by-hotkey", listener);
        return () => ipcRenderer.removeListener("launch-app-by-hotkey", listener);
    },
    loadConfig: () => ipcRenderer.invoke("config:load"),
    saveConfig: (json) => ipcRenderer.invoke("config:save", json),
    exportConfig: (json) => ipcRenderer.invoke("config:export", json),
    importConfig: () => ipcRenderer.invoke("config:import"),
    listConfigBackups: () => ipcRenderer.invoke("config:listBackups"),
    loadConfigBackup: (filename) => ipcRenderer.invoke("config:loadBackup", filename)
};

contextBridge.exposeInMainWorld("launcherAPI", launcherAPI);
