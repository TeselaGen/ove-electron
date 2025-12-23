import { Electroview } from "electrobun/view";

const rpc = Electroview.defineRPC({
  handlers: {
    requests: {},
    messages: {},
  },
});

console.log("Electroview initialized");

// Bridge Electron API
window.api = {
  send: async (channel, data) => {
    console.log("Bridge send:", channel, data);
    if (channel === "ove_saveFile") {
      return await rpc.request.ove_saveFile(data);
    } else if (channel === "ove_showSaveDialog") {
      return await rpc.request.ove_showSaveDialog(data);
    }
  },
};
