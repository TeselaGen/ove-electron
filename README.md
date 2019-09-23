# ove-electron
This packages the open-vector-editor web app as an electron tool that can be used on windows/mac/linux

# Developing 
```
yarn
yarn start
```

# Releasing 
1. Bump the package.json version number

2. Build windows and mac 
```
yarn deploy
```
wait for it to finish

3. Go to https://github.com/tnrich/ove-electron/releases 
4. Edit the most recently pushed release to publish it

How auto-updating works :
https://medium.com/@johndyer24/creating-and-deploying-an-auto-updating-electron-app-for-mac-and-windows-using-electron-builder-6a3982c0cee6