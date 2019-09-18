// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");
const path = require("path");
const bioParsers = require("bio-parsers");
const fs = require("fs");
const createMenu = require("./src/utils/menu");
const windowStateKeeper = require("electron-window-state");
let win;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = [];
let startupWindowVars = {};
createMenu({ windows, createWindow, getSeqJsonFromPath });

function getSeqJsonFromPath(_filePath) {
  let filePath = _filePath || process.argv[1];
  if (filePath === ".") return;
  const data = fs.readFileSync(path.resolve(filePath), "utf-8");
  //open, read, handle file
  if (!data) return;
  const fileName = filePath.replace(/^.*[\\\/]/, "");
  return bioParsers.anyToJson(data, { fileName }).then(res => {
    return res[0].parsedSequence;
  });
}

async function createWindow(windowVars) {
  //if no windowVars are passed then we should
  // Create the browser window.
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800
  });

  let newWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,

    webPreferences: {
      // nodeIntegration: true, //we don't want to enable this because it is a security risk and slows down the app
      preload: path.join(__dirname, "src/preload.js")
    }
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(newWindow);

  windows.push(newWindow);

  if (!windowVars && process.platform === "win32") {
    //windows only
    try {
      const initialSeqJson = await getSeqJsonFromPath();

      startupWindowVars.initialSeqJson = initialSeqJson;
    } catch (e) {
      console.error(`e123421231:`, e);
    }
  }
  Object.keys(windowVars || startupWindowVars).forEach(k => {
    newWindow[k] = (windowVars || startupWindowVars)[k];
  });
  // if (process.argv.length >= 2) {

  // } else {
  //   // and load the index.html of the app.
  // }
  newWindow.loadFile("index.html");

  // Open the DevTools.
  // newWindow.webContents.openDevTools()

  // newWindow.

  // Emitted when the window is closed.
  newWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    windows.splice(windows.indexOf(newWindow), 1);
    newWindow = null;
  });
}

app.on("will-finish-launching", () => {
  app.on("open-file", async (event, path) => {
    //mac only
    event.preventDefault();
    try {
      const initialSeqJson = await getSeqJsonFromPath(path);
      createWindow({ initialSeqJson });
      // startupWindowVars.initialSeqJson = initialSeqJson;
    } catch (e) {
      console.error(`e73562891230:`, e);
    }
  });
  // app.on("open-files", async (event, path) => {
  //   //mac only
  //   event.preventDefault();
  //   try {
  //     const initialSeqJson = await getSeqJsonFromPath(path);
  //     startupWindowVars.initialSeqJson = initialSeqJson;
  //   } catch (e) {
  //     console.error(`e73562891230:`, e);
  //   }
  // });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  if (!windows.length) {
    createWindow();
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!windows.length) createWindow();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
