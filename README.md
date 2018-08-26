# ide-dlang: D support for [Atom IDE](https://ide.atom.io)

[![APMVersion](https://img.shields.io/apm/v/ide-dlang.svg?style=flat-square)](https://atom.io/packages/ide-dlang)

An Atom-IDE package for [Dlang](https://dlang.org).
Provides syntax highlighting, dub build integration with [atom-build](https://atom.io/packages/build) and Atom-IDE integration using the [Language Server protocol](https://microsoft.github.io/language-server-protocol).

## Features

[DLS](https://github.com/d-language-server/dls) is used as a Language Server, which in turn uses libraries such as [DCD](http://dcd.dub.pm), [DFMT](http://dfmt.dub.pm), [D-Scanner](http://dscanner.dub.pm) as well as [other libraries](https://github.com/d-language-server/dls/blob/master/README.md) to provide language editing features.

Look [here](https://github.com/d-language-server/dls) for an up-to-date list of features currently supported.
Far from every possible feature is implemented, but the server will update itself as new features come.

## Requirements

Dub and either DMD or LDC should be installed for the extension to work properly.
[atom-ide-ui](https://atom.io/packages/atom-ide-ui) should also be installed.
