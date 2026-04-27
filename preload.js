const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("launcherAPI", {
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
    loadConfig: () => ipcRenderer.invoke("config:load"),
    saveConfig: (json) => ipcRenderer.invoke("config:save", json),
    exportConfig: (json) => ipcRenderer.invoke("config:export", json),
    importConfig: () => ipcRenderer.invoke("config:import"),
    listConfigBackups: () => ipcRenderer.invoke("config:listBackups"),
    loadConfigBackup: (filename) => ipcRenderer.invoke("config:loadBackup", filename)
});
