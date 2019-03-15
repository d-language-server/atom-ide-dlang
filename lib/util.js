const fs = require('fs');
const path = require('path');

const isWindows = process.platform === 'win32';
const dub = atom.config.get('ide-dlang.dubPath') || findInPath(executableName('dub'));
const compiler = findInPath(executableName('dmd')) ||
    findInPath(executableName('ldc2')) ||
    findInPath(executableName('gdc'));

function findInPath(binary) {
    for (let p of process.env['PATH'].split(isWindows ? ';' : ':')) {
        try {
            fs.statSync(path.join(p, binary))
            return binary;
        } catch (err) {}
    }

    return null;
}

function executableName(name) {
    return isWindows ? name + '.exe' : name;
}

module.exports = {
    isWindows,
    dub,
    compiler,
    findInPath,
    executableName
};