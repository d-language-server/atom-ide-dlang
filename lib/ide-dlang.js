const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const net = require('net');
const alc = require('atom-languageclient');
const pdeps = require('atom-package-deps');
const bytes = require('bytes');
const bp = require('./build-provider');
const util = require('./util');

let busyService;
let busyServiceResolve;
let busyServicePromise = new Promise(resolve => busyServiceResolve = resolve);

class DLSLanguageClient extends alc.AutoLanguageClient {
    activate() {
        let promise = super.activate() || Promise.resolve();
        return promise.then(() => pdeps.install('ide-dlang', false));
    }

    getGrammarScopes() {
        return ['source.d'];
    }

    getLanguageName() {
        return 'D';
    }

    getServerName() {
        return 'DLS';
    }

    getConnectionType() {
        return atom.config.get('ide-dlang.connectionType');
    }

    getRootConfigurationKey() {
        return 'ide-dlang.dls';
    }

    getInitializeParams(projectPath, process) {
        let params = super.getInitializeParams(projectPath, process);
        params.initializationOptions = atom.config.get('ide-dlang.init');
        return params;
    }

    mapConfigurationObject(config) {
        return {
            d: {
                dls: config
            }
        };
    }

    preInitialization(connection) {
        {
            let busyMessage;
            let totalSize = 0;
            let currentSize = 0;

            connection.onCustom('$/dls/upgradeDls/didStart', (params) => busyMessage = busyService.reportBusy(params.tr));
            connection.onCustom('$/dls/upgradeDls/didStop', () => busyMessage.dispose());
            connection.onCustom('$/dls/upgradeDls/didChangeTotalSize', params => totalSize = params.size);
            connection.onCustom('$/dls/upgradeDls/didChangeCurrentSize', params => {
                busyMessage.setTitle(params.tr + ` (${bytes(params.size - currentSize)} / ${bytes(totalSize)})`);
            });
            connection.onCustom('$/dls.upgradeDls.extract', (params) => busyMessage.setTitle(params.tr));
        }

        {
            let busyMessage;
            connection.onCustom('$/dls.upgradeSelections.start', (params) => busyMessage = busyService.reportBusy(params.tr));
            connection.onCustom('$/dls.upgradeSelections.stop', () => busyMessage.dispose());
        }
    }

    filterChangeWatchedFiles(filePath) {
        return ['dub.json', 'dub.sdl', 'dub.selections.json', '.gitmodules'].indexOf(path.basename(filePath)) !== -1 ||
            ['.ini', '.d', '.di'].indexOf(path.extname(filePath)) !== -1;
    }

    startServerProcess() {
        let dlsPath = atom.config.get('ide-dlang.dlsPath') || getDlsPath();

        if (dlsPath.length) {
            try {
                fs.statSync(dlsPath);
                return busyServicePromise.then(() => this.createServer(dlsPath));
            } catch (err) {}
        }

        dlsPath = '';

        if (!util.dub) {
            atom.notifications.addError('Dub not found in PATH');
            return;
        }

        if (!util.compiler) {
            atom.notifications.addError('No compiler found in PATH');
            return;
        }

        let promise = new Promise(resolve => cp.spawn(util.dub, ['remove', '--version=*', 'dls']).on('exit', resolve))
            .then(() => new Promise(resolve => cp.spawn(util.dub, ['fetch', 'dls']).on('exit', resolve)))
            .then(() => new Promise(resolve => {
                let args = ['run', '--compiler=' + util.compiler, '--quiet', 'dls:bootstrap', '--', '--progress'];
                cp.spawn(util.dub, args)
                    .stdout.on('data', data => dlsPath += data.toString())
                    .on('end', resolve)
            }))
            .then(() => this.createServer(dlsPath));

        return busyServicePromise
            .then(() => busyService.reportBusyWhile('Installing DLS', () => promise, {
                revealTooltip: true
            }));
    }

    createServer(dlsPath) {
        return this.getConnectionType() === 'stdio' ?
            Promise.resolve(cp.spawn(dlsPath.trim())) :
            this.createServerWithSocket(dlsPath);
    }

    createServerWithSocket(dlsPath) {
        let dls;
        return new Promise(resolve => {
            let server = net.createServer(s => {
                this.socket = s;
                this.socket.setNoDelay(true);
                server.close();
                resolve(dls);
            });

            server.listen(0, '127.0.0.1', () => {
                dls = cp.spawn(dlsPath.trim(), ['--socket=' + server.address().port]);
            });
        });
    }

    consumeBusySignal(busySignalService) {
        busyService = busySignalService;
        busyServiceResolve();
    }

    provideBuild() {
        return bp;
    }
}

function getDlsPath() {
    let dlsExecutable = util.executableName('dls');
    let dlsDir = path.join(process.env[util.isWindows ? 'LOCALAPPDATA' : 'HOME'],
        util.isWindows ? 'dub' : '.dub',
        'packages', '.bin');

    try {
        let dls = path.join(dlsDir, 'dls-latest', dlsExecutable);
        fs.statSync(dls);
        return dls;
    } catch (err) {
        return path.join(dlsDir, dlsExecutable);
    }
}

module.exports = new DLSLanguageClient();