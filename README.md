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
[![dependencies Status](https://david-dm.org/@ianwremmel/clark/status.svg)](https://david-dm.org/@ianwremmel/clark)
[![devDependencies Status](https://david-dm.org/@ianwremmel/clark/dev-status.svg)](https://david-dm.org/@ianwremmel/clark?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![CircleCI](https://circleci.com/gh/ianwremmel/clark.svg?style=svg)](https://circleci.com/gh/ianwremmel/clark)
[![Coverage Status](https://coveralls.io/repos/github/ianwremmel/clark/badge.svg?branch=master)](https://coveralls.io/github/ianwremmel/clark?branch=master)
<!-- PROJ: Badges End -->

> Monorepo tools

Clark is a toolkit for interacting with [alle-inspired](https://github.com/boennemann/alle) monorepos. This is a productization of scripts found in [PouchDB](https://github.com/pouchdb/pouchdb) and the [Cisco Spark JavaScript SDK](https://github.com/ciscospark/spark-js-sdk).

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contribute](#contribute)
- [License](#license)

## Install

```bash
npm install @ianwremmel/clark
```

## Usage

The key benefit of clark over [lerna](https://lernajs.io/) and similar tools comes from adhering to the directory layout described in [alle](https://github.com/boennemann/alle). In other words, all of your package **must** be kept in `./packages/node_modules` and the name each each `package.json` **should** match the subfolder path (yes, this includes the org/user scope if present).

### List all commands

```bash
clark --help
```

### List all packages

```bash
clark list
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
