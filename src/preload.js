const electron = require("electron");

const currentWindow = electron.remote.getCurrentWindow();
const { ipcRenderer } = require("electron");
Object.assign(window, {
  currentWindow,
  ipcRenderer
});
