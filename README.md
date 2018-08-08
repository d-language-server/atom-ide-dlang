# ide-dlang: D support for [Atom IDE](https://ide.atom.io)

An Atom-IDE package for [Dlang](https://dlang.org).
Provides syntax highlighting and Atom-IDE integration using the [Language Server protocol](https://microsoft.github.io/language-server-protocol).

## Features

[DLS](https://github.com/LaurentTreguier/dls) is used as a Language Server, which in turn uses libraries such as [DCD](http://dcd.dub.pm), [DFMT](http://dfmt.dub.pm), [D-Scanner](http://dscanner.dub.pm) as well as [other libraries](https://github.com/LaurentTreguier/dls/blob/master/README.md) to provide language editing features.

Look [here](https://github.com/LaurentTreguier/dls) for an up-to-date list of features currently supported.
Far from every possible feature is implemented, but the server will offer updates as new features come.

## Requirements

Dub should be installed for the extension to install DLS itself.
[atom-ide-ui](https://atom.io/packages/atom-ide-ui) should also be installed.
