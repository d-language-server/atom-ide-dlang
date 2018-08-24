const path = require('path');
const glob = require('glob');

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
      exec: atom.config.get('ide-dlang.dubPath'),
      cmd: atom.config.get('ide-dlang.dubPath'),
      args: ['build'],
      sh: false,
      cwd: '{PROJECT_PATH}'
    }];
  }
}

module.exports = DubBuildProvider;
