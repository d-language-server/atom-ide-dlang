const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const alc = require('atom-languageclient');
const bytes = require('bytes');

const isWindows = process.platform === 'win32';
const dmd = isWindows ? 'dmd.exe' : 'dmd';
const ldc = isWindows ? 'ldc2.exe' : 'ldc2';

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
    {
      let busyMessage;
      let totalSize = 0;
      let currentSize = 0;
      let updatePath = (path => atom.config.set('ide-dlang.dlsPath', path));

      connection.onCustom('$/dls.upgradeDls.start', (params) => busyMessage = busyService.reportBusy(params ? params.tr : 'Upgrading DLS'));
      connection.onCustom('$/dls.upgradeDls.totalSize', params => totalSize = typeof (params) !== 'number' ? params.size : params);
      connection.onCustom('$/dls.upgradeDls.currentSize', params => {
        let size = typeof (params) !== 'number' ? params.size : params;
        busyMessage.setTitle((typeof (params) !== 'number' ? params.tr : 'Downloading')
          + ` (${bytes(size - currentSize)} / ${bytes(totalSize)})`);
      });
      connection.onCustom('$/dls.upgradeDls.extract', (params) => busyMessage.setTitle(params ? params.tr : 'Extracting'));
      connection.onCustom('$/dls.upgradeDls.stop', () => busyMessage.dispose());
    }

    {
      let busyMessage;
      connection.onCustom('$/dls.upgradeSelections.start', (params) =>
        busyMessage = busyService.reportBusy(params ? params.tr : 'Upgrading selections'));
      connection.onCustom('$/dls.upgradeSelections.stop', () => busyMessage.dispose());
    }
  }

  filterChangeWatchedFiles(filePath) {
    return ['dub.json', 'dub.sdl', 'dub.selections.json'].indexOf(path.basename(filePath)) !== -1
      || path.basename(filePath).endsWith('.ini');
  }

  startServerProcess() {
    let dlsPath = atom.config.get('ide-dlang.dlsPath') || getDlsPath();

    if (dlsPath.length) {
      try {
        fs.statSync(dlsPath);
        return busyServicePromise.then(() => cp.spawn(dlsPath));
      } catch (err) {
      }
    }

    dlsPath = '';

    let compiler = getCompiler();

    if (!compiler) {
      atom.notifications.addError('No compiler found in PATH');
      return;
    }

    let promise = new Promise(resolve => cp.spawn('dub', ['remove', '--version=*', 'dls']).on('exit', resolve))
      .then(() => new Promise(resolve => cp.spawn('dub', ['fetch', 'dls']).on('exit', resolve)))
      .then(() => new Promise(resolve => {
        let args = ['run', '--compiler=' + compiler, '--quiet', 'dls:bootstrap'];

        if (process.arch === 'x64') {
          args.push('--arch=x86_64');
        }

        args.push('--', '--progress');

        cp.spawn('dub', args)
          .stdout.on('data', data => dlsPath += data.toString())
          .on('end', resolve)
      }))
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
  let dlsExecutable = isWindows ? 'dls.exe' : 'dls';
  let dlsDir = path.join(process.env[isWindows ? 'LOCALAPPDATA' : 'HOME'],
    isWindows ? 'dub' : '.dub',
    'packages', '.bin');

  try {
    let dls = path.join(dlsDir, 'dls-latest', dlsExecutable);
    fs.statSync(dls);
    return dls;
  } catch (err) {
    return path.join(dlsDir, dlsExecutable);
  }
}

function getCompiler() {
  for (let p of process.env['PATH'].split(isWindows ? ';' : ':')) {
    for (let compiler of [dmd, ldc]) {
      try {
        fs.statSync(path.join(p, compiler))
        return compiler;
      }
      catch (err) {
      }
    }
  }

  return null;
}

module.exports = new DLSLanguageClient();
