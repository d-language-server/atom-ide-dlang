const path = require('path');
const glob = require('glob');
const util = require('./util');

class DubBuildProvider {
    constructor(cwd) {
        this.cwd = cwd;
    }

    getNiceName() {
        return 'Dub';
    }

    isEligible() {
        return glob.sync(path.join(this.cwd, 'dub.{json,sdl}')).length > 0;
    }

    settings() {
        let args = ['build'];

        if (util.compiler === 'dmd.exe') {
            args.push('--arch=x86_mscoff');
        }

        return [{
            exec: util.dub,
            cmd: util.dub,
            args: args,
            sh: false,
            cwd: '{PROJECT_PATH}'
        }];
    }
}

module.exports = DubBuildProvider;