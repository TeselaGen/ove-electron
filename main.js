/* eslint-disable no-console*/
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bioParsers = require("bio-parsers");
const fs = require("fs");
const createMenu = require("./src/main_utils/menu");
const windowStateKeeper = require("electron-window-state");
const { autoUpdater } = require("electron-updater");

// ************************************************************************
// this function is super handy for debugging what is happening
// in the main process from the renderer process !!
// you'll need to comment it in in renderer.js file

// console.stdlog = console.log.bind(console);
// console.logs = [];
// console.log = function() {
//   console.logs.push(Array.from(arguments));
//   console.stdlog.apply(console, arguments);
// };
// ************************************************************************

let isAppReady = false;
let isMacOpenTriggered = false;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windows = [];
let startupWindowVars = {};
createMenu({ windows, createWindow, getSeqJsonFromPath });

function getSeqJsonFromPath(_filePath) {
  console.log(`process.argv[1]:`,process.argv[1])
  let filePath = _filePath || process.argv[1];
  if (filePath === ".") return;
  const data = fs.readFileSync(path.resolve(filePath), "utf-8");
  //open, read, handle file
  if (!data) return;
  const fileName = filePath.replace(/^.*[\\/]/, "");
  return bioParsers.anyToJson(data, { fileName }).then(res => {
    return res[0].parsedSequence;
  });
}

function waitTillAppReady() {
  return new Promise((resolve, reject) => {
    const waitTillReadyInterval = setInterval(() => {
      if (isAppReady) {
        resolve();
        clearInterval(waitTillReadyInterval);
      }
    }, 100);
  });
}

async function createWindow(windowVars) {
  console.log(`createWindowHit`)
  await waitTillAppReady();
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
    show: false,
    webPreferences: {
      // nodeIntegration: true, //we don't want to enable this because it is a security risk and slows down the app
      preload: path.join(__dirname, "src/preload.js")
    }
  });
  console.log(`newWindow being created`);
  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });
  const interval1 = setInterval(() => {
    if (!newWindow) {
      return clearInterval(interval1);
    }
    newWindow.logs = console.logs;
  }, 100);

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

// let macOpenFilePaths: [];
// let runningTimeout = null;
// app.on("open-file", async (event, path) => {
//   event.preventDefault();

//   // Keep in array because more might come!
//   macOpenFilePaths.push(path);

//   // Clear previous handler if any
//   if (runningTimeout !== null) {
//     clearTimeout(runningTimeout);
//     runningTimeout = null;
//   }

//   // Handle paths delayed in case more are coming!
//   runningTimeout = setTimeout(async () => {
//     if (this.windowsMainService) {
//       try {
//         const initialSeqJson = await getSeqJsonFromPath(path);
//         createWindow({ initialSeqJson });
//         // startupWindowVars.initialSeqJson = initialSeqJson;
//       } catch (e) {
//         console.error(`e73562891230:`, e);
//       }

//       macOpenFileURIs = [];
//       runningTimeout = null;
//     }
//   }, 100);
// });

app.on("open-file", async (event, path) => {
  isMacOpenTriggered = true;
  //mac only
  console.log(`open-file:`, path);
  event.preventDefault();
  try {
    console.log("trying to open gb file")
    const initialSeqJson = await getSeqJsonFromPath(path);
    createWindow({ initialSeqJson, filePath: path });
  } catch (e) {
    console.error(`e73562891230:`, e);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  console.log(`onReady`);
  autoUpdater.checkForUpdatesAndNotify();
  isAppReady = true;
  if (!windows.length && !isMacOpenTriggered) {
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
  if (!windows.length) {
    console.log(`onActivate`);
    createWindow();
  }
});

function sendStatusToWindow(type, message) {
  let browserWindows = BrowserWindow.getAllWindows();
  browserWindows &&
    browserWindows.forEach(win => win.webContents.send(type, message));
}
autoUpdater.on("update-available", () => {
  sendStatusToWindow("update_available");
});
autoUpdater.on("update-downloaded", () => {
  sendStatusToWindow("update-downloaded");
});
autoUpdater.on("checking-for-update", () => {
  sendStatusToWindow("checking-for-update");
});
// autoUpdater.on("update-not-available", info => {
//   sendStatusToWindow("update-not-available");
// });
autoUpdater.on("error", err => {
  sendStatusToWindow("error", err);
});
autoUpdater.on("download-progress", progressObj => {
  let log_message =
    "Download in progress: " + Math.round(progressObj.percent) + "%";
  sendStatusToWindow("download-progress", log_message);
});

ipcMain.on("restart_app", () => {
  setImmediate(() => {
    autoUpdater.quitAndInstall();
  });
});

ipcMain.on("ove_onSave", (event, opts) => {
  const { formattedSeqString, filePath } = opts;
  fs.writeFileSync(filePath, formattedSeqString);
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
