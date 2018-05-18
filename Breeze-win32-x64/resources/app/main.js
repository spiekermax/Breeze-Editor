const electron = require('electron');
const url = require('url');
const path = require('path');

const ipc = electron.ipcMain;
const app = electron.app;
const {BrowserWindow} = require('electron');

/* OnAppReady */
app.on('ready', function()
{
    /* Main window creation */
    var mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        title: "Breeze Editor",
    });
    /* OnDocumentReady */
    mainWindow.webContents.on('did-finish-load', function(){
        mainWindow.show();
        mainWindow.focus();
    });
    /* OnWindowClosed */
    mainWindow.on('closed', function(){
        mainWindow = null;
    });

    /* Load window content */
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'renderer/renderer.html'),
      protocol: 'file:',
      slashes: true 
    }));

});

/* OnAppTerminate */
app.on('window-all-closed', function(){
    if(process.platform != 'darwin'){
        app.quit();
    }
})

/* Inter-process communication */
ipc.on('editorValue', function (event, arg) {
  console.log(arg);
})