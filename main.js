const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");

const isDev = !app.isPackaged;
const PORT = 3000;

let mainWindow;
let nextProcess;

const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
};

const waitForServer = (port, retries = 40) => {
  return new Promise((resolve, reject) => {
    const check = (n) => {
      const client = net.connect(port, "127.0.0.1", () => {
        client.destroy();
        resolve();
      });
      client.on("error", () => {
        if (n <= 0) return reject(new Error("Server did not start"));
        setTimeout(() => check(n - 1), 500);
      });
    };
    check(retries);
  });
};

const startNextServer = () => {
  const appPath = isDev ? __dirname : path.join(process.resourcesPath, "app");

  const nextScript = path.join(
    appPath,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const nodePath = path.join(path.dirname(process.execPath), "node.exe");

  nextProcess = spawn(nodePath, [nextScript, "start", "-p", String(PORT)], {
    cwd: appPath,
    stdio: "pipe",
    windowsHide: true,
    shell: false,
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "production",
    },
  });

  nextProcess.stdout &&
    nextProcess.stdout.on("data", (data) => {
      console.log("Next.js:", data.toString());
    });

  nextProcess.stderr &&
    nextProcess.stderr.on("data", (data) => {
      console.error("Next.js error:", data.toString());
    });

  nextProcess.on("error", (err) => {
    console.error("Failed to start Next.js:", err);
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  const inUse = await isPortInUse(PORT);

  if (!inUse) {
    startNextServer();
  }

  try {
    await waitForServer(PORT);
    console.log("Server is ready!");
  } catch (err) {
    console.error("Server failed to start:", err);
  }

  createWindow();
});

app.on("window-all-closed", () => {
  if (nextProcess) {
    nextProcess.kill("SIGTERM");
    setTimeout(() => {
      try {
        nextProcess.kill("SIGKILL");
      } catch {}
    }, 2000);
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextProcess) {
    try {
      nextProcess.kill("SIGKILL");
    } catch {}
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
