# clark

[![Greenkeeper badge](https://badges.greenkeeper.io/ianwremmel/clark.svg?token=42b42c90636529800fa4f28c6cb8fa617b6bfa4a45ccf892c6c5a3128b7fd4c8&ts=1521139102309)](https://greenkeeper.io/)

<!-- THIS FILE WAS GENERATED BY @ianwremmel/proj. PLEASE DO NOT REMOVE ANY COMMENTS THAT BEGING WITH "PROJ" -->

<!-- (optional) Put banner here -->

<!-- PROJ: Badges Start -->

[![license](https://img.shields.io/github/license/ianwremmel/clark.svg)](https://github.com/ianwremmel/clark/blob/master/LICENSE)
[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![npm (scoped)](https://img.shields.io/npm/v/@ianwremmel/clark.svg)](https://www.npmjs.com/package/@ianwremmel/clark)
[![npm](https://img.shields.io/npm/dm/@ianwremmel/clark.svg)](https://www.npmjs.com/package/@ianwremmel/clark)

[![Greenkeeper badge](https://badges.greenkeeper.io/ianwremmel/clark.svg)](https://greenkeeper.io/)
[![dependencies Status](https://david-dm.org/ianwremmel/clark/status.svg)](https://david-dm.org/ianwremmel/clark)
[![devDependencies Status](https://david-dm.org/ianwremmel/clark/dev-status.svg)](https://david-dm.org/ianwremmel/clark?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![CircleCI](https://circleci.com/gh/ianwremmel/clark.svg?style=svg)](https://circleci.com/gh/ianwremmel/clark)
[![Coverage Status](https://coveralls.io/repos/github/ianwremmel/clark/badge.svg?branch=master)](https://coveralls.io/github/ianwremmel/clark?branch=master)

<!-- PROJ: Badges End -->

> Monorepo tools

Clark is a toolkit for interacting with [alle-inspired](https://github.com/boennemann/alle) monorepos. This is a productization of practices found in [PouchDB](https://github.com/pouchdb/pouchdb), the [Cisco Spark JavaScript SDK](https://github.com/ciscospark/spark-js-sdk), and other monorepo projects.

## Table of Contents

*   [Install](#install)
*   [Usage](#usage)
    *   [Alle](#alle)
    *   [Non-Alle](#non-alle)
    *   [Commands](#commands)
*   [Maintainer](#maintainer)
*   [Contribute](#contribute)
    *   [Development](#development)
*   [License](#license)

## Install

```bash
npm install @ianwremmel/clark
```

## Usage

Unlike [lerna](https://lernajs.io/) or similar tools, `clark` let's you keep track of your dependencies all in your main `package.json` (key benefits being significantly faster `npm install` times and the ability to use greenkeeper). In order to get this benefit, however, you'll need to follow one of two patterns ([alle](#alle) or [non-alle](#non-alle), described below). Once you pick one of those patterns and configure your repository accordingly, you can use `clark hoist`, to move your deps from you individual subpackages to your repo root.

### Alle

[Alle](https://github.com/boennemann/alle) was originally described as just an example of how things _could_ work, before eventually being enacted by [pouchdb](). In order to follow the Alle pattern, all of your package **must** be kept in `./packages/node_modules` and the name of each `package.json` **should** match the subfolder path (yes, this includes the org/user scope if present).

**Benefits**

*   Alle is symlink free. It relies on the behavior of `require()` inside a `node_modules` directory to search both up the tree and in sibling folders, thus letting your packages find each automatically.

**Caveats**

*   Many tools have hardcoded excludes for `node_modules` and some can't be overridden at all. Perhaps most problematically, GitHub PR will collapse most of your diffs assuming that anything in `node_modules` is vendored. GitHub language stats also get confused.
*   If you already have an established project, moving every folder can be problematic.

### Non-Alle

When npm encounters a package version that's simply a file path (e.g. `"my-package": "file:./packages/my-package"`), it will symlink it into `./node_modules`. By putting all of our local node_modules in the top-level `package.json`, we can expose our local packages to eachother withought making any other repo changes.

> In addition to moving dependencies to the top-level, if `clark` sees your in a non-alle monorepo, it will automatically add the local `file:` entries to the top-level as well. You may want to run hoist whenever you create a new package.

Simply add your package directories the `include` section of `.clarkrc`.

```json
//.clarkrc
{
    "include": ["frontend/*", "backend/*"]
}
```

**Benefits**

*   No need to move anything in your existing project.
*   Doesn't break GitHub.

**Caveats**

*   Not yet tested in the wild.
*   Likely requires a very recent version of npm. (Though, clark requires node 8 or later, so this may not be an issue).

### Commands

#### List all commands

```bash
clark --help
```

#### List all packages

```bash
clark list
```

#### Migrate all packages' dependencies to the root

```bash
clark hoist
```

> Note that `dependencies` and `devDepenencies` are combined because the distinction loses meaning in a monorepo (arguably, they should all be devDependencies, but that's not where `npm install` defaults).

#### Migrate a package's dependencies to the root

```bash
clark hoist --package
```

#### Run a command in each package directory

```bash
clark exec <command>
```

The following environment variables will be available to your script:

*   `CLARK_ROOT_PATH`: The monorepo's root path.
*   `CLARK_PACKAGE_REL_PATH`: The relative path within the monorepo to the package currently being acted upon.
*   `CLARK_PACKAGE_ABS_PATH`: The absolute path to the package currently being acted upon.
*   `CLARK_PACKAGE_NAME`: The name of the package being acted upon according to its `package.json`

The script will be invoked from within the package's directory.

#### Run a command in a single package directory

```bash
clark exec <command> --package <packagename>
```

The script will be invoked from within the package's directory.

#### Run npm scripts with default fallbacks

While Clark, obviously, provides its own commands, there's a set of very project specific commands that we simply can't dictate for you. These are commands like `build`, `lint`, and `test` that you want to run each independently against each package.

> In documenation, we refer to "commands", but in `.clarkrc`, we use `scripts` to more closely mirror `package.json`.

##### Package Commands

Package commands are executed sequentially in each package directory. They may be overridden with an entry in the package's package.json.

> Note: these scripts receive the same environment variables as `clark exec` and are executed within each package directory.

For example, your repository might use [mocha](https://mochajs.org/) to run your integration tests

```json
//.clarkrc
{
    "scripts": {
        "package": {
            "test": "mocha 'test/*/spec/**/*.js'"
        }
    }
}
```

but if one of the packages in your monorepo is a React project, you might need to test it with [jest](https://facebook.github.io/jest/)

```json
//my-react-app/package.json
{
    "scripts": {
        "test": "jest 'src/**/*-spec.js'"
    }
}
```

## Maintainer

[Ian Remmel](https://github.com/ianwremmel)

## Contribute

PRs Welcome

### Development

Use `ts-node` to test your changes without rebuilding

```bash
ts-node ./src/cli.ts --help
```

## License

[MIT](LICENSE) &copy; [Ian Remmel](https://github.com/ianwremmel) 2018 until at least now
