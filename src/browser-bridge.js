// Bridge to replace Electron's contextBridge
window.api = {
  send: async (channel, data) => {
    if (channel === "ove_saveFile") {
      try {
        const response = await fetch("/api/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          throw new Error("Failed to save file");
        }
        return await response.json();
      } catch (error) {
        console.error("Error saving file:", error);
        throw error;
      }
    } else if (channel === "ove_showSaveDialog") {
      // Mock save dialog by asking user for filename
      // In a real browser app, we might rely on the server to save to the existing path
      // or implement a custom UI.
      // For compatible behavior with existing code:
      const defaultPath = data.defaultPath || "sequence.gb";
      const filename = prompt(
        "Enter filename to save:",
        defaultPath.split("/").pop()
      );
      if (!filename) return null; // Cancelled

      // If we are just saving (not save as), we probably want to keep the full path if we know it.
      // The renderer passes 'defaultPath' which might be the full path.
      // But prompt only gives us the filename usually (unless user types full path).
      // We'll return the input as is.
      // If the user runs this locally, they might type a relative path.
      return filename;
    }
  },
};

// Initial data is injected by the server into window.initialSeqJson and window.filePath
// No need to parse URL params here if we inject it directly.
// But if we stick to URL params for consistency with old preload:
const urlParams = new URLSearchParams(window.location.search);
try {
  const datastring = urlParams.get("initialSeqJson");
  if (datastring) {
    window.initialSeqJson = JSON.parse(datastring);
  }
} catch (error) {
  console.error(`error with initialSeqJson:`, error);
}

try {
  const datastring = urlParams.get("filePath");
  if (datastring) {
    window.filePath = JSON.parse(datastring);
  }
} catch (error) {
  console.error(`error with filePath:`, error);
}
