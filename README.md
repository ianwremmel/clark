# clark

[![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/)

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

Unlike [lerna](https://lernajs.io/) or similar tools, `clark` lets you keep track of your dependencies all in your main `package.json` (key benefits being significantly faster `npm install` times and the ability to use greenkeeper). In order to get this benefit, however, you'll need to follow one of two patterns ([alle](#alle) or [non-alle](#non-alle), described below). Once you pick one of those patterns and configure your repository accordingly, you can use `clark hoist`, to move your deps from you individual subpackages to your repo root.

### Alle

[Alle](https://github.com/boennemann/alle) was originally described as just an example of how things _could_ work, before eventually being enacted by [pouchdb](). In order to follow the Alle pattern, all of your package **must** be kept in `./packages/node_modules` and the name of each `package.json` **should** match the subfolder path (yes, this includes the org/user scope if present).

**Benefits**

*   Alle is symlink free. It relies on the behavior of `require()` inside a `node_modules` directory to search both up the tree and in sibling folders, thus letting your packages find each other automatically.

**Caveats**

*   Many tools have hardcoded excludes for `node_modules` and some can't be overridden at all. Perhaps most problematically, GitHub PR will collapse most of your diffs assuming that anything in `node_modules` is vendored. GitHub language stats also get confused.
*   If you already have an established project, moving every folder can be problematic.

### Non-Alle

When npm encounters a package version that's simply a file path (e.g. `"my-package": "file:./packages/my-package"`), it will symlink it into `./node_modules`. By putting all of our local node_modules in the top-level `package.json`, we can expose our local packages to each other without making any other repo changes.

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

<!-- commands -->
* [`clark exec COMMAND`](#clark-exec-command)
* [`clark help [COMMAND]`](#clark-help-command)
* [`clark hoist`](#clark-hoist)
* [`clark init`](#clark-init)
* [`clark list`](#clark-list)
* [`clark run SCRIPT`](#clark-run-script)

## `clark exec COMMAND`

Execute a command in each package directory. Note: commands with spaces and pipes are supported, but must be wrapped in quotes.

```
USAGE
  $ clark exec COMMAND

OPTIONS
  -p, --packageName=packageName  The package against which to run this command. May be specified more than once.
  -s, --silent                   Indicates nothing should be printed to the stdout
  --fail-fast                    Alias of --failFast
  --failFast                     Fail as soon as a command fails, rather than running all to completion
  --package=package              alias of --packageName
  --package-name=package-name    alias of --packageName
```

_See code: [src/commands/exec.ts](https://github.com/ianwremmel/clark/blob/v4.1.1/src/commands/exec.ts)_

## `clark help [COMMAND]`

display help for clark

```
USAGE
  $ clark help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v1.2.5/src/commands/help.ts)_

## `clark hoist`

Migrate dependencies and dev dependencies from a sub package to the root package.json

```
USAGE
  $ clark hoist

OPTIONS
  -p, --packageName=packageName  The package against which to run this command. May be specified more than once.
  -s, --silent                   Indicates nothing should be printed to the stdout
  --fail-fast                    Alias of --failFast

  --failFast                     Fail upon encountering a package that cannot be hoisted, rather than running all to
                                 completion

  --package=package              alias of --packageName

  --package-name=package-name    alias of --packageName

  --risky                        Indicates if clark should attempt to reconcile semver mismatches.
```

_See code: [src/commands/hoist.ts](https://github.com/ianwremmel/clark/blob/v4.1.1/src/commands/hoist.ts)_

## `clark init`

Create a .clarkrc file in your project root

```
USAGE
  $ clark init

OPTIONS
  -f, --force          Overwrite .clarkrc with new config
  -s, --script=script  Identifies a script to add to the config file
```

_See code: [src/commands/init.ts](https://github.com/ianwremmel/clark/blob/v4.1.1/src/commands/init.ts)_

## `clark list`

List all packages

```
USAGE
  $ clark list
```

_See code: [src/commands/list.ts](https://github.com/ianwremmel/clark/blob/v4.1.1/src/commands/list.ts)_

## `clark run SCRIPT`

Runs a script in each package directory. This is different from `exec` in that scripts should be defined in .clarkrc and may be overridden on a per-package basis via npm scripts. npm scripts defined only in subpackage package.jsons can be run this way, but only scripts named in .clarkrc will populate the help output.

```
USAGE
  $ clark run SCRIPT

OPTIONS
  -p, --packageName=packageName  The package against which to run this command. May be specified more than once.
  -s, --silent                   Indicates nothing should be printed to the stdout
  --fail-fast                    Alias of --failFast
  --failFast                     Fail as soon as a command fails, rather than running all to completion
  --package=package              alias of --packageName
  --package-name=package-name    alias of --packageName
```

_See code: [src/commands/run.ts](https://github.com/ianwremmel/clark/blob/v4.1.1/src/commands/run.ts)_
<!-- commandsstop -->

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
