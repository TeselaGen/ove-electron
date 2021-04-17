// tnr: running `yarn test` will run this file. It doesn't do much at the moment because we can't actually interact with the native dialogs..  

const Application = require("spectron").Application;
const assert = require("assert");
const electronPath = require("electron"); // Require Electron from the binaries included in node_modules.
const path = require("path");

describe("Application launch", function () {
  this.timeout(10000);

  const startApp = async () => {
    const app = new Application({
      connectionRetryCount: 1,
      path: electronPath,
      args: [path.join(__dirname, "..")],
    });
    this.app = app;
    await app.start();
    return app;
  };

  afterEach(() => {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it("saving works", async () => {
    const app = await startApp();
    await app.client.getWindowCount().then((count) => {
      assert.equal(count, 1);
      // Please note that getWindowCount() will return 2 if `dev tools` are opened.
      // assert.equal(count, 2)
    });
    const elem = await app.client.$(`//button[contains(.//span, 'File')]`);
    await elem.click();
    await (await app.client.$(`//a[contains(.//div, 'Save')]`)).click();

    //tnr.. spectron doesn't actually support interacting with the dialogs or with menus so this is kind of pointless...
  });
});
