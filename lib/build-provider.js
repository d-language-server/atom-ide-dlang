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
      exec: util.dub,
      cmd: util.dub,
      args: ['build'],
      sh: false,
      cwd: '{PROJECT_PATH}'
    }];
  }
}

module.exports = DubBuildProvider;
