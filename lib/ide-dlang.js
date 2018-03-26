const fs = require('fs');
const p = require('path');
const cp = require('child_process');
const { AutoLanguageClient } = require('atom-languageclient');

class DLSLanguageClient extends AutoLanguageClient {
  getGrammarScopes() { return ['source.d']; }
  getLanguageName() { return 'D'; }
  getServerName() { return 'DLS'; }
  getRootConfigurationKey() { return 'ide-dlang.dls'; }
  mapConfigurationObject(config) { return { d: { dls: config } }; }

  preInitialization(connection) {
    connection.onTelemetryEvent(path => atom.config.set('ide-dlang.dlsPath', path));
  }

  filterChangeWatchedFiles(filePath) {
    return ['dub.json', 'dub.sdl', 'dub.selections.json'].indexOf(p.basename(filePath)) !== -1;
  }

  startServerProcess() {
    var path = atom.config.get('ide-dlang.dlsPath') || '';

    if (path.length) {
      try {
        if (fs.statSync(path).isFile()) {
          return cp.spawn(path);
        }
      } catch (err) {
      }

      atom.config.set('ide-dlang.dlsPath', '');
    }

    return new Promise(resolve => cp.spawn('dub', ['fetch', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => cp.spawn('dub', ['run', '--quiet', 'dls:find'])
        .stdout.on('data', data => path += data.toString())
        .on('end', resolve)
      ))
      .then(() => new Promise(resolve => {
        atom.notifications.addInfo('Building DLS... (this might take a few minutes)');
        cp.spawn('dub', ['build', '--build=release']
          .concat(process.platform === 'win32' ? ['--arch=x86_mscoff'] : []), { cwd: path })
          .on('exit', resolve);
      }))
      .then(() => {
        atom.notifications.addInfo('DLS built ! Launching server...');
        return cp.spawn(p.join(path, 'dls'));
      });
  }
}

module.exports = new DLSLanguageClient();
