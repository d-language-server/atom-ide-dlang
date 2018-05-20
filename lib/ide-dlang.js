const { statSync } = require('fs');
const { basename, join } = require('path');
const { spawn } = require('child_process');
const { AutoLanguageClient } = require('atom-languageclient');

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
          return spawn(dlsPath);
        }
      } catch (err) {
      }
    }

    dlsPath = '';

    atom.notifications.addInfo('Installing DLS... (this might take a few minutes)');
    return new Promise(resolve => spawn('dub', ['fetch', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => spawn('dub', ['run', '--quiet', 'dls:bootstrap'])
        .stdout.on('data', data => dlsPath += data.toString())
        .on('end', resolve)
      ))
      .then(() => {
        atom.notifications.addSuccess('DLS installed ! Launching server...');
        return spawn(dlsPath);
      });
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
