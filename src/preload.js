const {jsonToGenbank} = require("bio-parsers");
const { dialog } = require('electron')
const { ipcRenderer } = require("electron");
const remote = require("@electron/remote");

const currentWindow = remote.getCurrentWindow();
console.log(`currentWindow:`,currentWindow)
Object.assign(window, {
  currentWindow,
  ipcRenderer,
  jsonToGenbank,
  dialog
});