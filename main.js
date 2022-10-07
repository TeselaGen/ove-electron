/* eslint-disable no-console*/
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const bioParsers = require("bio-parsers");
const fs = require("fs");
const createMenu = require("./src/main_utils/menu");
const windowStateKeeper = require("electron-window-state");
const { autoUpdater } = require("electron-updater");

let isAppReady = false;
let isMacOpenTriggered = false;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
const windows = [];
createMenu({ windows, createWindow, getSeqJsonFromPath });

async function getSeqJsonFromPath(_filePath) {
  const filePath = _filePath || process.argv[1];
  // const filePath = _filePath || process.argv[2] || process.argv[1];
  if (filePath === ".") return;
  const data = fs.readFileSync(path.resolve(filePath));
  //open, read, handle file
  if (!data) return;
  const fileName = filePath.replace(/^.*[\\/]/, "");
  try {
    if (fileName.endsWith(".json") && (data.sequence || data.proteinSequence)) {
      return data;
    }
    const res = await bioParsers.anyToJson(data, { fileName });
    return res[0].parsedSequence;
  } catch (error) {
    console.error(`error:`, error);
    return {};
  }
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

async function createWindow({ initialSeqJson, filePath, windowToUse } = {}) {
  await waitTillAppReady();
  //if no windowVars are passed then we should
  // Create the browser window.

  if (filePath) {
    let alreadyOpen = false;
    windows.forEach((w) => {
      if (w.__filePath === filePath) {
        w.bw.show();
        alreadyOpen = true;
      }
    });
    if (alreadyOpen) {
      return;
    }
  }
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
  });

  let newWindow =
    windowToUse ||
    new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      show: false,
      webPreferences: {
        contextIsolation: true,
        // nodeIntegration: true, //we don't want to enable this because it is a security risk and slows down the app
        preload: path.join(__dirname, "src/preload.js"),
      },
    });

  newWindow.once("ready-to-show", () => {
    newWindow.show();
  });

  // Let us register listeners on the window, so we can update the state
  // automatically (the listeners will be removed when the window is closed)
  // and restore the maximized or full screen state
  mainWindowState.manage(newWindow);

  !windowToUse &&
    windows.push({
      bw: newWindow,
      //set a __filePath property so we can reference this if a user tries to open the same file multiple times
      __filePath: filePath,
    });
console.log(`initialSeqJson:`,initialSeqJson)
  newWindow.loadFile("index.html", {
    query: { initialSeqJson: JSON.stringify(initialSeqJson), filePath },
  });

  // Open the DevTools.
  // newWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  newWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    let indexToSplice;
    windows.forEach((w, i) => {
      if (w.bw === newWindow) {
        indexToSplice = i;
      }
    });
    windows.splice(indexToSplice, 1);
    newWindow = null;
  });
}

app.on("open-file", async (event, path) => {
  isMacOpenTriggered = true;
  //mac only
  event.preventDefault();
  console.log(`open-file`)
  try {
    console.log("trying to open gb file");
    const initialSeqJson = await getSeqJsonFromPath(path);
    createWindow({ filePath: path, initialSeqJson });
  } catch (e) {
    console.error(`e73562891230:`, e);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  console.info(`App Starting Up`);
  autoUpdater.checkForUpdatesAndNotify();
  isAppReady = true;
  if (!windows.length && !isMacOpenTriggered) {
    let initialSeqJson;
    if ( process.argv.length >= 2) {
      initialSeqJson = await getSeqJsonFromPath();
    }
    createWindow({ filePath: path, initialSeqJson });
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!windows.length) {
    console.log(`onActivate`);
    createWindow();
  }
});

// ipcMain.on("restart_app", () => {
//   setImmediate(() => {
//     autoUpdater.quitAndInstall();
//   });
// });

/*  HANDLE THE API CALLS FROM THE RENDERER PROCESS  */

ipcMain.handle(
  "ove_saveFile",
  (event, { sequenceDataToSave, filePath, isSaveAs }) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);

    const ext = path.extname(filePath);

    let formattedSeqString;
    if (ext === ".fasta") {
      formattedSeqString = bioParsers.jsonToFasta(sequenceDataToSave);
    } else if (ext === ".bed") {
      formattedSeqString = bioParsers.jsonToBed(sequenceDataToSave);
    } else if (ext === ".json") {
      formattedSeqString = JSON.stringify(sequenceDataToSave, null, 2);
    } else {
      formattedSeqString = bioParsers.jsonToGenbank(sequenceDataToSave);
    }
    fs.writeFileSync(filePath, formattedSeqString);
    !isSaveAs &&
      windows.forEach((w) => {
        if (w.bw === browserWindow) {
          //update the __filePath prop we're saving on the window to prevent opening the same file twice
          w.__filePath = filePath;
        }
      });
  }
);

ipcMain.handle("ove_showSaveDialog", async (event, opts) => {
  return dialog.showSaveDialogSync(
    BrowserWindow.fromWebContents(event.sender),
    opts
  );
});

/*  **************************************************  */
