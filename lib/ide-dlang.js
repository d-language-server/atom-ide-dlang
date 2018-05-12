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
    connection.onTelemetryEvent(updatePath);
    connection.onCustom('dls/didUpdatePath', updatePath);
  }

  filterChangeWatchedFiles(filePath) {
    return ['dub.json', 'dub.sdl', 'dub.selections.json'].indexOf(basename(filePath)) !== -1
      || basename(filePath).endsWith('.ini');
  }

  startServerProcess() {
    var dlsPath = atom.config.get('ide-dlang.dlsPath') || '';

    if (dlsPath.length) {
      try {
        if (statSync(dlsPath).isFile()) {
          return spawn(dlsPath);
        }
      } catch (err) {
      }

      atom.config.set('ide-dlang.dlsPath', '');
    }

    dlsPath = '';

    atom.notifications.addInfo('Building DLS... (this might take a few minutes)');
    return new Promise(resolve => spawn('dub', ['fetch', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => spawn('dub', ['run', '--quiet', 'dls:bootstrap'])
        .stdout.on('data', data => dlsPath += data.toString())
        .on('end', resolve)
      ))
      .then(() => {
        atom.notifications.addSuccess('DLS built ! Launching server...');
        return spawn(dlsPath);
      });
  }
}

module.exports = new DLSLanguageClient();
