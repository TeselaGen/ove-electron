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

# Releasing 
1. Bump the package.json version number
2. Commit your changes
3. Build windows and mac 
```
yarn deploy
```
wait for it to finish

4. Go to https://github.com/tnrich/ove-electron/releases 
5. Edit the most recently pushed release to publish it

How auto-updating works :
https://medium.com/@johndyer24/creating-and-deploying-an-auto-updating-electron-app-for-mac-and-windows-using-electron-builder-6a3982c0cee6
