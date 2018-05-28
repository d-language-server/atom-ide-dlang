const { statSync } = require('fs');
const { basename, join } = require('path');
const { spawn } = require('child_process');
const { AutoLanguageClient } = require('atom-languageclient');

var busyService;
var busyServiceResolve;
var busyServicePromise = new Promise(resolve => busyServiceResolve = resolve);

class DLSLanguageClient extends AutoLanguageClient {
  getGrammarScopes() { return ['source.d']; }
  getLanguageName() { return 'D'; }
  getServerName() { return 'DLS'; }
  getRootConfigurationKey() { return 'ide-dlang.dls'; }
  mapConfigurationObject(config) { return { d: { dls: config } }; }

  preInitialization(connection) {
    var updatePath = (path => atom.config.set('ide-dlang.dlsPath', path));
    connection.onCustom('dls/didUpdatePath', updatePath);
  }

  filterChangeWatchedFiles(filePath) {
    return ['dub.json', 'dub.sdl', 'dub.selections.json'].indexOf(basename(filePath)) !== -1
      || basename(filePath).endsWith('.ini');
  }

  startServerProcess() {
    var dlsPath = atom.config.get('ide-dlang.dlsPath') || getDlsPath() || '';

    if (dlsPath.length) {
      try {
        if (statSync(dlsPath).isFile()) {
          return busyServicePromise.then(() => spawn(dlsPath));
        }
      } catch (err) {
      }
    }

    dlsPath = '';

    let promise = new Promise(resolve => spawn('dub', ['fetch', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => spawn('dub', ['run', '--quiet', 'dls:bootstrap'])
        .stdout.on('data', data => dlsPath += data.toString())
        .on('end', resolve)
      ))
      .then(() => {
        atom.notifications.addSuccess('DLS installed ! Launching server...');
        return spawn(dlsPath);
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
  return join(process.env[isWindows ? 'LOCALAPPDATA' : 'HOME'],
    isWindows ? 'dub' : '.dub',
    'packages', '.bin',
    isWindows ? 'dls.exe' : 'dls');
}

module.exports = new DLSLanguageClient();
