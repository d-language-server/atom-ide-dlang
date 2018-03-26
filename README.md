# Atom-IDE: Dlang

An Atom-IDE package for [Dlang](https://dlang.org). Provides syntax highlighting for D and preliminary Atom-IDE integration.

[DLS](https://github.com/LaurentTreguier/dls) is used as a Language Server, which in turn uses DCD, DFMT (and D-Scanner in the future) to provide language features.
For now few features are implemented, but the server will propose updates as new features come.

## Requirements

DMD and Dub should be installed on your local machine in order to compile the server. (I trust that you have them already if you develop in D)
[atom-ide-ui](https://atom.io/packages/atom-ide-ui) should also be installed (although it's not necessary right now, it will be at some point in the future).
