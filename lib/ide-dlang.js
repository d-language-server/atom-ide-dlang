const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const alc = require('atom-languageclient');
const bytes = require('bytes');

let busyService;
let busyServiceResolve;
let busyServicePromise = new Promise(resolve => busyServiceResolve = resolve);

class DLSLanguageClient extends alc.AutoLanguageClient {
  getGrammarScopes() { return ['source.d']; }
  getLanguageName() { return 'D'; }
  getServerName() { return 'DLS'; }
  getRootConfigurationKey() { return 'ide-dlang.dls'; }
  mapConfigurationObject(config) { return { d: { dls: config } }; }

  preInitialization(connection) {
    let busyMessage;
    let totalSize = 0;
    let currentSize = 0;
    let updatePath = (path => atom.config.set('ide-dlang.dlsPath', path));
    connection.onCustom('$/dls.upgradeDls.start', () => busyMessage = busyService.reportBusy('Upgrading DLS'));
    connection.onCustom('$/dls.upgradeDls.totalSize', size => totalSize = size);
    connection.onCustom('$/dls.upgradeDls.currentSize', size =>
      busyMessage.setTitle('Downloading (' + bytes(size - currentSize) + ' / ' + bytes(totalSize) + ')'));
    connection.onCustom('$/dls.upgradeDls.extract', () => busyMessage.setTitle('Extracting'));
    connection.onCustom('$/dls.upgradeDls.stop', () => busyMessage.dispose());
    connection.onCustom('dls/didUpdatePath', updatePath);
  }

  filterChangeWatchedFiles(filePath) {
    return ['dub.json', 'dub.sdl', 'dub.selections.json'].indexOf(path.basename(filePath)) !== -1
      || path.basename(filePath).endsWith('.ini');
  }

  startServerProcess() {
    let dlsPath = atom.config.get('ide-dlang.dlsPath') || getDlsPath() || '';

    if (dlsPath.length) {
      try {
        if (fs.statSync(dlsPath).isFile()) {
          return Promise.all([busyServicePromise, fixBrokenDls()]).then(() => cp.spawn(dlsPath));
        }
      } catch (err) {
      }
    }

    dlsPath = '';

    let promise = new Promise(resolve => cp.spawn('dub', ['fetch', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => cp.spawn('dub', ['run', '--quiet', 'dls:bootstrap'])
        .stdout.on('data', data => dlsPath += data.toString())
        .on('end', resolve)
      ))
      .then(() => {
        atom.notifications.addSuccess('DLS installed ! Launching server...');
        return cp.spawn(dlsPath);
      });

    return busyServicePromise
      .then(() => busyService.reportBusyWhile('Installing DLS', () => promise, { revealTooltip: true }));
  }

  consumeBusySignal(busySignalService) {
    busyService = busySignalService;
    busyServiceResolve();
  }
}

function getDlsPath() {
  const isWindows = process.platform === 'win32';
  return path.join(process.env[isWindows ? 'LOCALAPPDATA' : 'HOME'],
    isWindows ? 'dub' : '.dub',
    'packages', '.bin',
    isWindows ? 'dls.exe' : 'dls');
}

function fixBrokenDls() {
  if (process.platform === 'win32') {
    let destCurlPath = path.join(path.dirname(getDlsPath()), 'libcurl.dll');

    try {
      fs.statSync(destCurlPath);
    } catch (err) {
      for (let p of process.env['PATH'].split(';')) {
        try {
          fs.accessSync(path.join(p, 'dmd.exe'));
          let dmdDir = path.dirname(p);
          let curlDir = path.join(dmdDir, process.arch === 'x64' ? 'bin64' : 'bin');

          return new Promise(resolve => fs.createReadStream(path.join(curlDir, 'libcurl.dll'))
            .pipe(fs.createWriteStream(destCurlPath))
            .on('close', resolve));
        } catch (err) { }
      }
    }
  }

  return Promise.resolve();
}

module.exports = new DLSLanguageClient();
