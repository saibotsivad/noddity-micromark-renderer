# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

Change categories are:

* `Added` for new features.
* `Changed` for changes in existing functionality.
* `Deprecated` for once-stable features removed in upcoming releases.
* `Removed` for deprecated features removed in this release.
* `Fixed` for any bug fixes.
* `Security` to invite users to upgrade in case of vulnerabilities.

## Unreleased
### Added
### Changed
### Deprecated
### Fixed
### Removed
### Security

## [2.0.1](https://github.com/saibotsivad/noddity-micromark-renderer/compare/v2.0.0...v2.0.1) - 2023-08-23
### Fixed
- Accidental hash fragment.

## [2.0.0](https://github.com/saibotsivad/noddity-micromark-renderer/compare/v1.1.0...v2.0.0) - 2023-08-09
### Changed
- No longer supporting CommonJS exports, it's all *the future* now.
- It's not bundled anymore either, as that got a bit complicated. I might bundle it again later, all these dependencies are no fun to install.
- Lots of the function signatures changed. They weren't well documented, but now hopefully the documentation is better, and more logical.

## [1.1.0](https://github.com/saibotsivad/noddity-micromark-renderer/compare/v1.0.1...v1.1.0) - 2023-06-22
### Added
- You can call the `loadFile` with an additional `options` object, which gets passed along to your non-Markdown renderer, merged into the overall options.

## [1.0.1](https://github.com/saibotsivad/noddity-micromark-renderer/compare/v1.0.0...v1.0.1) - 2022-07-26
### Changed
- Updated the version of `mdast-util-noddity` which has much more thorough and complete Noddity functionality.

## [1.0.0](https://github.com/saibotsivad/noddity-micromark-renderer/compare/v0.0.0...v1.0.0) - 2022-07-21
### Changed
- Got everything working pretty well, demo included, with some tests.

## [0.0.0](https://github.com/saibotsivad/noddity-micromark-renderer/tree/v0.0.0) - 2022-07-20
### Added
- Created the base project from [saibotsivad/init](https://github.com/saibotsivad/init).
