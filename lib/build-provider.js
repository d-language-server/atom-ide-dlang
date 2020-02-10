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
        return [{
            name: "Build",
            exec: util.dub,
            cmd: util.dub,
            args: ['build'],
            sh: false,
            cwd: '{PROJECT_PATH}'
        }, {
            name: "Run",
            exec: util.dub,
            cmd: util.dub,
            args: ['run'],
            sh: false,
            cwd: '{PROJECT_PATH}'
        }, {
            name: "Test",
            exec: util.dub,
            cmd: util.dub,
            args: ['test'],
            sh: false,
            cwd: '{PROJECT_PATH}'
        }];
    }
}

module.exports = DubBuildProvider;