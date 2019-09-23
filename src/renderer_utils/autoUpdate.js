const notification = document.getElementById("notification");
const message = document.getElementById("message");
const restartButton = document.getElementById("restart-button");
window.ipcRenderer.on("checking-for-update", () => {
  window.ipcRenderer.removeAllListeners("checking-for-update");
  message.innerText = "Checking for updates...";
  notification.classList.remove("hidden");
});
// window.ipcRenderer.on("update-not-available", () => {
//   window.ipcRenderer.removeAllListeners("update-not-available");
//   message.innerText = "No updates available";
//   notification.classList.remove("hidden");
//   setTimeout(() => {
//     notification.classList.add("hidden");
//   }, 2000);
// });
window.ipcRenderer.on("download-progress", (e, text) => {
  message.innerText = text;
  notification.classList.remove("hidden"); //tnrtodo comment this out
});
window.ipcRenderer.on("error", (e, text) => {
  window.ipcRenderer.removeAllListeners("error");
  message.innerText = "Error updating: " + text;
});
window.ipcRenderer.on("update_available", () => {
  window.ipcRenderer.removeAllListeners("update_available");
  message.innerText = "A new update is available. Downloading now...";
  notification.classList.remove("hidden");
});
window.ipcRenderer.on("update_downloaded", () => {
  window.ipcRenderer.removeAllListeners("update_downloaded");
  message.innerText =
    "Update Downloaded. It will be installed on restart. Restart now?";
  restartButton.classList.remove("hidden");
  notification.classList.remove("hidden");
});

window.closeNotification = function closeNotification() {
  notification.classList.add("hidden");
};
window.restartApp = function restartApp() {
  window.ipcRenderer.send("restart_app");
};
