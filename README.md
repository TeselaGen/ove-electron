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
yarn dist
```
3. Go to https://github.com/tnrich/ove-electron/releases/new
4. Tag, title, describe and upload the .dmg and .exe files and create a new release! 
