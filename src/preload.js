const electron = require("electron");
const {jsonToGenbank} = require("bio-parsers");
const { dialog } = require('electron').remote

const currentWindow = electron.remote.getCurrentWindow();
const { ipcRenderer } = require("electron");
Object.assign(window, {
  currentWindow,
  ipcRenderer,
  jsonToGenbank,
  dialog
});