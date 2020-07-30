const { Menu } = require("electron");

const { dialog } = require("electron");

const { BrowserWindow } = require("electron");

const isMac = process.platform === "darwin";

module.exports = function createMenu({ createWindow, getSeqJsonFromPath }) {
  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: "OVE",
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideothers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: [
        {
          label: "New File",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            createWindow({
              initialSeqJson: undefined,
            });
          },
        },
        {
          label: "Open",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog({
              filters: [
                { name: "Sequence Files", extensions: ["gb", "gbk", "fasta"] },
              ],
              properties: ["openFile", "multiSelections"],
            });

            filePaths.forEach(async (p) => {
              let browserWindow = BrowserWindow.getFocusedWindow();
              // if (browserWindow) {
              //   browserWindow.close();
              //   browserWindow = null;
              // }

              const initialSeqJson = await getSeqJsonFromPath(p);
              createWindow({
                initialSeqJson,
              }, browserWindow);
            });
          },
        },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        // { role: 'undo' },
        // { role: 'redo' },
        // { type: 'separator' },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        // ...(isMac ? [
        //   { role: 'pasteAndMatchStyle' },
        //   { role: 'delete' },
        //   { role: 'selectAll' },
        //   { type: 'separator' },
        //   {
        //     label: 'Speech',
        //     submenu: [
        //       { role: 'startspeaking' },
        //       { role: 'stopspeaking' }
        //     ]
        //   }
        // ] : [
        //   { role: 'delete' },
        //   { type: 'separator' },
        //   { role: 'selectAll' }
        // ])
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
  ];

  // const menu = Menu.buildFromTemplate([
  //   {label: "a", click: }
  // ])
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
