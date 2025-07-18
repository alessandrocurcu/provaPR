import { Callout } from '#components/callout';
import { InVersion } from '#components/in-version';
import { ExperimentalBadge } from '#components/experimental-badge';
import Link from 'next/link';

Configure the behavior of `turbo` by using a `turbo.json` file in your Workspace's root directory. You can also:

- Use [Package Configurations](/docs/reference/package-configurations) for more granular control.
- Use `turbo.jsonc` to add comments to your configuration with IDE support.

## Global options

### `extends`

```jsonc title="./apps/web/turbo.json"
{
  "extends": ["//"]
}
```

Extend from the root `turbo.json` to create specific configuration for a package using [Package Configurations](/docs/reference/package-configurations).

- The only valid value for `extends` is `["//"]` to inherit configuration from the root `turbo.json`.
- If `extends` is used in the root `turbo.json`, it will be ignored.

### `globalDependencies`

```jsonc title="./turbo.json"
{
  "globalDependencies": [".env", "tsconfig.json"]
}
```

A list of globs that you want to include in all task hashes. **If any file matching these globs changes, all tasks will miss cache.** Globs are relative to the location of `turbo.json`.

By default, only the root package.json and lockfile are included in [the global hash](/docs/crafting-your-repository/caching) and can't be ignored. Any added `globalDependencies` will also be included in the global hash.

<Callout type="error">
  Globs must be in the repository's source control root. Globs outside of the
  repository aren't supported.
</Callout>

### `globalEnv`

```jsonc title="./turbo.json"
{
  "globalEnv": ["GITHUB_TOKEN", "PACKAGE_VERSION", "NODE_ENV"]
}
```

A list of environment variables that you want to impact the hash of all tasks. Any change to these environment variables will cause all tasks to miss cache.

For more on wildcard and negation syntax, [see the `env` section](#env).

### `globalPassThroughEnv`

```jsonc title="./turbo.json"
{
  "globalPassThroughEnv": ["AWS_SECRET_KEY", "GITHUB_TOKEN"]
}
```

A list of environment variables that you want to make available to tasks. Using this key opts all tasks into [Strict Environment Variable Mode](/docs/crafting-your-repository/using-environment-variables#strict-mode).

Additionally, Turborepo has a built-in set of global passthrough variables for common cases, like operating system environment variables. This includes variables like `HOME`, `PATH`, `APPDATA`, `SHELL`, `PWD`, and more. The full list can be found [in the source code](https://github.com/vercel/turborepo/blob/main/crates/turborepo-lib/src/task_hash.rs).

<Callout
type="warn"
title="Passthrough values do not contribute to hashes for caching"

> If you want changes in these variables to cause cache misses, you will need to
> include them in [`env`](#env) or [`globalEnv`](#globalenv).
> </Callout>

### `ui`

Default: `"stream"`

Select a terminal UI for the repository.

`"tui"` allows for viewing each log at once and interacting with the task. `"stream"` outputs logs as they come in and is not interactive.

```json title="Terminal"
{
  "ui": "tui" | "stream"
}
```

### `noUpdateNotifier`

Default: `false`

When set to `true`, disables the update notification that appears when a new version of `turbo` is available.

```json title="./turbo.json"
{
  "noUpdateNotifier": true
}
```

### `concurrency`

Default: `"10"`

Set/limit the maximum concurrency for task execution. Must be an integer greater than or equal to `1` or a percentage value like `50%`.

- Use `1` to force serial execution (one task at a time).
- Use `100%` to use all available logical processors.
- This option is ignored if the [`--parallel`](/docs/reference/run#--parallel) flag is also passed.

```jsonc title="./turbo.json"
{
  "concurrency": "1"
}
```

### `dangerouslyDisablePackageManagerCheck`

Default: `false`

Turborepo uses your repository's lockfile to determine caching behavior, [Package Graphs](https://turborepo.com/docs/core-concepts/internal-packages), and more. Because of this, we use [the `packageManager` field](https://nodejs.org/api/packages.html#packagemanager) to help you stabilize your Turborepo.

To help with incremental migration or in situations where you can't use the `packageManager` field, you may use `--dangerously-disable-package-manager-check` to opt out of this check and assume the risks of unstable lockfiles producing unpredictable behavior. When disabled, Turborepo will attempt a best-effort discovery of the intended package manager meant for the repository.

```jsonc title="./turbo.json"
{
  "dangerouslyDisablePackageManagerCheck": true
}
```

<Callout type="info">
  You may also opt out of this check via
  [`flag`](/docs/reference/run#--dangerously-disable-package-manager-check) or
  the
  [`TURBO_DANGEROUSLY_DISABLE_PACKAGE_MANAGER_CHECK`](https://turborepo.com/docs/reference/system-environment-variables)
  environment variable.
</Callout>

### `cacheDir`

Default: `".turbo/cache"`

Specify the filesystem cache directory.

```jsonc title="./turbo.json"
{
  "cacheDir": ".turbo/cache"
}
```

### `daemon`

Default: `true`

Turborepo runs a background process to pre-calculate some expensive operations. This standalone process (daemon) is a performance optimization, and not required for proper functioning of `turbo`.

```jsonc title="./turbo.json"
{
  "daemon": true
}
```

<Callout type="good-to-know">
  When running in a CI environment the daemon is always disabled regardless of
  this setting.
</Callout>

### `envMode`

Default: `"strict"`

Turborepo's Environment Modes allow you to control which environment variables are available to a task at runtime:

- `"strict"`: Filter environment variables to only those that are specified in the `env` and `globalEnv` keys in `turbo.json`.
- `"loose"`: Allow all environment variables for the process to be available.

```jsonc title="./turbo.json"
{
  "envMode": "strict"
}
```

Read more about [Environment Modes](/docs/crafting-your-repository/using-environment-variables#environment-modes).

### `tags` <ExperimentalBadge>Experimental</ExperimentalBadge>

```jsonc title="./apps/web/turbo.json"
{
  "tags": ["utils"]
}
```

Adds a tag to a package for use with [Boundaries](/docs/reference/boundaries).

This key only works in [Package Configurations](/docs/reference/package-configurations). Using this key in a root `turbo.json` will result in an error.

## Defining tasks

### `tasks`

Each key in the `tasks` object is the name of a task that can be executed by [`turbo run`](/docs/reference/run). Turborepo will search the packages described in your [Workspace's configuration](/docs/crafting-your-repository/structuring-a-repository#specifying-packages-in-a-monorepo) for scripts in `package.json` with the name of the task.

Using the rest of the configuration described in the task, Turborepo will run the scripts in the described order, caching logs and file outputs in [the `outputs` key](#outputs) when provided.

In the example below, we've defined three tasks under the `tasks` key: `build`, `test`, and `dev`.

```jsonc title="./turbo.json"
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

## Task options

Using the options available in the tasks you define in `tasks`, you can describe how `turbo` will run your tasks.

### `dependsOn`

A list of tasks that are required to complete before the task begins running.

There are three types of `dependsOn` relationships: [dependency relationships](#dependency-relationships), [same-package relationships](#same-package-relationships), and [arbitrary task relationships](#arbitrary-task-relationships).

#### Dependency relationships

Prefixing a string in `dependsOn` with a `^` tells `turbo` that the task must wait for tasks in the package's dependencies to complete first. For example, in the `turbo.json` below:

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

`turbo` starts at the "bottom" of the package graph and recursively visits each package until it finds a package with no internal dependencies. It will then run the `build` task at the end of the dependency chain first, working its way back to the "top" until all `build` tasks are completed in order.

#### Same package relationships

Task names without the `^` prefix describe a task that depends on a different task within the same package. For example, in the `turbo.json` below:

```jsonc title="./turbo.json"
{
  "tasks": {
    "test": {
      "dependsOn": ["lint", "build"]
    }
  }
}
```

The `test` task will only run after the `lint` and `build` tasks have completed **in the same package**.

#### Arbitrary task relationships

Specify a task dependency between specific package tasks.

```json title="./turbo.json"
{
  "tasks": {
    "web#lint": {
      "dependsOn": ["utils#build"]
    }
  }
}
```

In this `turbo.json`, the `web#lint` task will wait for the `utils#build` task to complete.

### `env`

The list of environment variables a task depends on.

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      "env": ["DATABASE_URL"] // Impacts hash of all build tasks
    },
    "web#build": {
      "env": ["API_SERVICE_KEY"] // Impacts hash of web's build task
    }
  }
}
```

<Callout type="good-to-know">
  Turborepo automatically includes environment variables prefixed by common
  frameworks through [Framework
  Inference](/docs/crafting-your-repository/using-environment-variables#framework-inference).
  For example, if your package is a Next.js project, you do not need to specify
  any environment variables that [start with
  `NEXT_PUBLIC_`](https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser).
</Callout>

#### Wildcards

Turborepo supports wildcards for environment variables so you can easily account for all environment variables with a given prefix. For example, the `turbo.json` below include all environment variables that start with `MY_API_` into the hash:

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "env": ["MY_API_*"]
    }
  }
}
```

#### Negation

A leading `!` means that the entire pattern will be negated. For instance, the `turbo.json` below will ignore the `MY_API_URL` variable.

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "env": ["!MY_API_URL"]
    }
  }
}
```

#### Examples

| Pattern    | Description                                                                    |
| ---------- | ------------------------------------------------------------------------------ |
| `"*"`      | Matches every environment variable.                                            |
| `"!*"`     | Excludes every environment variable.                                           |
| `"FOO*"`   | Matches `FOO`, `FOOD`, `FOO_FIGHTERS`, etc.                                    |
| `"FOO\*"`  | Resolves to `"FOO*"` and matches `FOO`, `FOOD`, and `FOO_FIGHTERS`.            |
| `"FOO\\*"` | Matches a single environment variable named `FOO*`.                            |
| `"!FOO*"`  | Excludes all environment variables that start with `FOO`.                      |
| `"\!FOO"`  | Resolves to `"!FOO"`, and excludes a single environment variable named `!FOO`. |
| `"\\!FOO"` | Matches a single environment variable named `!FOO`.                            |
| `"FOO!"`   | Matches a single environment variable named `FOO!`.                            |

### `passThroughEnv`

An allowlist of environment variables that should be made available to this task's runtime, even when in [Strict Environment Mode](/docs/crafting-your-repository/using-environment-variables#strict-mode).

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      // Values will be available within `build` scripts
      "passThroughEnv": ["AWS_SECRET_KEY", "GITHUB_TOKEN"]
    }
  }
}
```

<Callout type="warn">
  Values provided in `passThroughEnv` do not contribute to the cache key for the
  task. If you'd like changes to these variables to cause cache misses, you will
  need to include them in [`env`](#env) or [`globalEnv`](#globalenv).
</Callout>

### `outputs`

A list of file glob patterns relative to the package's `package.json` to cache when the task is successfully completed.

See [`$TURBO_ROOT$`](#turbo_root) if output paths need to be relative to the repository root.

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      // Cache all files emitted to the packages's `dist` directory
      "outputs": ["dist/**"]
    }
  }
}
```

Omitting this key or passing an empty array tells `turbo` to cache nothing (except logs, which are always cached when caching is enabled).

### `cache`

Default: `true`

Defines if task outputs should be cached. Setting `cache` to false is useful for long-running development tasks and ensuring that a task always runs when it is in the task's execution graph.

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputs": [".svelte-kit/**", "dist/**"] // File outputs will be cached
    },
    "dev": {
      "cache": false, // No outputs will be cached
      "persistent": true
    }
  }
}
```

### `inputs`

Default: `[]`, all files in the package that are checked into source control

A list of file glob patterns relative to the package's `package.json` to consider when determining if a package has changed. The following files are **always** considered inputs, even if you try to explicitly ignore them:

- `package.json`
- `turbo.json`
- Package manager lockfiles

Visit the [file glob specification](/docs/reference/globs) for more information on globbing syntax.

```jsonc title="./turbo.json"
{
  "tasks": {
    "test": {
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "test/**/*.ts"]
    }
  }
}
```

<Callout type="warn">
  Using the `inputs` key opts you out of `turbo`'s default behavior of
  considering `.gitignore`. You must reconstruct the globs from `.gitignore` as
  desired or use `$TURBO_DEFAULT$` to build off of the default behavior.
</Callout>

#### `$TURBO_DEFAULT$`

Because specifying an `inputs` key immediately opts out of the default behavior, you may use
the special string `$TURBO_DEFAULT$` within the `inputs` array to restore `turbo`'s default behavior. This allows you to tweak the default behavior for more granularity.

```jsonc title="./turbo.json"
{
  "tasks": {
    "check-types": {
      // Consider all default inputs except the package's README
      "inputs": ["$TURBO_DEFAULT$", "!README.md"]
    }
  }
}
```

#### `$TURBO_ROOT$`

Tasks might reference a file that lies outside of their directory.

Starting a file glob with `$TURBO_ROOT$` will change the glob to be relative to the root of the repository instead of the package directory.

```jsonc title="./turbo.json"
{
  "tasks": {
    "check-types": {
      // Consider all Typescript files in `src/` and the root tsconfig.json as inputs
      "inputs": ["$TURBO_ROOT$/tsconfig.json", "src/**/*.ts"]
    }
  }
}
```

### `outputLogs`

Default: `full`

Set output logging verbosity. Can be overridden by the [`--output-logs`](/docs/reference/run#--output-logs-option) CLI option.

| Option        | Description                       |
| ------------- | --------------------------------- |
| `full`        | Displays all logs                 |
| `hash-only`   | Only show the hashes of the tasks |
| `new-only`    | Only show logs from cache misses  |
| `errors-only` | Only show logs from task failures |
| `none`        | Hides all task logs               |

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputLogs": "new-only"
    }
  }
}
```

### `persistent`

Default: `false`

Label a task as `persistent` to prevent other tasks from depending on long-running processes. Persistent tasks are made [interactive](#interactive) by default.

Because a long-running process won't exit, tasks that would depend on it would never run. Once you've labeled the task as persistent, `turbo` will throw an error if other tasks depend on it.

This option is most useful for development servers or other "watch" tasks.

```jsonc title="./turbo.json"
{
  "tasks": {
    "dev": {
      "persistent": true
    }
  }
}
```

Tasks marked with `persistent` are also `interactive` by default.

### `interactive`

Default: `false` (Defaults to `true` for tasks marked as `persistent`)

Label a task as `interactive` to make it accept inputs from `stdin` in the terminal UI. Must be used with `persistent`.

This option is most useful for scripts that can be manipulated while they are running, like Jest or Vitest.

```jsonc title="./turbo.json"
{
  "tasks": {
    "test:watch": {
      "interactive": true,
      "persistent": true
    }
  }
}
```

### `interruptible`

Default: `false`

Label a `persistent` task as `interruptible` to allow it to be restarted by `turbo watch`.

`turbo watch` watches for changes to your packages and automatically restarts tasks
that are affected. However, if a task is persistent, it will not be restarted by default.
To enable restarting persistent tasks, set `interruptible` to `true`.

### `with`

A list of tasks that will be ran alongside this task. This is most useful for long-running tasks that you want to ensure always run at the same time.

```json title="./apps/web/turbo.json"
{
  "tasks": {
    "dev": {
      "with": ["api#dev"],
      "persistent": true,
      "cache": false
    }
  }
}
```

## Boundaries

The `boundaries` tag allows you to define rules for the [`boundaries` command](/docs/reference/boundaries).

```json title="./turbo.json"
{
  "boundaries": {}
}
```

### `tags`

Each key in the `tags` object is the name of a tag that can be checked with [`turbo boundaries`](/docs/reference/boundaries).

In the configuration object for a tag, you can define rules for dependencies and dependents.

#### `dependencies` and `dependents`

Rules for a tag's dependencies and dependents.

You can add an allowlist and a denylist:

```jsonc title="./turbo.json"
{
  "boundaries": {
    "utils": {
      "dependencies": {
        // permit only packages with the `ui` tag
        "allow": ["ui"],
        // and ban packages with the `unsafe` tag
        "deny": ["unsafe"]
      }
    }
  }
}
```

Both the allowlist and the denylist can be omitted.

```jsonc title="./turbo.json"
{
  "boundaries": {
    "utils": {
      "dependencies": {
        // only packages with the `unsafe` tag are banned, all other packages permitted
        "deny": ["unsafe"]
      }
    }
  }
}
```

Rules can also be added for a tag's dependents, i.e. packages that import this tag.

```jsonc title="./turbo.json"
{
  "boundaries": {
    "utils": {
      "dependents": {
        // only packages with the `web` tag can import packages with the `utils` tag
        "allow": ["web"]
      }
    }
  }
}
```

## Remote caching

The global `remoteCache` option has a variety of fields for configuring remote cache usage

```jsonc title="./turbo.json"
{
  "remoteCache": {}
}
```

### `enabled`

Default: `true`

Enables remote caching.

When `false`, Turborepo will disable all remote cache operations, even if the repo has a valid token.
If true, remote caching is enabled, but still requires the user to login and link their repo to a remote cache.

### `signature`

Default: `false`

Enables signature verification for requests to the remote cache.
When `true`, Turborepo will sign every uploaded artifact using the value of the environment variable `TURBO_REMOTE_CACHE_SIGNATURE_KEY`.
Turborepo will reject any downloaded artifacts that have an invalid signature or are missing a signature.

### `preflight`

Default: `false`

When enabled, any HTTP request will be preceded by an OPTIONS request to determine if the request is supported by the endpoint.

### `timeout`

Default: `30`

Sets a timeout for remote cache operations.
Value is given in seconds and only whole values are accepted.
If `0` is passed, then there is no timeout for any cache operations.

### `uploadTimeout`

Default: `60`

Sets a timeout for remote cache uploads.
Value is given in seconds and only whole values are accepted.
If `0` is passed, then there is no timeout for any remote cache uploads.

### `apiUrl`

Default: `"https://vercel.com"`

Set endpoint for API calls to the remote cache.

### `loginUrl`

Default: `"https://vercel.com"`

Set endpoint for requesting tokens during `turbo login`.

### `teamId`

The ID of the Remote Cache team.
Value will be passed as `teamId` in the querystring for all Remote Cache HTTP calls.
Must start with `team_` or it will not be used.

### `teamSlug`

The slug of the Remote Cache team.
Value will be passed as `slug` in the querystring for all Remote Cache HTTP calls.

import { Callout } from '#components/callout';
import { ExperimentalBadge } from '#components/experimental-badge';

Many monorepos can declare a `turbo.json` in the root directory with a
[task description](/docs/reference/configuration#tasks) that applies to all packages. But, sometimes, a monorepo can contain packages that need to configure their tasks differently.

To accommodate this, Turborepo enables you to extend the root configuration with a `turbo.json` in any package. This flexibility enables a more diverse set of apps and packages to co-exist in a Workspace, and allows package owners to maintain specialized tasks and configuration without affecting other apps and packages of the monorepo.

## How it works

To override the configuration for any task defined in the root `turbo.json`, add
a `turbo.json` file in any package of your monorepo with a top-level `extends`
key:

```jsonc title="./apps/my-app/turbo.json"
{
  "extends": ["//"],
  "tasks": {
    "build": {
      // Custom configuration for the build task in this package
    },
    "special-task": {} // New task specific to this package
  }
}
```

<Callout>
  For now, the only valid value for the `extends` key is `["//"]`. `//` is a
  special name used to identify the root directory of the monorepo.
</Callout>

Configuration in a package can override any of [the configurations for a
task](/docs/reference/configuration#defining-tasks). Any keys that are not included are inherited
from the extended `turbo.json`.

## Examples

### Different frameworks in one Workspace

Let's say your monorepo has multiple [Next.js](https://nextjs.org) apps, and one [SvelteKit](https://kit.svelte.dev)
app. Both frameworks create their build output with a `build` script in their
respective `package.json`. You _could_ configure Turborepo to run these tasks
with a single `turbo.json` at the root like this:

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**", ".svelte-kit/**"]
    }
  }
}
```

Notice that both `.next/**` and `.svelte-kit/**` need to be specified as
[`outputs`](/docs/reference/configuration#outputs), even though Next.js apps do not generate a `.svelte-kit` directory, and
vice versa.

With Package Configurations, you can instead add custom
configuration in the SvelteKit package in `apps/my-svelte-kit-app/turbo.json`:

```jsonc title="./apps/my-svelte-kit-app/turbo.json"
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "outputs": [".svelte-kit/**"]
    }
  }
}
```

and remove the SvelteKit-specific [`outputs`](/docs/reference/configuration#outputs) from the root configuration:

```diff title="./turbo.json"
{
  "tasks": {
    "build": {
-      "outputs": [".next/**", "!.next/cache/**", ".svelte-kit/**"]
+      "outputs": [".next/**", "!.next/cache/**"]
    }
  }
}
```

This not only makes each configuration easier to read, it puts the configuration
closer to where it is used.

### Specialized tasks

In another example, say that the `build` task in one package `dependsOn` a
`compile` task. You could universally declare it as `dependsOn: ["compile"]`.
This means that your root `turbo.json` has to have an empty `compile` task
entry:

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "dependsOn": ["compile"]
    },
    "compile": {}
  }
}
```

With Package Configurations, you can move that `compile` task into the
`apps/my-custom-app/turbo.json`,

```json title="./apps/my-app/turbo.json"
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["compile"]
    },
    "compile": {}
  }
}
```

and remove it from the root:

```diff title="./turbo.json"
{
  "tasks": {
+    "build": {}
-    "build": {
-      "dependsOn": ["compile"]
-    },
-    "compile": {}
  }
}
```

Now, the owners of `my-app`, can have full ownership over their `build` task,
but continue to inherit any other tasks defined at the root.

## Comparison to package-specific tasks

At first glance, Package Configurations may sound a lot like the
[`package#task` syntax](/docs/crafting-your-repository/configuring-tasks#depending-on-a-specific-task-in-a-specific-package) in the root `turbo.json`. The features are
similar, but have one significant difference: when you declare a package-specific task
in the root `turbo.json`, it _completely_ overwrites the baseline task
configuration. With a Package Configuration, the task configuration is merged
instead.

Consider the example of the monorepo with multiple Next.js apps and a Sveltekit
app again. With a package-specific task, you might configure your root
`turbo.json` like this:

```jsonc title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputLogs": "hash-only",
      "inputs": ["src/**"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "my-sveltekit-app#build": {
      "outputLogs": "hash-only", // must duplicate this
      "inputs": ["src/**"], // must duplicate this
      "outputs": [".svelte-kit/**"]
    }
  }
}
```

In this example, `my-sveltekit-app#build` completely overwrites `build` for the
Sveltekit app, so `outputLogs` and `inputs` also need to be duplicated.

With Package Configurations, `outputLogs` and `inputs` are inherited, so
you don't need to duplicate them. You only need to override `outputs` in
`my-sveltekit-app` config.

<Callout type="info">
  Although there are no plans to remove package-specific task configurations, we
  expect that Package Configurations can be used for most use cases instead.
</Callout>

## Boundaries Tags <ExperimentalBadge>Experimental</ExperimentalBadge>

Package Configurations are also used to declare Tags for Boundaries. To do so, add a `tags` field to your `turbo.json`:

```diff title="./apps/my-app/turbo.json"
{
+ "tags": ["my-tag"],
  "extends": ["//"],
  "tasks": {
    "build": {
      "dependsOn": ["compile"]
    },
    "compile": {}
  }
}
```

From there, you can define rules for which dependencies or dependents a tag can have. Check out the [Boundaries documentation](/docs/reference/boundaries#tags) for more details.

## Limitations

Although the general idea is the same as the root `turbo.json`, Package
Configurations come with a set of guardrails that can prevent packages from creating
potentially confusing situations.

### Package Configurations cannot use [the `workspace#task` syntax](/docs/crafting-your-repository/running-tasks) as task entries

The `package` is inferred based on the location of the configuration, and it is
not possible to change configuration for another package. For example, in a
Package Configuration for `my-nextjs-app`:

```jsonc title="./apps/my-nextjs-app/turbo.json"
{
  "tasks": {
    "my-nextjs-app#build": {
      // ❌ This is not allowed. Even though it's
      // referencing the correct package, "my-nextjs-app"
      // is inferred, and we don't need to specify it again.
      // This syntax also has different behavior, so we do not want to allow it.
      // (see "Comparison to package-specific tasks" section)
    },
    "my-sveltekit-app#build": {
      // ❌ Changing configuration for the "my-sveltekit-app" package
      // from Package Configuration in "my-nextjs-app" is not allowed.
    },
    "build": {
      // ✅ just use the task name!
    }
  }
}
```

Note that the `build` task can still depend on a package-specific task:

```jsonc title="./apps/my-nextjs-app/turbo.json"
{
  "tasks": {
    "build": {
      "dependsOn": ["some-pkg#compile"] // [!code highlight]
    }
  }
}
```

### Package Configurations can only override values in the `tasks` key

It is not possible to override [global configuration](/docs/reference/configuration#global-options) like `globalEnv` or `globalDependencies` in a Package Configuration. Configuration that would need to be altered in a Package Configuration is not truly global and should be configured differently.

### Root turbo.json cannot use the `extends` key

To avoid creating circular dependencies on packages, the root `turbo.json`
cannot extend from anything. The `extends` key will be ignored.

## Troubleshooting

In large monorepos, it can sometimes be difficult to understand how Turborepo is
interpreting your configuration. To help, we've added a `resolvedTaskDefinition`
to the [Dry Run](/docs/reference/run#--dry----dry-run) output. If you run `turbo run build --dry-run`, for example, the
output will include the combination of all `turbo.json` configurations that were
considered before running the `build` task.

import { Heading } from 'fumadocs-ui/components/heading';

By setting certain environment variables, you can change Turborepo's behavior. This can be useful for creating specific configurations for different environments and machines.

System environment variables are always overridden by flag values provided directly to your `turbo` commands.

<table id="system-environment-variables-table">
  <thead>
    <tr>
      <th>Variable</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr id="force_color">
      <td>
        <code>FORCE_COLOR</code>
      </td>
      <td>Forces color to be shown in terminal logs</td>
    </tr>
    <tr id="turbo_api">
      <td>
        <code>TURBO_API</code>
      </td>
      <td>
        Set the base URL for{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Cache</a>.
      </td>
    </tr>
    <tr id="turbo_binary_path">
      <td>
        <code>
          <code>TURBO_BINARY_PATH</code>
        </code>
      </td>
      <td>
        Manually set the path to the <code>turbo</code> binary. By default,{' '}
        <code>turbo</code> will automatically discover the binary so you should
        only use this in rare circumstances.
      </td>
    </tr>
    <tr id="turbo_cache">
      <td>
        <code>
          <code>TURBO_CACHE</code>
        </code>
      </td>
      <td>
        Control reading and writing for cache sources. Uses the same syntax as{' '}
        <a href="/docs/reference/run#--cache-options">
          {' '}
          <code>--cache</code>
        </a>
        .
      </td>
    </tr>
    <tr id="turbo_cache_dir">
      <td>
        <code>TURBO_CACHE_DIR</code>
      </td>
      <td>
        Sets the cache directory, similar to using{' '}
        <a href="/docs/reference/run#--cache-dir-path">
          {' '}
          <code>--cache-dir</code>
        </a>{' '}
        flag.
      </td>
    </tr>
    <tr id="turbo_ci_vendor_env_key">
      <td>
        <code>TURBO_CI_VENDOR_ENV_KEY</code>
      </td>
      <td>
        Set a prefix for environment variables that you want
        <strong>excluded</strong> from <a href="/docs/crafting-your-repository/using-environment-variables#framework-inference">
          Framework Inference
        </a>.<span></span>
        <strong>NOTE</strong>: This does not need to be set by the user and should
        be configured automatically by supported platforms.
      </td>
    </tr>
    <tr id="turbo_dangerously_disable_package_manager_check">
      <td>
        <code>TURBO_DANGEROUSLY_DISABLE_PACKAGE_MANAGER_CHECK</code>
      </td>
      <td>
        Disable checking the <code>packageManager</code> field in{' '}
        <code>package.json</code>. You may run into{' '}
        <a href="/docs/reference/run#--dangerously-disable-package-manager-check">
          errors and unexpected caching behavior
        </a>{' '}
        when disabling this check. Use <code>true</code> or <code>1</code> to
        disable.
      </td>
    </tr>
    <tr id="turbo_download_local_enabled">
      <td>
        <code>TURBO_DOWNLOAD_LOCAL_ENABLED</code>
      </td>
      <td>
        Enables global <code>turbo</code> to install the correct local version
        if one is not found.
      </td>
    </tr>
    <tr id="turbo_force">
      <td>
        <code>TURBO_FORCE</code>
      </td>
      <td>
        Set to <code>true</code> to force all tasks to run in full, opting out
        of all caching.
      </td>
    </tr>
    <tr id="turbo_global_warning_disabled">
      <td>
        <code>TURBO_GLOBAL_WARNING_DISABLED</code>
      </td>
      <td>
        Disable warning when global <code>turbo</code> cannot find a local
        version to use.
      </td>
    </tr>
    <tr id="turbo_print_version_disabled">
      <td>
        <code>TURBO_PRINT_VERSION_DISABLED</code>
      </td>
      <td>
        Disable printing the version of <code>turbo</code> that is being
        executed.
      </td>
    </tr>
    <tr id="turbo_log_order">
      <td>
        <code>TURBO_LOG_ORDER</code>
      </td>
      <td>
        Set the <a href="/docs/reference/run#--log-order-option">log order</a>.
        Allowed values are <code>grouped</code> and <code>default</code>.
      </td>
    </tr>
    <tr id="turbo_login">
      <td>
        <code>TURBO_LOGIN</code>
      </td>
      <td>
        Set the URL used to log in to{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Cache</a>. Only
        needed for self-hosted Remote Caches that implement an endpoint that
        dynamically creates tokens.
      </td>
    </tr>
    <tr id="turbo_no_update_notifier">
      <td>
        <code>TURBO_NO_UPDATE_NOTIFIER</code>
      </td>
      <td>
        Remove the update notifier that appears when a new version of{' '}
        <code>turbo</code> is available. You can also use{' '}
        <code>NO_UPDATE_NOTIFIER</code> per ecosystem convention.
      </td>
    </tr>
    <tr id="turbo_platform_env">
      <td>
        <code>TURBO_PLATFORM_ENV</code>
      </td>
      <td>
        A CSV of environment variable keys that are configured in a supported CI
        environment (Vercel). <strong>NOTE</strong>: This variable is meant for
        platforms looking to implement zero-configuration environment variables.
        You are not meant to use this variable as an end user.{' '}
      </td>
    </tr>
    <tr id="turbo_platform_env_disabled">
      <td>
        <code>TURBO_PLATFORM_ENV_DISABLED</code>
      </td>
      <td>
        Disable checking environment variables configured in your{' '}
        <code>turbo.json</code> against those set on your supported platform
      </td>
    </tr>
    <tr id="turbo_preflight">
      <td>
        <code>TURBO_PREFLIGHT</code>
      </td>
      <td>
        Enables sending a preflight request before every cache artifact and
        analytics request. The follow-up upload and download will follow
        redirects. Only applicable when{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Caching</a> is
        configured.
      </td>
    </tr>
    <tr id="turbo_remote_cache_read_only">
      <td>
        <code>TURBO_REMOTE_CACHE_READ_ONLY</code>
      </td>
      <td>
        Prevent writing to the{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Cache</a> - but
        still allow reading.
      </td>
    </tr>
    <tr id="turbo_remote_cache_signature_key">
      <td>
        <code>TURBO_REMOTE_CACHE_SIGNATURE_KEY</code>
      </td>
      <td>
        Sign artifacts with a secret key. For more information, visit{' '}
        <a href="/docs/core-concepts/remote-caching#artifact-integrity-and-authenticity-verification">
          the Artifact Integrity section
        </a>
        .
      </td>
    </tr>
    <tr id="turbo_remote_cache_timeout">
      <td>
        <code>TURBO_REMOTE_CACHE_TIMEOUT</code>
      </td>
      <td>
        Set a timeout in seconds for <code>turbo</code> to get artifacts from{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Cache</a>.
      </td>
    </tr>
    <tr id="turbo_remote_cache_upload_timeout">
      <td>
        <code>TURBO_REMOTE_CACHE_UPLOAD_TIMEOUT</code>
      </td>
      <td>
        Set a timeout in seconds for <code>turbo</code> to upload artifacts to{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Cache</a>.
      </td>
    </tr>
    <tr id="turbo_remote_only">
      <td>
        <code>TURBO_REMOTE_ONLY</code>
      </td>
      <td>Always ignore the local filesystem cache for all tasks.</td>
    </tr>
    <tr id="turbo_run_summary">
      <td>
        <code>TURBO_RUN_SUMMARY</code>
      </td>
      <td>
        Generate a <a href="/docs/reference/run#--summarize">Run Summary</a>{' '}
        when you run tasks.
      </td>
    </tr>
    <tr id="turbo_scm_base">
      <td>
        <code>TURBO_SCM_BASE</code>
      </td>
      <td>
        Base used by <code>--affected</code> when calculating what has changed
        from <code>base...head</code>
      </td>
    </tr>
    <tr id="turbo_scm_head">
      <td>
        <code>TURBO_SCM_HEAD</code>
      </td>
      <td>
        Head used by <code>--affected</code> when calculating what has changed
        from <code>base...head</code>
      </td>
    </tr>
    <tr id="turbo_team">
      <td>
        <code>TURBO_TEAM</code>
      </td>
      <td>
        The account name associated with your repository. When using{' '}
        <a
          href="https://vercel.com/docs/monorepos/remote-caching#vercel-remote-cache"
          rel="noreferrer noopener"
          target="_blank"
        >
          Vercel Remote Cache
        </a>
        , this is [your team's slug](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fsettings&title=Get+team+slug).
      </td>
    </tr>
    <tr id="turbo_teamid">
      <td>
        <code>TURBO_TEAMID</code>
      </td>
      <td>
        The account identifier associated with your repository. When using{' '}
        <a
          href="https://vercel.com/docs/monorepos/remote-caching#vercel-remote-cache"
          rel="noreferrer noopener"
          target="_blank"
        >
          Vercel Remote Cache
        </a>
        , this is your team's ID.
      </td>
    </tr>
    <tr id="turbo_telemetry_message_disabled">
      <td>
        <code>TURBO_TELEMETRY_MESSAGE_DISABLED</code>
      </td>
      <td>
        Disable the message notifying you that{' '}
        <a href="/docs/telemetry">Telemetry</a> is enabled.
      </td>
    </tr>
    <tr id="turbo_token">
      <td>
        <code>TURBO_TOKEN</code>
      </td>
      <td>
        The Bearer token for authentication to access{' '}
        <a href="/docs/core-concepts/remote-caching">Remote Cache</a>.
      </td>
    </tr>
    <tr id="turbo_ui">
      <td>
        <code>TURBO_UI</code>
      </td>
      <td>
        Enables TUI when passed true or 1, disables when passed false or 0.
      </td>
    </tr>
    <tr id="turbo_concurrency">
      <td>
        <code>TURBO_CONCURRENCY</code>
      </td>
      <td>
        Controls{' '}
        <a href="/repo/docs/reference/run#--concurrency-number--percentage">
          concurrency
        </a>{' '}
        settings in run or watch mode.
      </td>
    </tr>
    <tr id="turbo_sso_login_callback_port">
      <td>
        <code>TURBO_SSO_LOGIN_CALLBACK_PORT</code>
      </td>
      <td>
        Override the default port (9789) used for the SSO login callback server
        during authentication.
      </td>
    </tr>
  </tbody>
</table>

## Environment variables in tasks

Turborepo will make the following environment variables available within your tasks while they are executing:

| Variable       | Description                                                                             |
| -------------- | --------------------------------------------------------------------------------------- |
| `TURBO_HASH`   | The hash of the currently running task.                                                 |
| `TURBO_IS_TUI` | When using the [TUI](/docs/reference/configuration#ui), this variable is set to `true`. |

File globs are used throughout Turborepo for configuring which files to include or exclude in various contexts, allowing you to specifically define the files you want `turbo` to use.

## Glob patterns

| Pattern     | Description                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `*`         | Match all files in the directory                                                                     |
| `**`        | Recursively match all files and sub-directories                                                      |
| `some-dir/` | Match the `some-dir` directory and its contents                                                      |
| `some-dir`  | Match a file named `some-dir` or a `some-dir` directory and its contents                             |
| `some-dir*` | Match files and directories that start with `some-dir`, including contents when matching a directory |
| `*.js`      | Match all `.js` files in the directory                                                               |
| `!`         | Negate the whole glob (automatically applies `/**` to the end of the defined glob)                   |

## Examples

| Pattern            | Description                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `dist/**`          | Match all files in the `dist` directory, its contents, and all sub-directories                    |
| `dist/`            | Match the `dist` directory and its contents                                                       |
| `dist`             | Match a file named `dist` or a `dist` directory, its contents, and all sub-directories            |
| `dist/some-dir/**` | Match all files in the `dist/some-dir` directory and all sub-directories in the current directory |
| `!dist`            | Ignore the `dist` directory and all of its contents                                               |
| `dist*`            | Match files and directories that start with `dist`                                                |
| `dist/*.js`        | Match all `.js` files in the `dist` directory                                                     |
| `!dist/*.js`       | Ignore all `.js` files in the `dist` directory                                                    |
| `dist/**/*.js`     | Recursively match all `.js` files in the `dist` directory and its sub-directories                 |
| `../scripts/**`    | Up one directory, match all files and sub-directories in the `scripts` directory                  |

There are three ways to manage the behavior of a `turbo` invocation:

- [Configuration in `turbo.json`](/docs/reference/configuration)
- [System Environment Variables](/docs/reference/system-environment-variables)
- [Flags passed to the CLI invocation](/docs/reference/run)

The three strategies listed above are in order of precedence. Where a flag value is provided, for the same System Environment Variable or `turbo.json` configuration, the value for the flag will be used. Because of this, we recommend using:

- `turbo.json` configuration for defaults
- System Environment Variables for per-environment overrides
- Flags for per-invocation overrides

## Options table

### Caching

<div className="options-cheat-sheet-table">

| Behavior                    | Flags                                                             | Environment Variables                                                                                                 | turbo.json                                                                 |
| --------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Force tasks to run          | [`--force`](/docs/reference/run#--force)                          | [`TURBO_FORCE`](/docs/reference/system-environment-variables#turbo_force)                                             | [`cache`](/docs/reference/configuration#cache)                             |
| Remote Cache timeout        | [`--remote-cache-timeout`](/docs/reference/configuration#timeout) | [`TURBO_REMOTE_CACHE_TIMEOUT`](/docs/reference/system-environment-variables#turbo_remote_cache_timeout)               | [`remoteCache.timeout`](/docs/reference/configuration#timeout)             |
| Remote Cache upload timeout | -                                                                 | [`TURBO_REMOTE_CACHE_UPLOAD_TIMEOUT`](/docs/reference/system-environment-variables#turbo_remote_cache_upload_timeout) | [`remoteCache.uploadTimeout`](/docs/reference/configuration#uploadtimeout) |
| Cache signature key         | -                                                                 | [`TURBO_REMOTE_CACHE_SIGNATURE_KEY`](/docs/reference/system-environment-variables#turbo_remote_cache_signature_key)   | [`signature`](/docs/reference/configuration#signature)                     |
| Preflight request           | [`--preflight`](/docs/reference/run#--preflight)                  | [`TURBO_PREFLIGHT`](/docs/reference/system-environment-variables#turbo_preflight)                                     | [`remoteCache.preflight`](/docs/reference/configuration#preflight)         |
| Remote Cache base URL       | -                                                                 | [`TURBO_API`](/docs/reference/system-environment-variables#turbo_api)                                                 | [`remoteCache.apiUrl`](/docs/reference/configuration#remote-caching)       |
| Cache sources               | [`--cache`](/docs/reference/run#--cache-options)                  | [`TURBO_CACHE`](/docs/reference/system-environment-variables#turbo_cache)                                             | -                                                                          |
| Local cache directory       | [`--cache-dir`](/docs/reference/run#--cache-dir-path)             | [`TURBO_CACHE_DIR`](/docs/reference/system-environment-variables#turbo_cache_dir)                                     | [`cacheDir`](/docs/reference/configuration#cachedir)                       |

</div>

### Messages

<div className="options-cheat-sheet-table">

| Behavior                       | Flags | Environment Variables                                                                                               | turbo.json                                                                                |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Disable version print          | -     | [`TURBO_PRINT_VERSION_DISABLED`](/docs/reference/system-environment-variables#turbo_print_version_disabled)         | -                                                                                         |
| Disable telemetry message      | -     | [`TURBO_TELEMETRY_MESSAGE_DISABLED`](/docs/reference/system-environment-variables#turbo_telemetry_message_disabled) | -                                                                                         |
| Disable global `turbo` warning | -     | [`TURBO_GLOBAL_WARNING_DISABLED`](/docs/reference/system-environment-variables#turbo_global_warning_disabled)       | -                                                                                         |
| No update notifier             | -     | [`TURBO_NO_UPDATE_NOTIFIER`](/docs/reference/system-environment-variables#turbo_no_update_notifier)                 | [`noUpdateNotifier`](https://turborepo.com/docs/reference/configuration#noupdatenotifier) |

</div>

### Task running and logs

<div className="options-cheat-sheet-table">

| Behavior                          | Flags                                                                                                            | Environment Variables                                                                                                                             | turbo.json                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Terminal UI                       | [`--ui`](/docs/reference/run#--ui)                                                                               | [`TURBO_UI`](/docs/reference/system-environment-variables#turbo_ui)                                                                               | [`ui`](/docs/reference/configuration#ui)                                                                       |
| Run affected tasks                | [`--affected`](/docs/reference/run#--affected)                                                                   | -                                                                                                                                                 | -                                                                                                              |
| Disable package manager check     | [`--dangerously-disable-package-manager-check`](/docs/reference/run#--dangerously-disable-package-manager-check) | [`TURBO_DANGEROUSLY_DISABLE_PACKAGE_MANAGER_CHECK`](/docs/reference/system-environment-variables#turbo_dangerously_disable_package_manager_check) | [`dangerouslyDisablePackageManagerCheck`](/docs/reference/configuration#dangerouslydisablepackagemanagercheck) |
| Affected base ref                 | -                                                                                                                | [`TURBO_SCM_BASE`](/docs/reference/system-environment-variables#turbo_scm_base)                                                                   | -                                                                                                              |
| Affected head ref                 | -                                                                                                                | [`TURBO_SCM_HEAD`](/docs/reference/system-environment-variables#turbo_scm_head)                                                                   | -                                                                                                              |
| Only run directly specified tasks | [`--only`](/docs/reference/run#--only)                                                                           | -                                                                                                                                                 | -                                                                                                              |
| Task concurrency                  | [`--concurrency`](/docs/reference/run#--concurrency-number--percentage)                                          | -                                                                                                                                                 | -                                                                                                              |
| Task log order                    | [`--log-order`](/docs/reference/run#--log-order-option)                                                          | [`TURBO_LOG_ORDER`](/docs/reference/system-environment-variables#turbo_log_order)                                                                 | -                                                                                                              |
| Current working directory         | [`--cwd`](/docs/reference/run#--cwd-path)                                                                        | -                                                                                                                                                 | -                                                                                                              |
| Streamed logs prefix              | [`--log-prefix`](/docs/reference/run#--log-prefix-option)                                                        | -                                                                                                                                                 | -                                                                                                              |
| Task logs output level            | [`--output-logs-option`](/docs/reference/run#--output-logs-option)                                               | -                                                                                                                                                 | [`outputLogs`](/docs/reference/configuration#outputlogs)                                                       |
| Global inputs                     | [`--global-deps`](/docs/reference/run#--global-deps-file-glob)                                                   | -                                                                                                                                                 | [`globalDependencies`](/docs/reference/configuration#globaldependencies)                                       |
| Terminal colors                   | [`--color`](/docs/reference#--color)                                                                             | [FORCE_COLOR](/docs/reference/system-environment-variables#force_color)                                                                           | -                                                                                                              |

</div>

### Environment variables

<div className="options-cheat-sheet-table">

| Behavior                      | Flags                                                                | Environment Variables                                                                             | turbo.json                                         |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Environment variable mode     | [`--env-mode`](/docs/reference/run#--env-mode-option)                | -                                                                                                 | [`envMode`](/docs/reference/configuration#envmode) |
| Vendor environment variables  | -                                                                    | [`TURBO_CI_VENDOR_ENV_KEY`](/docs/reference/system-environment-variables#turbo_ci_vendor_env_key) | -                                                  |
| Framework variable exceptions | [`--framework-inference`](/docs/reference/run#--framework-inference) | -                                                                                                 | -                                                  |

</div>

### Debugging outputs

<div className="options-cheat-sheet-table">

| Behavior            | Flags                                              | Environment Variables                                                                 | turbo.json |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------- |
| Run Summaries       | [`--summarize`](/docs/reference/run#--summarize)   | [`TURBO_RUN_SUMMARY`](/docs/reference/system-environment-variables#turbo_run_summary) | -          |
| Graph visualization | [`--graph`](/docs/reference/run#--graph-file-type) | -                                                                                     | -          |
| Dry run             | [`--dry`](/docs/reference/run#--dry----dry-run)    | -                                                                                     | -          |

</div>

### Authentication

<div className="options-cheat-sheet-table">

| Behavior                                | Flags                                    | Environment Variables                                                       | turbo.json                                                       |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Login URL                               | -                                        | [`TURBO_LOGIN`](/docs/reference/system-environment-variables#turbo_login)   | [`remoteCache.loginUrl`](/docs/reference/configuration#loginurl) |
| Team name (for multi-team Remote Cache) | [`--team`](/docs/reference/run#--team)   | [`TURBO_TEAM`](/docs/reference/system-environment-variables#turbo_team)     | -                                                                |
| Team ID (for multi-team Remote Cache)   | -                                        | [`TURBO_TEAMID`](/docs/reference/system-environment-variables#turbo_teamid) | -                                                                |
| Authentication token                    | [`--token`](/docs/reference/run#--token) | [`TURBO_TOKEN`](/docs/reference/system-environment-variables#turbo_token)   | -                                                                |

</div>

### Other

<div className="options-cheat-sheet-table">

| Behavior               | Flags                                                                      | Environment Variables                                                                                       | turbo.json                                       |
| ---------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Binary path            | -                                                                          | [`TURBO_BINARY_PATH`](/docs/reference/system-environment-variables#turbo_binary_path)                       | -                                                |
| Download local `turbo` | -                                                                          | [`TURBO_DOWNLOAD_LOCAL_ENABLED`](/docs/reference/system-environment-variables#turbo_download_local_enabled) | -                                                |
| Daemon                 | [`--daemon` / `--no-daemon`](/docs/reference/run#--daemon-and---no-daemon) | -                                                                                                           | [`daemon`](/docs/reference/configuration#daemon) |

</div>

import { Callout } from '#components/callout';

Run tasks specified in `turbo.json`.

```bash title="Terminal"
turbo run [tasks] [options] [-- [args passed to tasks]]
```

- **[tasks]**: Turborepo can run one or many tasks at the same time. To run a task through `turbo`, it must be specified in `turbo.json`.
- **[options]**: Options are used to control the behavior of the `turbo run` command. Available flag options are described below.
- **[-- [args passed to tasks]]**: You may also pass arguments to the underlying scripts. Note that all arguments will be passed to all tasks that are named in the run command.

<Callout type="good-to-know">
  `turbo run` is aliased to `turbo`. `turbo run build lint check-types` is the
  same as `turbo build lint check-types`. We recommend [using `turbo run` in CI
  pipelines](/docs/crafting-your-repository/constructing-ci#use-turbo-run-in-ci)
  and `turbo` with [global `turbo`
  locally](/docs/getting-started/installation#global-installation) for ease of
  use.
</Callout>

If no tasks are provided, `turbo` will display what tasks are available for the packages in the repository.

```bash title="Terminal"
turbo run
```

## Options

### `--affected`

Filter to only packages that are affected by changes on the current branch.

```bash title="Terminal"
turbo run build lint test --affected
```

By default, the flag is equivalent to `--filter=...[main...HEAD]`. This considers changes between `main` and `HEAD` from Git's perspective.

<Callout type="warn">
  The comparison requires everything between base and head to exist in the
  checkout. If the checkout is too shallow, then all packages will be considered
  changed.

For example, setting up Git to check out with `--filter=blob:none --depth=0` will ensure `--affected` has the right history to work correctly.

</Callout>

You can override the default base and head with their respective [System Environment Variables](/docs/reference/system-environment-variables).

```bash title="Terminal"
# Override Git comparison base
TURBO_SCM_BASE=development turbo run build --affected

# Override Git comparison head
TURBO_SCM_HEAD=your-branch turbo run build --affected
```

### `--cache <options>`

Default: `local:rw,remote:rw`

Specify caching sources for the run. Accepts a comma-separated list of options:

- `local`: Use the local filesystem cache
- `remote`: Use the Remote Cache

When a caching source is omitted, reading and writing are both disabled.

Cache sources use the following values:

- `rw`: Read and write
- `r`: Read only
- `w`: Write only
- None (`local:`) : Does not use cache. Equivalent to omitting the cache source option.

```bash title="Terminal"
# Read from and write to local cache. Only read from Remote Cache.
turbo run build --cache=local:rw,remote:r

# Only read from local cache. Read from and write to Remote Cache.
turbo run build --cache=local:r,remote:rw

# Read from and write to local cache. No Remote Cache activity.
turbo run build --cache=local:rw

# Do not use local cache. Only read from Remote Cache.
turbo run build --cache=local:,remote:r
```

### `--cache-dir <path>`

Default: `.turbo/cache`

Specify the filesystem cache directory.

```bash title="Terminal"
turbo run build --cache-dir="./my-cache"
```

<Callout type="warn">
  Ensure the directory is in your `.gitignore` when changing it.
</Callout>

The same behavior can also be set via the `TURBO_CACHE_DIR=example/path` system variable.

### `--concurrency <number | percentage>`

Default: `10`

Set/limit the maximum concurrency for task execution. Must be an integer greater than or equal to `1` or a percentage value like `50%`.

- Use `1` to force serial execution (one task at a time).
- Use `100%` to use all available logical processors.
- This option is ignored if the [`--parallel`](#--parallel) flag is also passed.

```bash title="Terminal"
turbo run build --concurrency=50%
turbo run test --concurrency=5
```

### `--continue[=<option>]`

Default: `never`

Specify how `turbo` should handle current and pending tasks in the presence of an error (e.g. non-zero exit code from a task).

- When `--continue=never` and an error occurs, `turbo` will cancel all tasks.
- When `--continue=dependencies-successful` and an error occurs, `turbo` will cancel dependent tasks. Tasks whose dependencies have succeeded will continue to run.
- When `--continue=always` and an error occurs, `turbo` will continue running all tasks, even those whose dependencies have failed.
- When `--continue` is specified without a value, it will default to `always`.

In all cases, `turbo` will exit with the highest exit code value encountered during execution.

```bash title="Terminal"
turbo run build --continue
```

### `--cwd <path>`

Default: Directory of root `turbo.json`

Set the working directory of the command.

```bash title="Terminal"
turbo run build --cwd=./somewhere/else/in/your/repo
```

### `--dangerously-disable-package-manager-check`

Turborepo uses your repository's lockfile to determine caching behavior, [Package Graphs](https://turborepo.com/docs/core-concepts/internal-packages), and more. Because of this, we use [the `packageManager` field](https://nodejs.org/api/packages.html#packagemanager) to help you stabilize your Turborepo.

To help with incremental migration or in situations where you cannot use the `packageManager` field, you may use `--dangerously-disable-package-manager-check` to opt out of this check and assume the risks of unstable lockfiles producing unpredictable behavior. When disabled, Turborepo will attempt a best-effort discovery of the intended package manager meant for the repository.

<Callout type="info">
  You may also opt out of this check using [configuration in
  `turbo.json`](/docs/reference/configuration#dangerouslydisablepacakgemanagercheck)
  or the
  [`TURBO_DANGEROUSLY_DISABLE_PACKAGE_MANAGER_CHECK`](/docs/reference/system-environment-variables)
  environment variable for broader coverage.
</Callout>

### `--dry / --dry-run`

Instead of executing tasks, display details about the packages and tasks that would be run.

Specify `--dry=json` to get the output in JSON format.

Task details include useful information like (list is non-exhaustive):

| Field                        | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `taskId`                     | ID for the task, in the format of `package-name#task-name`             |
| `task`                       | The name of the task to be executed                                    |
| `package`                    | The package in which to run the task                                   |
| `hash`                       | The hash of the task (used for caching)                                |
| `hashOfExternalDependencies` | The global hash                                                        |
| `command`                    | The command used to run the task                                       |
| `inputs`                     | List of file inputs considered for hashing                             |
| `outputs`                    | List of file outputs that were cached                                  |
| `dependencies`               | Tasks that must run **before** this task                               |
| `dependents`                 | Tasks that must run **after** this task                                |
| `environmentVariables`       | Lists of environment variables specified in `env` and `passThroughEnv` |

### `--env-mode <option>`

`type: string`

Controls the available environment variables in the task's runtime.

<Callout type="good-to-know">
  `PATH`, `SHELL`, and `SYSTEMROOT` are always available to the task.
</Callout>

| option                      | description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| [strict](#strict) (Default) | Only allow explicitly listed environment variables to be available |
| [loose](#loose)             | Allow **all** environment variables to be available                |

```bash title="Terminal"
turbo run build --env-mode=loose
```

The same behavior can also be set via the `TURBO_ENV_MODE=strict` system variable.

#### `strict`

Only environment variables specified in the following keys are
available to the task:

- [`env`](/docs/reference/configuration#env)
- [`passThroughEnv`](/docs/reference/configuration#passthroughenv)
- [`globalEnv`](/docs/reference/configuration#globalenv)
- [`globalPassThroughEnv`](/docs/reference/configuration#globalpassthroughenv)

If Strict Mode is specified or inferred, **all** tasks are run in `strict` mode,
regardless of their configuration.

#### `loose`

All environment variables on the machine are made available to the task's runtime.

<Callout type="warn">
  This can be dangerous when environment variables are not accounted for in
  caching with the keys listed in `strict` above. You're much more likely to
  restore a version of your package with wrong environment variables from cache
  in `loose` mode.
</Callout>

### `--filter <string>`

Specify targets to execute from your repository's graph. Multiple filters can be combined to select distinct sets of targets.

Filters can be combined to create combinations of packages, directories, and git commits.

| Target type | Description                                                                                                                | Example                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Package     | Select a package by its name in `package.json`.                                                                            | `turbo run build --filter=ui`       |
| Directory   | Specify directories to capture a list of packages to run tasks. **When used with other filters, must be wrapped in `{}`**. | `turbo run build --filter=./apps/*` |
| Git commits | Using Git specifiers, specify packages with source control changes. **Must be wrapped in `[]`**.                           | `turbo run build --filter=[HEAD^1]` |

<Callout type="good-to-know">`-F` is an alias for `--filter`.</Callout>

#### Microsyntaxes for filtering

- `!`: Negate targets from the selection.
- `...` using packages: Select all packages in the [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph) relative to the target. Using `...` **before** the package name will select **dependents** of the target while using `...` **after** the package name will select **dependencies** of the target.
- `...` using Git commits: Select a range using `[<from commit>]...[<to commit>]`.
- `^`: Omit the target from the selection when using `...`.

For in-depth discussion and practical use cases of filtering, visit [the Running Tasks page](/docs/crafting-your-repository/running-tasks).

#### Using a task identifier

You can also run a specific task for a specific package in the format of `package-name#task-name`.

```bash title="Terminal"
turbo run web#lint
```

<Callout type="good-to-know">
  This will also run the task's dependencies. To run a task without its
  dependencies, use [the `--only` flag](#--only).
</Callout>

#### Advanced filtering examples

You can combine multiple filters to further refine your targets. Multiple filters are combined as a union, with negated filters removing packages from the result of the union.

```bash title="Terminal"
# Any packages in `apps` subdirectories that have changed since the last commit
turbo run build --filter={.apps/*}[HEAD^1]

# Any packages in `apps` subdirectories except ./apps/admin
turbo run build --filter=./apps/* --filter=!./apps/admin

# Run the build task for the docs and web packages
turbo run build --filter=docs --filter=web

# Build everything that depends on changes in branch 'my-feature'
turbo run build --filter=...[origin/my-feature]

# Build everything that depends on changes between two Git SHAs
turbo run build --filter=[a1b2c3d...e4f5g6h]

# Build '@acme/ui' if:
# - It or any of its dependencies have changed since the previous commit
turbo run build --filter=@acme/ui...[HEAD^1]

# Test each package that is:
# - In the '@acme' scope
# - Or, in the 'packages' directory
# - Or, changed since the previous commit
turbo run test --filter=@acme/*{./packages/*}[HEAD^1]
```

### `--force`

Ignore existing cached artifacts and re-execute all tasks.

<Callout type="good-to-know">
  `--force` will overwrite existing task caches.
</Callout>

```bash title="Terminal"
turbo run build --force
```

The same behavior can also be set via [the `TURBO_FORCE` environment variable](/docs/reference/system-environment-variables).

### `--framework-inference`

Default: `true`

Specify whether or not to do [Framework Inference](/docs/crafting-your-repository/using-environment-variables#framework-inference) for tasks.

When `false`, [automatic environment variable inclusion](/docs/crafting-your-repository/using-environment-variables#framework-inference) is disabled.

```bash title="Terminal"
turbo run build --framework-inference=false
```

### `--global-deps <file glob>`

Specify glob of global filesystem dependencies to be hashed. Useful for `.env` and files in the root directory that impact multiple packages.

```bash title="Terminal"
turbo run build --global-deps=".env"
turbo run build --global-deps=".env.*" --global-deps=".eslintrc" --global-deps="jest.config.ts"
```

<Callout type="info">
  We recommend specifying file globs that you'd like to include your hashes in
  [the `globalDependencies` key](/docs/reference/configuration#globaldeps) in
  `turbo.json` to make sure they are always accounted for.
</Callout>

### `--graph <file type>`

Default: `jpg`

This command will generate an `svg`, `png`, `jpg`, `pdf`, `json`, `html`, or [other supported output formats](https://graphviz.org/doc/info/output.html) of the current task graph.

If [Graphviz](https://graphviz.org/) is not installed, or no filename is provided, this command prints the dot graph to `stdout`.

```bash title="Terminal"
turbo run build --graph
turbo run build test lint --graph=my-graph.svg
```

<Callout type="info">
  **Known Bug**: All possible task nodes will be added to the graph at the
  moment, even if that script does not actually exist in a given package. This
  has no impact on execution, but the graph may overstate the number of packages
  and tasks involved.
</Callout>

### `--log-order <option>`

Default: `auto`

Set the ordering for log output.

By default, `turbo` will use `grouped` logs in CI environments and `stream` logs everywhere else. This flag is not applicable when using [the terminal UI](https://turborepo.com/docs/reference/configuration#ui).

```bash title="Terminal"
turbo run build --log-order=stream
```

| Option    | Description                                 |
| --------- | ------------------------------------------- |
| `stream`  | Show output as soon as it is available      |
| `grouped` | Group output by task                        |
| `auto`    | `turbo` decides based on its own heuristics |

### `--log-prefix <option>`

Default: `auto`

Control the `<package>:<task>:` prefix for log lines produced when running tasks.

```bash title="Terminal"
turbo run dev --log-prefix=none
```

| Option   | Description                                 |
| -------- | ------------------------------------------- |
| `prefix` | Force prepending the prefix to logs         |
| `none`   | No prefixes                                 |
| `auto`   | `turbo` decides based on its own heuristics |

### `--no-cache`

<Callout type="warn" title="Deprecated">
  This flag is deprecated and will be removed in a future major release. Please
  use the [`--cache`](#--cache-options) flag instead.
</Callout>

Default `false`

Do not cache results of the task.

```bash title="Terminal"
turbo run dev --no-cache
```

### `--daemon` and `--no-daemon`

`turbo` can run a background process to pre-calculate values used for determining work that needs to be done. This standalone process (daemon) is an optimization, and not required for proper functioning of `turbo`.

The default daemon usage is set for your repository using [the `daemon` field in `turbo.json`](/docs/reference/configuration#daemon). Passing `--daemon` requires `turbo` to use the standalone process, while `--no-daemon` instructs `turbo` to avoid using or creating the standalone process.

The same behavior can also be set via the `TURBO_DAEMON=true` system variable.

### `--output-logs <option>`

Default: `full`

Set type of output logging, overriding [`outputLogs`](/docs/reference/configuration#outputlogs) if it's defined in `turbo.json`.

```bash title="Terminal"
turbo run build --output-logs=errors-only
```

| Option        | Description                       |
| ------------- | --------------------------------- |
| `full`        | Displays all logs                 |
| `hash-only`   | Only show the hashes of the tasks |
| `new-only`    | Only show logs from cache misses  |
| `errors-only` | Only show logs from task failures |
| `none`        | Hides all task logs               |

### `--only`

Default: `false`

Restricts execution to include specified tasks only.

#### Example

Given this `turbo.json`:

```json title="./turbo.json"
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

```bash title="Terminal"
turbo run test --only
```

The command will _only_ execute the `test` tasks in each package. It will not run `build`.

Additionally, `--only` will only run tasks in specified packages, excluding dependencies. For example, `turbo run build --filter=web --only`, will **only** run the `build` script in the `web` package.

### `--parallel`

Default: `false`

Run commands in parallel across packages, ignoring the task dependency graph.

```bash title="Terminal"
turbo run lint --parallel
turbo run dev --parallel
```

<Callout type="info">
  The `--parallel` flag is typically used for long-running "dev" or "watch"
  tasks that don't exit. Starting in `turbo@1.7`, we recommend configuring these
  tasks using [`persistent`](/docs/reference/configuration#persistent) instead.
</Callout>

### `--preflight`

Only applicable when Remote Caching is configured. Enables sending a preflight request before every cache artifact and analytics request. The follow-up upload and download will follow redirects.

```bash title="Terminal"
turbo run build --preflight
```

The same behavior can also be set via the `TURBO_PREFLIGHT=true` system variable.

### `--profile`

Generates a trace of the run in Chrome Tracing format that you can use to analyze performance.

You must provide a verbosity flag (`-v`, `-vv`, or `-vvv`) with `--profile` to produce a trace.

```bash title="Terminal"
turbo run build --profile=profile.json -vvv
```

Profiles can be viewed in a tool like [Perfetto](https://ui.perfetto.dev/).

### `--remote-cache-timeout`

Default: `30`

Set the timeout for Remote Cache operations in seconds.

```bash title="Terminal"
turbo run build --remote-cache-timeout=60
```

### `--remote-only`

<Callout type="warn" title="Deprecated">
  This flag is deprecated and will be removed in a future major release. Please
  use the [`--cache`](#--cache-options) flag instead.
</Callout>

Default: `false`

Ignore the local filesystem cache for all tasks, using Remote Cache for reading and caching task outputs.

```bash title="Terminal"
turbo run build --remote-only
```

### `--summarize`

Generates a JSON file in `.turbo/runs` containing metadata about the run, including:

- Affected packages
- Executed tasks (including their timings and hashes)
- All the files included in the cached artifact

```bash title="Terminal"
turbo run build --summarize
```

This flag can be helpful for debugging to determine things like:

- How `turbo` interpreted your glob syntax for `inputs` and `outputs`
- What inputs changed between two task runs to produce a cache miss
- How task timings changed over time

<Callout type="info" title="Summaries viewer">
  While there is not a Turborepo-native Run Summaries UI viewer, we encourage
  you to use the community-built
  [https://turbo.nullvoxpopuli.com](https://turbo.nullvoxpopuli.com) if you
  would like to view your Run Summaries as a web view.
</Callout>

### `--token`

A bearer token for Remote Caching. Useful for running in non-interactive shells in combination with the `--team` flag.

```bash title="Terminal"
turbo run build --team=my-team --token=xxxxxxxxxxxxxxxxx
```

This value can also be set using [the `TURBO_TOKEN` system variable](/docs/reference/system-environment-variables). If both are present, the flag value will override the system variable.

<Callout type="good-to-know">
  If you are using [Vercel Remote
  Cache](https://vercel.com/docs/monorepos/remote-caching) and building your
  project on Vercel, you do not need to use this flag. This value will be
  automatically set for you.
</Callout>

### `--team`

The slug of the Remote Cache team. Useful for running in non-interactive shells in combination with the `--token` flag.

```bash title="Terminal"
turbo run build --team=my-team
turbo run build --team=my-team --token=xxxxxxxxxxxxxxxxx
```

This value can also be set using [the `TURBO_TEAM` system variable](/docs/reference/system-environment-variables). If both are present, the flag value will override the system variable.

### `--ui`

Specify the UI to use for output. Accepts `stream` or `tui`.

### `--verbosity`

To specify log level, use `--verbosity=<num>` or `-v, -vv, -vvv`.

| Level | Flag value      | Shorthand |
| ----- | --------------- | --------- |
| Info  | `--verbosity=1` | `-v`      |
| Debug | `--verbosity=2` | `-vv`     |
| Trace | `--verbosity=3` | `-vvv`    |

```bash title="Terminal"
turbo run build --verbosity=2
turbo run build -vvv
```

Re-run tasks in your repository, based on code changes.

```bash title="Terminal"
turbo watch [tasks]
```

`turbo watch` is dependency-aware, meaning tasks will re-run in the order [configured in `turbo.json`](/docs/reference/configuration).

If no tasks are provided, `turbo` will display what tasks are available for the packages in the repository.

```bash title="Terminal"
turbo watch
```

## Using `turbo watch` with persistent tasks

Persistent tasks are marked with [`"persistent": true`](/docs/reference/configuration#persistent), meaning they won't exit. Because of this, they cannot be depended on in your task graph.

This means that persistent tasks will be ignored when using `turbo watch`, working the same way they do with [`turbo run`](/docs/reference/run), allowing persistent and non-persistent tasks to be run at the same time.

### Dependency-aware persistent tasks

When your script has a built-in watcher (like `next dev`) capable of detecting changes in dependencies, you don't need to use `turbo watch`. Instead, use your script's built-in watcher and mark the task as long-running using [`"persistent": true`](/docs/reference/configuration#persistent).

### Persistent tasks without dependency awareness

Some tools aren't monorepo-friendly, and do not hot-reload modules in dependencies. In those cases, you should
mark the task as [`interruptible: true`](/docs/reference/configuration#interruptible) to have `turbo watch`
restart the task when relevant changes are detected.

## Limitations

### Caching

Caching tasks with Watch Mode is currently experimental, under the `--experimental-write-cache` flag.

```bash title="Terminal"
turbo watch your-tasks --experimental-write-cache
```

### Task outputs

If you have tasks that write to files checked into source control, there is a possibility that Watch Mode will run in an infinite loop. This is because Watch Mode watches your
files for changes and will re-run tasks in packages that have changed. If a task creates a change, then that will trigger the task again.

Watch Mode has some logic to prevent this from happening using file hashes, but it isn't foolproof. To avoid this issue, we recommend removing any task outputs from git.

import { File, Folder, Files } from '#components/files';

Generate a partial monorepo for a target package. The output will be placed into a directory named `out` containing the following:

- The full source code of all internal packages needed to build the target.
- A pruned lockfile containing the subset of the original lockfile needed to build the target.
- A copy of the root `package.json`.

```bash title="Terminal"
turbo prune [package]
```

### Example

Starting with a repository with the following structure:

<Files>
  <File name="package.json" />
  <File name="pnpm-lock.yaml" />
  <Folder name="apps" defaultOpen>
    <Folder name="admin">
      <File name="package.json" />
      <File name="next-env.d.ts" />
      <File name="next.config.js" />
      <Folder name="src">
        <Folder name="app">
          <File name="page.tsx" />
        </Folder>
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
    <Folder name="frontend">
      <File name="package.json" />
      <File name="next-env.d.ts" />
      <File name="next.config.js" />
      <Folder name="src">
        <Folder name="app">
          <File name="page.tsx" />
        </Folder>
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
  </Folder>
  <Folder name="packages" defaultOpen>
    <Folder name="scripts">
      <File name="package.json" />
      <Folder name="src">
        <File name="index.tsx" />
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
    <Folder name="shared">
      <File name="package.json" />
      <Folder name="src">
        <Folder name="__tests__">
          <File name="sum.test.ts" />
          <File name="tsconfig.json" />
        </Folder>
        <File name="index.ts" />
        <File name="sum.ts" />
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
    <Folder name="ui">
      <File name="package.json" />
      <Folder name="src">
        <File name="index.tsx" />
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
    <Folder name="utils">
      <File name="package.json" />
      <Folder name="src">
        <File name="index.tsx" />
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
  </Folder>
</Files>

Run `turbo prune frontend` to generate a pruned workspace for the `frontend` application in an `out` directory:

<Files>
  <File name="package.json" />
  <File name="pnpm-lock.yaml (partial)" />
  <Folder name="apps" defaultOpen>
    <Folder name="frontend">
      <File name="package.json" />
      <File name="next-env.d.ts" />
      <File name="next.config.js" />
      <Folder name="src">
        <Folder name="app">
          <File name="page.tsx" />
        </Folder>
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
  </Folder>
  <Folder name="packages" defaultOpen>
    <Folder name="shared">
      <File name="package.json" />
      <Folder name="src">
        <Folder name="__tests__">
          <File name="sum.test.ts" />
          <File name="tsconfig.json" />
        </Folder>
        <File name="index.ts" />
        <File name="sum.ts" />
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
    <Folder name="ui">
      <File name="package.json" />
      <Folder name="src">
        <File name="index.tsx" />
      </Folder>
      <File name="tsconfig.json" />
    </Folder>
  </Folder>
</Files>

### Options

#### `--docker`

Defaults to `false`.

Alter the output directory to make it easier to use with [Docker best practices and layer caching](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/). The directory will contain:

- A folder named `json` with the pruned workspace's `package.json` files.
- A folder named `full` with the pruned workspace's full source code for the internal packages needed to build the target.
- A pruned lockfile containing the subset of the original lockfile needed to build the target.

Using the same example from above, running `turbo prune frontend --docker` will generate the following:

<Files>
  <File name="pnpm-lock.yaml (partial)" />
  <Folder name="full" defaultOpen>
    <File name="package.json (from repo root)" />
    <Folder name="apps">
      <Folder name="frontend">
        <File name="package.json" />
        <File name="next-env.d.ts" />
        <File name="next.config.js" />
        <Folder name="src">
          <Folder name="app">
            <File name="page.tsx" />
          </Folder>
        </Folder>
        <File name="tsconfig.json" />
      </Folder>
    </Folder>
    <Folder name="packages">
      <Folder name="shared">
        <File name="package.json" />
        <Folder name="src">
          <Folder name="__tests__">
            <File name="sum.test.ts" />
            <File name="tsconfig.json" />
          </Folder>
          <File name="index.ts" />
          <File name="sum.ts" />
        </Folder>
        <File name="tsconfig.json" />
      </Folder>
      <Folder name="ui">
        <File name="package.json" />
        <Folder name="src">
          <File name="index.tsx" />
        </Folder>
        <File name="tsconfig.json" />
      </Folder>
    </Folder>
  </Folder>
  <Folder name="json" defaultOpen>
    <File name="package.json (from repo root)" />
    <Folder name="apps" defaultOpen>
      <Folder name="frontend" defaultOpen>
        <File name="package.json" />
      </Folder>
    </Folder>
    <Folder name="packages" defaultOpen>
      <Folder name="ui" defaultOpen>
        <File name="package.json" />
      </Folder>
      <Folder name="shared" defaultOpen>
        <File name="package.json" />
      </Folder>
    </Folder>

  </Folder>
</Files>

#### `--out-dir <path>`

Defaults to `./out`.

Customize the directory the pruned output is generated in.

#### `--use-gitignore[=<bool>]`

Default: `true`

Respect `.gitignore` file(s) when copying files to the output directory.

### Comparison to `pnpm deploy`

While both `turbo prune` and [`pnpm deploy`](https://pnpm.io/cli/deploy) are used to isolate packages in a monorepo, they serve different purposes and produce different outputs.

Where `turbo prune` generates a partial monorepo, `pnpm deploy` generates a directory that only contains the contents of the target package.

The `pnpm deploy` generated directory has a self-contained `node_modules` with hard linked internal dependencies.
This results in a portable package that can be directly copied to a server and used without additional steps.
The repository structure is not retained, as the focus is on producing a standalone deployable package.

import { ExperimentalBadge } from '#components/experimental-badge';
import { Callout } from '#components/callout';

<ExperimentalBadge>Experimental</ExperimentalBadge>

Boundaries ensure that Turborepo features work correctly by checking for package manager Workspace violations.

```bash title="Terminal"
turbo boundaries
```

<Callout title="Boundaries RFC">
  This feature is experimental, and we're looking for your feedback on [the
  Boundaries RFC](https://github.com/vercel/turborepo/discussions/9435).
</Callout>

This command will notify for two types of violations:

- Importing a file outside of the package's directory
- Importing a package that is not specified as a dependency in the package's `package.json`

## Tags

Boundaries also has a feature that lets you add tags to packages. These tags can be used to create rules
for Boundaries to check. For example, you can add an `internal` tag to your UI package:

```json title="./packages/ui/turbo.json"
{
  "tags": ["internal"]
}
```

And then declare a rule that packages with a `public` tag cannot depend on packages with an `internal` tag:

```json title="./turbo.json"
{
  "boundaries": {
    "tags": {
      "public": {
        "dependencies": {
          "deny": ["internal"]
        }
      }
    }
  }
}
```

Alternatively, you may want `public` packages to only depend on other `public` packages:

```json title="turbo.json"
{
  "boundaries": {
    "tags": {
      "public": {
        "dependencies": {
          "allow": ["public"]
        }
      }
    }
  }
}
```

Likewise, you can add restrictions for a tag's dependents, i.e. packages that import packages with the tag.

```json title="turbo.json"
{
  "boundaries": {
    "tags": {
      "private": {
        "dependents": {
          "deny": ["public"]
        }
      }
    }
  }
}
```

Package names can also be used in place of a tag in allow and deny lists.

```json title="turbo.json"
{
  "boundaries": {
    "tags": {
      "private": {
        "dependents": {
          "deny": ["@repo/my-pkg"]
        }
      }
    }
  }
}
```

Tags allow you to ensure that the wrong package isn't getting imported somewhere in your graph. These rules are
applied even for dependencies of dependencies, so if you import a package that in turn imports another package
with a denied tag, you will still get a rule violation.

import { ExperimentalBadge } from '#components/experimental-badge';

List packages in your monorepo.

```bash title="Terminal"
turbo ls [package(s)] [flags]
```

When scoped to the entire repository, output includes package manager, package count, and all package names and directories.

```bash title="Terminal"
# List all packages in the repository
turbo ls
```

When scoped to one or more packages, output includes package name, directory, internal dependencies, and all tasks.

```bash title="Terminal"
# List only two packages
turbo ls web @repo/ui [package(s)]
```

## Flags

### `--affected`

Automatically filter to only packages that are affected by changes on the current branch.

By default the changes considered are those between `main` and `HEAD`.

- You can override `main` as the default base by setting `TURBO_SCM_BASE`.
- You can override `HEAD` as the default head by setting `TURBO_SCM_HEAD`.

```bash title="Terminal"
TURBO_SCM_BASE=development turbo ls --affected
```

### `--output <format>` <ExperimentalBadge />

Format to output the results. `json` or `pretty` (default)

```bash title="Terminal"
turbo ls --output=json
```

import { ExperimentalBadge } from '#components/experimental-badge';

<ExperimentalBadge />

Run GraphQL queries against your monorepo.

```bash title="Terminal"
turbo query [query] [flags]
```

When no arguments are passed, the command will open a GraphiQL playground to run queries.

```bash title="Terminal"
turbo query
```

When passed a query string, the command will run the query and output the results.

```bash title="Terminal"
turbo query "query { packages { items { name } } }"
```

When passed a file path, the command will read the file and run the query.

```bash title="Terminal"
turbo query query.gql
```

import { Callout } from '#components/callout';

Extend your Turborepo with new apps and packages.

```bash title="Terminal"
turbo generate
```

- [`turbo generate run [generator-name]`](#run-generator-name): Run custom generators defined in your repository.
- [`turbo generate workspace [options]`](#workspace): Create a new package in your repository by copying an existing one or from the start.

For more information and practical use cases for writing custom generators, visit [the "Generating code" guide](/docs/guides/generating-code).

<Callout type="good-to-know">
  `turbo gen` is an alias for `turbo generate`. Additionally, `run` is the
  default command so `turbo gen` is equivalent to `turbo generate run`.
</Callout>

## `run [generator-name]`

Run custom generators defined in your repository.

```bash title="Terminal"
turbo gen run [generator-name]
```

### Flag options

#### `--args`

Answers to pass directly to the generator's prompts.

#### `--config <path>`

Generator configuration file.

Default: `turbo/generators/config.js`

#### `--root <path>`

The root of your repository

Default: directory with root `turbo.json`

## `workspace`

Create a new workspace.

```bash title="Terminal"
turbo gen workspace [options]
```

### Flag options

#### `--name <name>`

The name for the new workspace to be used in the `package.json` `name` key. The `name` key is the unique identifier for the package in your repository.

#### `--empty`

Creates an empty workspace. Defaults to `true`.

#### `--copy <name>/<url>`

Name of local workspace within your monorepo or a fully qualified GitHub URL with any branch and/or subdirectory.

#### `--destination <path>`

Where the new workspace should be created.

#### `--type <app/package>`

The type of workspace to create (`app` or `package`).

#### `--root <path>`

The root of your repository. Defaults to the directory of the root `turbo.json`.

#### `--show-all-dependencies`

Prevent filtering dependencies by workspace type when selecting dependencies to add.

#### `--example-path <path>`, `-p <path>`

In a rare case, your GitHub URL might contain a branch name with a slash (e.g. `bug/fix-1`) and the path to the example (e.g. `foo/bar`). In this case, you must specify the path to the example separately.

Enable faster tooling for your Turborepo locally with one, interactive command.

```bash title="Terminal"
turbo scan
```

You'll be taken through a short series of steps to enable the fastest settings for your Turborepo. These optimizations include:

- **Git FS Monitor**: `turbo` leans on Git to do file change discovery. Since we have to wait for `git` to tell us about changes, we can use [Git's built-in filesystem monitor](https://git-scm.com/docs/git-fsmonitor--daemon) to get those notifications sooner.
- **Turborepo Daemon**: Turborepo's daemon optimistically understands your repository in the background. By doing shared, common work that `turbo` will need to do when running tasks beforehand, `turbo` will run your tasks faster.
- **Remote Caching**: While Turborepo can cache your work locally, it can also share a cache across all of your machines. Enabling [Remote Caching](/docs/core-concepts/remote-caching) makes your caching **multiplayer**, ensuring that you, your teammates, and your CI machines, never do the same work twice.
- **Check `turbo` version**: We're always working towards making `turbo` better. To ensure you are using the latest version of Turborepo, we'll check your version and remind you to install `latest` if you aren't using it yet.
- **Check for Turborepo LSP**:
  Visit the [VSCode Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=Vercel.turbo-vsc) and install the Turborepo LSP extension for your IDE.

Log in to your Remote Cache provider.

```bash title="Terminal"
turbo login
```

The default provider is [Vercel](https://vercel.com/). To specify a different provider, use the `--api` option.

## Flag options

### --api \<url>

Set the API URL of the Remote Cache provider.

```bash title="Terminal"
turbo login --api=https://acme.com/api
```

### --login \<url>

Set the URL for login requests that should dynamically generate tokens.

```bash title="Terminal"
turbo login --login=https://acme.com
```

### --sso-team \<team>

Connect to an SSO-enabled team by providing your team slug.

```bash title="Terminal"
turbo login --sso-team=slug-for-team
```

### --manual

Manually enter token instead of requesting one from a login service.

Log out of the account associated with your Remote Cache provider.

```bash title="Terminal"
turbo logout
```

Link the repository to a Remote Cache provider.

```bash title="Terminal"
turbo link
```

The selected owner (either a user or an organization) will be able to share [cache artifacts](/docs/core-concepts/remote-caching) through [Remote Caching](/docs/core-concepts/remote-caching).

## Flag options

### `--api <url>`

Specifies the URL of your Remote Cache provider.

```bash title="Terminal"
turbo link --api=https://example.com
```

### `--yes`

Answer yes to all prompts

```bash title="Terminal"
turbo link --yes
```

### `--scope <scope>`

The scope to which you are linking. For example, when using Vercel, this is your Vercel team's slug.

```bash title="Terminal"
turbo link --scope=your-team
```

Disconnect the repository from Remote Cache.

```bash title="Terminal"
turbo unlink
```

Get the path to the `turbo` binary.

```bash title="Terminal"
turbo bin
```

When using [**global `turbo`**](/docs/getting-started/installation#global-installation), this will be the path to the global `turbo` binary. You're likely to see a path to the global directory of the package manager you used to install `turbo`.

When using [**local `turbo`**](/docs/getting-started/installation#repository-installation), this will be the path to the local `turbo` binary. When `turbo` is installed in your repository, it is likely to be a path to `node_modules`.

Print debugging information about your Turborepo.

```bash title="Terminal"
turbo info
```

Example output:

```txt title="Terminal"
CLI:
   Version: 2.3.0
   Path to executable: /path/to/turbo
   Daemon status: Running
   Package manager: pnpm

Platform:
   Architecture: aarch64
   Operating system: macos
   Available memory (MB): 12810
   Available CPU cores: 10

Environment:
   CI: None
   Terminal (TERM): xterm-256color
   Terminal program (TERM_PROGRAM): tmux
   Terminal program version (TERM_PROGRAM_VERSION): 3.4
   Shell (SHELL): /bin/zsh
   stdin: false
```

Print debugging information about your Turborepo.

```bash title="Terminal"
turbo info
```

Example output:

```txt title="Terminal"
CLI:
   Version: 2.3.0
   Path to executable: /path/to/turbo
   Daemon status: Running
   Package manager: pnpm

Platform:
   Architecture: aarch64
   Operating system: macos
   Available memory (MB): 12810
   Available CPU cores: 10

Environment:
   CI: None
   Terminal (TERM): xterm-256color
   Terminal program (TERM_PROGRAM): tmux
   Terminal program version (TERM_PROGRAM_VERSION): 3.4
   Shell (SHELL): /bin/zsh
   stdin: false
```

import { PackageManagerTabs, Tab } from '#components/tabs';
import { ExamplesTable } from '#components/examples-table';

The easiest way to get started with Turborepo is by using `create-turbo`. Use this CLI tool to quickly start building a new monorepo, with everything set up for you.

<PackageManagerTabs>

<Tab value="pnpm">
```bash title="Terminal"
pnpm dlx create-turbo@latest
```

</Tab>

<Tab value="yarn">
```bash title="Terminal"
yarn dlx create-turbo@latest
```

</Tab>

<Tab value="npm">
```bash title="Terminal"
npx create-turbo@latest
```

</Tab>

<Tab value="bun (Beta)">
```bash title="Terminal"
bunx create-turbo@latest
```

</Tab>

</PackageManagerTabs>

## Start with an example

The community curates a set of examples to showcase ways to use common tools and libraries with Turborepo. To bootstrap your monorepo with one of the examples, use the `--example` flag:

<PackageManagerTabs>

<Tab value="pnpm">
```bash title="Terminal"
pnpm dlx create-turbo@latest --example [example-name]
```

</Tab>

<Tab value="yarn">
```bash title="Terminal"
yarn dlx create-turbo@latest --example [example-name]
```

</Tab>

<Tab value="npm">
```bash title="Terminal"
npx create-turbo@latest --example [example-name]
```

</Tab>

<Tab value="bun (Beta)">
```bash title="Terminal"
bunx create-turbo@latest --example [example-name]
```

</Tab>

</PackageManagerTabs>

Use any of the example's names below:

## Core-maintained examples

The following examples are maintained by the Turborepo core team. Dependencies are kept as up-to-date as possible and GitHub Issues are accepted and addressed for these examples.

<ExamplesTable coreMaintained />

## Community-maintained examples

The community curates a set of examples to showcase ways to use common tools and libraries with Turborepo. To bootstrap your monorepo with one of the examples, use the `--example` flag:

<ExamplesTable />

### Use a community example

You can also use a custom starter or example by using a GitHub URL. This is useful for using your own custom starters or examples from the community.

<PackageManagerTabs>

<Tab value="pnpm">
```bash title="Terminal"
pnpm dlx create-turbo@latest --example [github-url]
```

</Tab>

<Tab value="yarn">
```bash title="Terminal"
yarn dlx create-turbo@latest --example [github-url]
```

</Tab>

<Tab value="npm">
```bash title="Terminal"
npx create-turbo@latest --example [github-url]
```

</Tab>

<Tab value="bun (Beta)">
```bash title="Terminal"
bunx create-turbo@latest --example [github-url]
```

</Tab>

</PackageManagerTabs>

## Options

```txt title="Terminal"
-m, --package-manager to use (choices: "npm", "yarn", "pnpm", "bun")

--skip-install: Do not run a package manager install after creating the project (Default: false)

--skip-transforms: Do not run any code transformation after creating the project (Default: false)

--turbo-version <version>: Use a specific version of turbo (default: latest)

-e, --example [name]|[github-url]: An example to bootstrap the app with. You can use an example name from the official Turborepo repo or a GitHub URL. The URL can use any branch and/or subdirectory

-p, --example-path <path-to-example>: In a rare case, your GitHub URL might contain a branch name with a slash (e.g. bug/fix-1) and the path to the example (e.g. foo/bar). In this case, you must specify the path to the example separately: --example-path foo/bar

-v, --version:  Output the current version

-h, --help: Display help for command
```

import { PackageManagerTabs, Tab } from '#components/tabs';

[The `eslint-config-turbo` package](https://www.npmjs.com/package/eslint-config-turbo) helps you find environment variables that are used in your code that are not a part of Turborepo's hashing. Environment variables used in your source code that are not accounted for in `turbo.json` will be highlighted in your editor and errors will show as ESLint output.

## Installation

Install `eslint-config-turbo` into the location where your ESLint configuration is held:

<PackageManagerTabs>

  <Tab value="pnpm">

    ```bash title="Terminal"
    pnpm add eslint-config-turbo --filter=@repo/eslint-config
    ```

  </Tab>

  <Tab value="yarn">

    ```bash title="Terminal"
    yarn workspace @acme/eslint-config add eslint-config-turbo --dev
    ```

  </Tab>

  <Tab value="npm">

    ```bash title="Terminal"
    npm install --save-dev eslint-config-turbo -w @acme/eslint-config
    ```

  </Tab>

  <Tab value="bun (Beta)">

    ```bash title="Terminal"
    bun install --dev eslint-config-turbo --filter=@acme/eslint-config
    ```

  </Tab>
</PackageManagerTabs>

## Usage (Flat Config `eslint.config.js`)

```js title="./packages/eslint-config/base.js"
import turboConfig from 'eslint-config-turbo/flat';

export default [
  ...turboConfig,
  // Other configuration
];
```

You can also configure rules available in the configuration:

```js title="./packages/eslint-config/base.js"
import turboConfig from 'eslint-config-turbo/flat';

export default [
  ...turboConfig,
  // Other configuration
  {
    rules: {
      'turbo/no-undeclared-env-vars': [
        'error',
        {
          allowList: ['^ENV_[A-Z]+$'],
        },
      ],
    },
  },
];
```

## Usage (Legacy `eslintrc*`)

Add `turbo` to the extends section of your eslint configuration file. You can omit the `eslint-config-` prefix:

```json title="./packages/eslint-config/base.json"
{
  "extends": ["turbo"]
}
```

You can also configure rules available in the configuration:

```json title="./packages/eslint-config/base.json"
{
  "plugins": ["turbo"],
  "rules": {
    "turbo/no-undeclared-env-vars": [
      "error",
      {
        "allowList": ["^ENV_[A-Z]+$"]
      }
    ]
  }
}
```

import { PackageManagerTabs, Tab } from '#components/tabs';

[The `eslint-plugin-turbo` package](https://www.npmjs.com/package/eslint-plugin-turbo) helps you find environment variables that are used in your code that are not a part of Turborepo's hashing. Environment variables used in your source code that are not accounted for in `turbo.json` will be highlighted in your editor and errors will show as ESLint output.

## Installation

Install `eslint-config-turbo` into the location where your ESLint configuration is held:

<PackageManagerTabs>

  <Tab value="pnpm">

    ```bash title="Terminal"
    pnpm add eslint-config-turbo --filter=@repo/eslint-config
    ```

  </Tab>

  <Tab value="yarn">

    ```bash title="Terminal"
    yarn workspace @acme/eslint-config add eslint-config-turbo --dev
    ```

  </Tab>

  <Tab value="npm">

    ```bash title="Terminal"
    npm i --save-dev eslint-config-turbo -w @acme/eslint-config
    ```

  </Tab>

  <Tab value="bun (Beta)">

    ```bash title="Terminal"
    bun install --dev eslint-config-turbo --filter=@acme/eslint-config
    ```

  </Tab>
</PackageManagerTabs>

## Usage (Flat Config `eslint.config.js`)

ESLint v9 uses the Flat Config format seen below:

```js title="./packages/eslint-config/base.js"
import turbo from 'eslint-plugin-turbo';

export default [turbo.configs['flat/recommended']];
```

Otherwise, you may configure the rules you want to use under the rules section.

```js title="./packages/eslint-config/base.js"
import turbo from 'eslint-plugin-turbo';

export default [
  {
    plugins: {
      turbo,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'error',
    },
  },
];
```

## Example (Flat Config `eslint.config.js`)

```js title="./packages/eslint-config/base.js"
import turbo from 'eslint-plugin-turbo';

export default [
  {
    plugins: {
      turbo,
    },
    rules: {
      'turbo/no-undeclared-env-vars': [
        'error',
        {
          allowList: ['^ENV_[A-Z]+$'],
        },
      ],
    },
  },
];
```

## Usage (Legacy `eslintrc*`)

Add `turbo` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json title="./packages/eslint-config/base.json"
{
  "plugins": ["turbo"]
}
```

Then configure the rules you want to use under the rules section.

```json title="./packages/eslint-config/base.json"
{
  "rules": {
    "turbo/no-undeclared-env-vars": "error"
  }
}
```

## Example (Legacy `eslintrc*`)

```json title="./packages/eslint-config/base.json"
{
  "plugins": ["turbo"],
  "rules": {
    "turbo/no-undeclared-env-vars": [
      "error",
      {
        "allowList": ["^ENV_[A-Z]+$"]
      }
    ]
  }
}
```

Use `turbo` to determine if a package or its dependencies have changes. This can be useful for quickly skipping tasks in CI.

```bash title="Terminal"
npx turbo-ignore [workspace] [flags...]
```

To learn more, visit:

- [The introductory guide to skipping tasks](/docs/crafting-your-repository/constructing-ci#skipping-tasks-and-other-unnecessary-work)
- [The advanced guide for skipping tasks](/docs/guides/skipping-tasks)
- [Documentation for `turbo-ignore` on npm](https://www.npmjs.com/package/turbo-ignore)

## turbo-ignore versioning

Because `turbo-ignore` is most often used before installing dependencies into the repository, there won't be a `turbo` binary available when you run `turbo-ignore`. Instead `turbo-ignore` will search for the correct version to use with your repository with the following strategy:

- First, check for a `turbo` entry in root `package.json#devDependencies` or `package.json#dependencies`. If a version is found there, it will be used.
- If no `entry` is found in `package.json`, `turbo.json` will be read for its schema. If [the `tasks` key](/docs/reference/configuration#tasks) is found, use `turbo@^2`. If the `pipeline` from Turborepo v1 is found, use `turbo@^1`.

Use this package for type definitions in your [Turborepo code generators](/docs/reference/generate).

```ts title="./turbo/generators/my-generator.ts"
import type { PlopTypes } from "@turbo/gen"; // [!code highlight]

// [!code word:PlopTypes]
export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // Create a generator
  plop.setGenerator("Generator name", {
    description: "Generator description",
    // Gather information from the user
    prompts: [
      ...
    ],
    // Perform actions based on the prompts
    actions: [
      ...
    ],
  });
}
```

For more information, [visit the Generating code guide](/docs/guides/generating-code).
