<a name="4.1.3"></a>
## [4.1.3](https://github.com/ianwremmel/clark/compare/v4.1.2...v4.1.3) (2018-05-01)


### Bug Fixes

* **tooling:** use sem-rel context for release phase ([d31cd00](https://github.com/ianwremmel/clark/commit/d31cd00)), closes [#140](https://github.com/ianwremmel/clark/issues/140)

<a name="4.1.2"></a>
## [4.1.2](https://github.com/ianwremmel/clark/compare/v4.1.1...v4.1.2) (2018-04-26)


### Bug Fixes

* **dependencies:** move tslib to normal dep ([1eaac43](https://github.com/ianwremmel/clark/commit/1eaac43))

<a name="4.1.1"></a>
## [4.1.1](https://github.com/ianwremmel/clark/compare/v4.1.0...v4.1.1) (2018-04-24)


### Bug Fixes

* **run:** inject -- only when appropriate ([036cba7](https://github.com/ianwremmel/clark/commit/036cba7)), closes [#120](https://github.com/ianwremmel/clark/issues/120)

<a name="4.1.0"></a>
# [4.1.0](https://github.com/ianwremmel/clark/compare/v4.0.1...v4.1.0) (2018-04-21)


### Features

* **run:** support arbitrary arguments ([a1dcce7](https://github.com/ianwremmel/clark/commit/a1dcce7)), closes [#82](https://github.com/ianwremmel/clark/issues/82)

<a name="4.0.1"></a>
## [4.0.1](https://github.com/ianwremmel/clark/compare/v4.0.0...v4.0.1) (2018-04-18)


### Bug Fixes

* **ci:** empty commit to retrigger semrel ([10f5b44](https://github.com/ianwremmel/clark/commit/10f5b44))

<a name="4.0.0"></a>
# [4.0.0](https://github.com/ianwremmel/clark/compare/v3.3.4...v4.0.0) (2018-04-18)


### Bug Fixes

* **bin:** identify bin file correctly ([e3342a2](https://github.com/ianwremmel/clark/commit/e3342a2))
* **exec:** remove strict=false ([05b8854](https://github.com/ianwremmel/clark/commit/05b8854))
* **oclif:** restore support for use local version ([20c9412](https://github.com/ianwremmel/clark/commit/20c9412))


### Code Refactoring

* **all:** start migrating to oclif ([a30755b](https://github.com/ianwremmel/clark/commit/a30755b))


### Documentation

* **readme:** remove old docs ([52e58a2](https://github.com/ianwremmel/clark/commit/52e58a2))


### BREAKING CHANGES

* **readme:** this documents how things work now that we've moved to
oclif
* **all:** this begins a series of commits that break everything
