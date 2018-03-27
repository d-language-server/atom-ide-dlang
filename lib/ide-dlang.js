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
    connection.onCustom('dls/updatedPath', path => atom.config.set('ide-dlang.dlsPath', path));
  }

  filterChangeWatchedFiles(filePath) {
    return ['dub.json', 'dub.sdl', 'dub.selections.json'].indexOf(basename(filePath)) !== -1;
  }

  startServerProcess() {
    var path = atom.config.get('ide-dlang.dlsPath') || '';

    if (path.length) {
      try {
        if (statSync(path).isFile()) {
          return spawn(path);
        }
      } catch (err) {
      }

      atom.config.set('ide-dlang.dlsPath', '');
    }

    return new Promise(resolve => spawn('dub', ['fetch', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => spawn('dub', ['run', '--quiet', 'dls:find'])
        .stdout.on('data', data => path += data.toString())
        .on('end', resolve)
      ))
      .then(() => new Promise(resolve => {
        atom.notifications.addInfo('Building DLS... (this might take a few minutes)');
        spawn('dub', ['build', '--build=release']
          .concat(process.platform === 'win32' ? ['--arch=x86_mscoff'] : []), { cwd: path })
          .on('exit', resolve);
      }))
      .then(() => {
        atom.notifications.addInfo('DLS built ! Launching server...');
        return spawn(join(path, 'dls'));
      });
  }
}

module.exports = new DLSLanguageClient();
