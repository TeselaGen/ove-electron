import { BrowserView } from "electrobun";

export default {
  app: {
    name: "OpenVectorEditor",
    identifier: "com.teselagen.openVectorEditor",
    version: "1.5.5",
  },
  build: {
    views: {
      mainview: {
        entrypoint: "src/renderer_entry.ts",
        external: [],
      },
    },
    copy: {
      "index.html": "views/mainview/index.html",
      "src/style.css": "views/mainview/src/style.css",
      "node_modules/open-vector-editor/umd":
        "views/mainview/node_modules/open-vector-editor/umd",
      "node_modules/ove-auto-annotate/umd/ove-auto-annotate.js":
        "views/mainview/node_modules/ove-auto-annotate/umd/ove-auto-annotate.js",
      "src/renderer.js": "views/mainview/src/renderer.js",
      "src/renderer_utils/darkMode.js":
        "views/mainview/src/renderer_utils/darkMode.js",
    },
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
    },
  },
};
