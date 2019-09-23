//run once per window initialization
if (window.localStorage.getItem("isDarkMode") === "true") {
  document.body.classList.add("bp3-dark");
}

window.toggleDarkMode = () => {
  if (document.body.classList.contains("bp3-dark")) {
    window.localStorage.setItem("isDarkMode", "false");
    document.body.classList.remove("bp3-dark");
  } else {
    window.localStorage.setItem("isDarkMode", "true");

    document.body.classList.add("bp3-dark");
  }
};
