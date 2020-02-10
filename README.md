# D support for [Atom IDE](https://ide.atom.io)

[![APMVersion](https://img.shields.io/apm/v/ide-dlang.svg?style=flat-square)](https://atom.io/packages/ide-dlang)

An Atom-IDE package for [Dlang](https://dlang.org).
Provides syntax highlighting, dub build integration with [atom-build](https://atom.io/packages/build) and Atom-IDE integration using the [Language Server protocol](https://microsoft.github.io/language-server-protocol).

## Features

[DLS](https://github.com/d-language-server/dls) is used as a Language Server, which in turn uses libraries such as [DCD](http://dcd.dub.pm), [DFMT](http://dfmt.dub.pm), [D-Scanner](http://dscanner.dub.pm) as well as [other libraries](https://github.com/d-language-server/dls/blob/master/README.md) to provide language editing features.

Look [here](https://github.com/d-language-server/dls) for an up-to-date list of features currently supported.
Not every possible feature is implemented, but the server will update itself as new features come.

## Requirements

Dub and a D compiler (DMD, LDC or GDC) should be installed for the extension to work properly.
This extension also doesn't work on its own, it provides functionality but no UI.
Extensions from [atom-ide-community](https://atom-ide-community.github.io) (or the original [atom-ide-ui](https://atom.io/packages/atom-ide-ui) package), and [build](https://atom.io/packages/build) should be installed.
