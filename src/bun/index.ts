import { BrowserWindow, BrowserView } from "electrobun/bun";
import { type RPCSchema } from "electrobun/bun";
import * as bioParsers from "bio-parsers";
import fs from "fs";

// Define Schema (simplified, we just need the handlers to match)
const rpc = BrowserView.defineRPC({
  handlers: {
    requests: {
      ove_saveFile: async ({ filePath, sequenceDataToSave, isSaveAs }) => {
        console.log("RPC: ove_saveFile", filePath);
        try {
          let content;
          if (filePath.endsWith(".json")) {
            content = JSON.stringify(sequenceDataToSave, null, 2);
          } else if (filePath.endsWith(".fasta")) {
            content = bioParsers.jsonToFasta(sequenceDataToSave);
          } else if (filePath.endsWith(".bed")) {
            content = bioParsers.jsonToBed(sequenceDataToSave);
          } else {
            // Default to genbank
            content = bioParsers.jsonToGenbank(sequenceDataToSave);
          }

          await Bun.write(filePath, content);
          return { success: true };
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      ove_showSaveDialog: async (opts) => {
        console.log("RPC: ove_showSaveDialog", opts);
        // Mock implementation since native dialogs aren't exposed yet
        // In a real app we'd use osascript or a native module
        const filename = opts.defaultPath
          ? opts.defaultPath.split("/").pop()
          : "sequence.gb";
        // Just return a dummy path in the current directory for now to verify functionality
        return `${process.cwd()}/${filename}`;
      },
    },
    messages: {
      log: (msg) => console.log("Renderer Log:", msg),
    },
  },
});

const mainWindow = new BrowserWindow({
  title: "Open Vector Editor",
  url: "views://mainview/index.html",
  frame: {
    width: 1000,
    height: 800,
    x: 100,
    y: 100,
  },
  rpc: rpc,
});

// Load initial file if provided
const args = process.argv.slice(2);
if (args.length > 0) {
  const filePath = args[0];
  console.log("Loading initial file:", filePath);
  // Logic to read file and send to renderer
  // We can do this once the webview is ready.
  // Since we don't have a robust 'dom-ready' exposed easily on window maybe?
  // We'll rely on the renderer asking for it?
  // Or we use executeJavascript after a delay.
}
