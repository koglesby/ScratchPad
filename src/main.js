const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

let filename =
  (process.argv[1] && process.argv[1].split('.').pop() === 'txt') ||
  (process.argv[1] && process.argv[1].split('.').pop() === 'md')
    ? process.argv[1]
    : `${app.getPath('userData')}/content.txt`;

let fileNames = {};

const loadContent = async (loadFile) => {
  return fs.existsSync(loadFile) ? fs.readFileSync(loadFile, 'utf8') : '';
};

const saveContent = async (content) => {
  const focusedId = BrowserWindow.getFocusedWindow().id;

  fs.writeFileSync(fileNames[focusedId], content, 'utf8');
};

ipcMain.on('saveContent', (e, content) => {
  saveContent(content);
});

ipcMain.handle('loadContent', (e) => {
  return loadContent(filename);
});

const createWindow = () => {
  const getFileFromUser = () => {
    dialog
      .showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'Markdown Files', extensions: ['md', 'markdown'] },
        ],
      })
      .then((result) => {
        if (result.filePaths[0]) {
          filename = result.filePaths[0];
          createWindow();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const saveFileFromUser = () => {
    dialog
      .showSaveDialog(mainWindow, {
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'Markdown Files', extensions: ['md', 'markdown'] },
        ],
      })
      .then((result) => {
        const newContent = fs.readFileSync(filename, 'utf8');
        if (result.filePath) {
          filename = result.filePath;
          saveContent(newContent);
        }
        // app.addRecentDocument(filename);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isMac = process.platform === 'darwin';

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        isMac ? { role: 'close' } : { role: 'quit' },
        {
          label: 'Open File',
          accelerator: 'CommandOrControl+O',
          click(item, focusedWindow) {
            getFileFromUser(focusedWindow);
          },
        },
        {
          label: 'Save As',
          accelerator: 'CommandOrControl+S',
          click(item, focusedWindow) {
            saveFileFromUser(focusedWindow);
          },
        },
        {
          label: 'Open Recent',
          role: 'recentdocuments',
          submenu: [
            {
              label: 'Clear Recent',
              role: 'clearrecentdocuments',
            },
          ],
        },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://electronjs.org');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: '#263238',
    show: false,
    title: `Scratchpad - ${filename}`,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    winId = mainWindow.id;
    fileNames[winId] = filename;
    console.log('fileNames : ', fileNames);
    mainWindow.show();
    mainWindow.focus();
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
