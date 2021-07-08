![image](https://user-images.githubusercontent.com/2730609/67169732-df3ca800-f348-11e9-8003-baa91cd8cfec.png)

# ove-electron

This packages the open-vector-editor web app as an electron tool that can be used on windows/mac/linux

![image](https://user-images.githubusercontent.com/2730609/67169717-c59b6080-f348-11e9-995a-89b7213428ff.png)

# Installation Instructions:

- Go to https://github.com/tnrich/ove-electron/releases and find the latest release for the platform you're on (win/mac/linux)
- mac -- download the DMG file and double click to install it
- windows -- download the .exe file and double click to install it
- linux -- download the .AppImage file and open a terminal. Run:

```
chmod +x Open-Vector-Editor-0.1.5.AppImage
./Open-Vector-Editor-0.1.5.AppImage
```

# Developing

```
yarn
yarn start
```

## To speed up trying out changes from OVE

```
cd open-vector-editor;
yarn link;
cd ove-electron;
yarn link open-vector-editor

<!-- comment in these lines in open-vector-editor nwb.config.js to speed up the build -->
esModules: console.log("commentMeBackOut") || false,
cjs: console.log("commentMeBackOut") || false

cd open-vector-editor;
yarn build; //this will now build only the UMD file that ove-electron uses
```

# Releasing

These environment variables will need to be set in a local .env file:

```
APPLEID=yourstringhere //my apple id
//this needs to be an app-specific password (not just my apple password) https://appleid.apple.com/account/manage
APPLEIDPASS=yourstringhere 
GH_TOKEN=yourstringhere
```

- Bump the package.json version number
- Build windows and mac:
```
yarn deploy
```
wait for it to finish
- Go to https://github.com/tnrich/ove-electron/releases
- Edit the most recently pushed release to publish it
- Keep the blockmap and latest.yml files as they are used by the auto-updater
- Commit changes
- yarn generateChangelog

## Troubleshooting release process

How auto-updating works :
https://medium.com/@johndyer24/creating-and-deploying-an-auto-updating-electron-app-for-mac-and-windows-using-electron-builder-6a3982c0cee6

If apple notarize isn't working, this can help to troubleshoot:
https://stackoverflow.com/questions/58358449/notarizing-electron-apps-throws-you-must-first-sign-the-relevant-contracts-on

If you're seeing an itunes signing in error, maybe the app specific password needs to be updated:
https://david.dev/how-to-notarize-your-electron-app

If you're seeing this error:
The request is missing an Authorization header field containing a valid macaroon
You'll need to re-login to snapcraft.io (credentials under ubuntu.com)

```
snapcraft login
```

# Testing

I've set up a single spectron test under /test
It can be run via `yarn test`
Unfortunately spectron doesn't support interacting with native dialogs so I'd need to mock those to have the tests be at all useful. I should probably do this sometime down the line. (note OVE itself is close to full test coverage https://github.com/TeselaGen/openVectorEditor)


