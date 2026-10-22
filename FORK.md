# Expertise fork of opencode-claude-auth: the `expertise-main` branch

This file is about our fork only. It is not part of upstream opencode-claude-auth.

## What `expertise-main` is

`expertise-main` is the official branch of our fork. It plays the same role for us that `main` plays for upstream (`griffinmartin/opencode-claude-auth`).

- It holds upstream opencode-claude-auth plus every change we made on top of it.
- It is the only branch that downstream bundles.
- It is the only branch that other work is merged into.

The branch is named after its role, not after what it contains. Its content changes with time. Its role does not.

## Remotes

| Remote | URL | Use |
|---|---|---|
| `origin` | `git@github.com:felipealmeida/opencode-claude-auth.git` | Our repository. We push here. |
| `gm` | `https://github.com/griffinmartin/opencode-claude-auth.git` | Upstream. We only fetch from it. |

`main` in this repository is a pre-rebase legacy line. It is frozen at its last push. Never commit to it.

This repository is public. Do not commit host names, IP addresses, credentials, or any private data. Keep deploy details for our own hosts in the private repositories that hold them.

## Rules

1. Every change to the plugin that we run ends up in `expertise-main`. A change that is not in `expertise-main` is not part of our plugin.
2. Start new work from `expertise-main`. Use a short-lived branch (for example `fix/credential-rotation`).
3. When the work is done and tested, merge the branch into `expertise-main` and push it to `origin`.
4. Do not bundle a plugin from a feature branch. Downstream config installs bundle this repository into an OpenCode plugin build and pin a commit. The pin must point at a commit that is already in `expertise-main`.
5. Do not rewrite the history of `expertise-main` (no force push, no rebase of published commits). A force push here would orphan the commit that downstream pins.
6. Run the plugin tests and build the bundle before you merge.
7. Keep our patches small and separate from upstream code where you can.

## Normal workflow

```sh
git fetch origin
git switch -c fix/my-change origin/expertise-main
# work, commit, test, build the bundle
git switch expertise-main
git pull --ff-only origin expertise-main
git merge --no-ff fix/my-change
git push origin expertise-main
```

## Taking in upstream changes

We follow upstream on purpose, not automatically.

```sh
git fetch gm
git switch -c sync/upstream-<date> expertise-main
git merge gm/main
# resolve conflicts, test, rebuild the bundle
git switch expertise-main
git merge --no-ff sync/upstream-<date>
git push origin expertise-main
```

Merge upstream into our branch. Do not rebase our branch onto upstream: the downstream pin holds a commit of the published history.

## Where we started

`expertise-main` was created on 2026-10-22 from the branch `rebase-2.2.1-teamclaude-compat` (commit `9ec2e51d5`), on top of upstream release 2.2.1 (`8aad811`), plus these five commits:

- `f06f6fe` feat: route requests through an ANTHROPIC_BASE_URL upstream override (proxy mode)
- `6a263bb` docs: document ANTHROPIC_BASE_URL proxy routing
- `1d3d8f4` build: add prepare script for git installs
- `f251f05` fix: tolerate missing local credential in ANTHROPIC_BASE_URL proxy mode
- `9ec2e51d5` fix: preserve TeamClaude vendor compatibility after rebase

The downstream pin points at `9ec2e51d5`, which is the tip this branch starts from. When the pin is next updated, point it at a commit of `expertise-main`.

## Lines not to use

- `main` (remote): the pre-rebase legacy line. Frozen.
- `rebase-2.2.1-teamclaude-compat`: replaced by `expertise-main` (identical content).

A local-only rebase of the proxy-mode commits onto the same upstream base (tip `1222cc7`) added an "allow empty Bearer" refinement. That refinement is content-identical to `f251f05` ("tolerate missing local credential") on `expertise-main`: the two commits produce the same `src/index.ts` (`6e48543..776789f`), and `git diff 1222cc7 f251f05` is empty. The local line is therefore fully contained in `expertise-main`. Treat `main` and the `1222cc7` line as historical; all current work starts from `expertise-main`.
