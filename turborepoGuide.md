Welcome to the Turborepo documentation!

---

## What is Turborepo?

Turborepo is a high-performance build system for JavaScript and TypeScript codebases. It is designed for scaling monorepos and also makes workflows in [single-package workspaces](/docs/guides/single-package-workspaces) faster, too.

From individual developers to the largest enterprise engineering organizations in the world, Turborepo is saving years of engineering time and millions of dollars in compute costs through a lightweight approach to optimizing the tasks you need to run in your repository.

## The monorepo problem

Monorepos have many advantages - but **they struggle to scale**. Each workspace has its own test suite, its own linting, and its own build process. A single monorepo might have **thousands of tasks to execute**.

![A representation of a typical monorepo. The first application took 110 seconds to complete its tasks. The second application took 140 seconds to complete its tasks. The shared package between them took 90 seconds to complete its tasks.](/images/docs/why-turborepo-problem.png)

These slowdowns can dramatically affect the way your teams build software, especially at scale. Feedback loops need to be fast so developers can deliver high-quality code quickly.

## The monorepo solution

![The monorepo from before using Turborepo, showing how it can hit cache to complete tasks for all three packages in 80 milliseconds.](/images/docs/why-turborepo-solution.png)

**Turborepo solves your monorepo's scaling problem**. [Remote Cache](/docs/core-concepts/remote-caching) stores the result of all your tasks, meaning that **your CI never needs to do the same work twice**.

Additionally, task scheduling can be difficult in a monorepo. You may need to build, _then_ test, _then_ lint...

Turborepo **schedules your tasks for maximum speed**, parallelizing work across all available cores.

Turborepo can be **adopted incrementally** and you can **add it to any repository in just a few minutes**. It uses the `package.json` scripts you've already written, the dependencies you've already declared, and a single `turbo.json` file. You can **use it with any package manager**, like `npm`, `yarn` or `pnpm` since Turborepo leans on the conventions of the npm ecosystem.

## How to use these docs

We will do our best to keep jargon to a minimum - but there are some need-to-know words that will be important to understand as you read through the docs. We've created [a glossary page](https://vercel.com/docs/vercel-platform/glossary) to help you out in case you're learning about these terms.

## Join the community

If you have questions about anything related to Turborepo, you're always welcome to ask the community on [GitHub Discussions](https://github.com/vercel/turborepo/discussions), [Vercel Community](https://community.vercel.com/tag/turborepo), and [Twitter](https://twitter.com/turborepo).

import { Callout } from '#components/callout';
import { PackageManagerTabs, Tabs, Tab } from '#components/tabs';

Get started with Turborepo in a few moments using:

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

The starter repository will have:

- Two deployable applications
- Three shared libraries for use in the rest of the monorepo

For more details on the starter, [visit the README for the basic starter on GitHub](https://github.com/vercel/turborepo/tree/main/examples/basic). You can also [use an example](/docs/getting-started/examples) that more closely fits your tooling interests.

## Installing `turbo`

`turbo` can be installed both globally **and** in your repository. We highly recommend installing both ways so you can take advantage of fast, convenient workflows _and_ a stable version of `turbo` for all developers working in your repository.

### Global installation

A global install of `turbo` brings flexibility and speed to your local workflows.

<PackageManagerTabs>

  <Tab value="pnpm">
  ```bash title="Terminal"
  pnpm add turbo --global
  ```

  </Tab>

  <Tab value="yarn">
  ```bash title="Terminal"
  yarn global add turbo
  ```

  </Tab>

  <Tab value="npm">
  ```bash title="Terminal"
  npm install turbo --global
  ```

  </Tab>

  <Tab value="bun (Beta)">
  ```bash title="Terminal"
  bun install turbo --global
  ```

  </Tab>

</PackageManagerTabs>

Once installed globally, you can run your scripts through `turbo` from your terminal, quickly running one-off commands to use within your repository. For example:

- `turbo build`: Run `build` scripts following your repository's dependency graph
- `turbo build --filter=docs --dry`: Quickly print an outline of the `build` task for your `docs` package (without running it)
- `turbo generate`: Run [Generators](/docs/guides/generating-code) to add new code to your repository
- `cd apps/docs && turbo build`: Run the `build` script in the `docs` package and its dependencies. For more, visit the [Automatic Package Scoping section](/docs/crafting-your-repository/running-tasks#automatic-package-scoping).

<Callout type="good-to-know">
  `turbo` is an alias for [`turbo run`](/docs/reference/run). For example,
  `turbo build` and `turbo run build` will both run your `build` task.
</Callout>

<Callout type="error" title="Avoid multiple global installations">
  If you've installed global `turbo` before, make sure you use the same package
  manager as your existing installation to avoid unexpected behaviors. You can
  quickly check which package manager you previously used with [`turbo
  bin`](/docs/reference/bin).
</Callout>

#### Using global `turbo` in CI

You can also take advantage of global `turbo` when creating your CI pipelines. Visit the [Constructing CI](/docs/crafting-your-repository/constructing-ci#global-turbo-in-ci) guide for more information.

### Repository installation

When collaborating with other developers in a repository, it's a good idea to pin versions of dependencies. You can do this with `turbo` by adding it as a `devDependency` in the root of your repository:

<PackageManagerTabs>

  <Tab value="pnpm">
    ```bash title="Terminal"
    pnpm add turbo --save-dev --ignore-workspace-root-check
    ```

  </Tab>

  <Tab value="yarn">
    ```bash title="Terminal"
    yarn add turbo --dev --ignore-workspace-root-check
    ```

  </Tab>

  <Tab value="npm">
  ```bash title="Terminal"
  npm install turbo --save-dev
  ```

  </Tab>

  <Tab value="bun (Beta)">
  ```bash title="Terminal"
  bun install turbo --dev
  ```

  </Tab>

  </PackageManagerTabs>

You can continue to use your global installation of `turbo` to run commands. Global `turbo` will defer to the local version of your repository if it exists.

This lets you to get the best of both installations: easily run commands in your terminal while maintaining a pinned version for consistent usage for all developers in the repository.

import { Callout } from '#components/callout';
import { PackageManagerTabs, Tab, Tabs } from '#components/tabs';
import { Step, Steps } from '#components/steps';
import { File, Folder, Files } from '#components/files';
import { LinkToDocumentation } from '#components/link-to-documentation';

`turbo` is built on top of [Workspaces](https://vercel.com/docs/vercel-platform/glossary#workspace), a feature of package managers in the JavaScript ecosystem that allows you to group multiple packages in one repository.

Following these conventions is important because it allows you to:

- Lean on those conventions for all your repo's tooling
- Quickly, incrementally adopt Turborepo into an existing repository

In this guide, we'll walk through setting up a multi-package workspace (monorepo) so we can set the groundwork for `turbo`.

## Getting started

Setting up a workspace's structure can be tedious to do by hand. If you're new to monorepos, we recommend [using `create-turbo` to get started](/docs/getting-started/installation) with a valid workspace structure right away.

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

You can then review the repository for the characteristics described in this guide.

## Anatomy of a workspace

In JavaScript, a workspace can either be [a single package](/docs/guides/single-package-workspaces) or a collection of packages. In these guides, we'll be focusing on [a multi-package workspace](https://vercel.com/docs/vercel-platform/glossary#monorepo), often called a "monorepo".

Below, the structural elements of `create-turbo` that make it a valid workspace are highlighted.

<PackageManagerTabs>

<Tab value="pnpm">
  <Files>
    <File name="package.json" green />
    <File name="pnpm-lock.yaml" green />
    <File name="pnpm-workspace.yaml" green />
    <File name="turbo.json" />
    <Folder name="apps" defaultOpen>
      <Folder name="docs" className="text-foreground" defaultOpen>
        <File name="package.json" green />
      </Folder>
      <Folder name="web">
        <File name="package.json" green />
      </Folder>
    </Folder>
    <Folder name="packages">
      <Folder name="ui">
        <File name="package.json" green />
      </Folder>
    </Folder>
  </Files>
</Tab>

<Tab value="yarn">
  <Files>
    <File name="package.json" green />
    <File name="yarn.lock" green />
    <File name="turbo.json" />
    <Folder name="apps" defaultOpen>
      <Folder name="docs" className="text-foreground" defaultOpen>
        <File name="package.json" green />
      </Folder>
      <Folder name="web">
        <File name="package.json" green />
      </Folder>
    </Folder>
    <Folder name="packages">
      <Folder name="ui">
        <File name="package.json" green />
      </Folder>
    </Folder>
  </Files>
</Tab>

<Tab value="npm">
  <Files>
    <File name="package.json" green />
    <File name="package-lock.json" green />
    <File name="turbo.json" />
    <Folder name="apps" defaultOpen>
      <Folder name="docs" className="text-foreground" defaultOpen>
        <File name="package.json" green />
      </Folder>
      <Folder name="web">
        <File name="package.json" green />
      </Folder>
    </Folder>
    <Folder name="packages">
      <Folder name="ui">
        <File name="package.json" green />
      </Folder>
    </Folder>
  </Files>
</Tab>

<Tab value="bun (Beta)">
  <Files>
    <File name="package.json" green />
    <File name="bun.lock" green />
    <File name="turbo.json" />
    <Folder name="apps" defaultOpen>
      <Folder name="docs" className="text-foreground" defaultOpen>
        <File name="package.json" green />
      </Folder>
      <Folder name="web">
        <File name="package.json" green />
      </Folder>
    </Folder>
    <Folder name="packages">
      <Folder name="ui">
        <File name="package.json" green />
      </Folder>
    </Folder>
  </Files>
</Tab>

</PackageManagerTabs>

### Minimum requirements

- [Packages as described by your package manager](#specifying-packages-in-a-monorepo)
- [A package manager lockfile](#package-manager-lockfile)
- [Root `package.json`](#root-packagejson)
- [Root `turbo.json`](#root-turbojson)
- [`package.json` in each package](#packagejson-in-each-package)

### Specifying packages in a monorepo

<Steps>
<Step>

#### Declaring directories for packages

First, your package manager needs to describe the locations of your packages. We recommend starting with splitting your packages into `apps/` for applications and services and `packages/` for everything else, like libraries and tooling.

<PackageManagerTabs>

  <Tab value="pnpm">
  ```json title="pnpm-workspace.yaml"
 packages:
    - "apps/*"
    - "packages/*"
  ```
  <LinkToDocumentation href="https://pnpm.io/pnpm-workspace_yaml">pnpm workspace documentation</LinkToDocumentation>

  </Tab>

  <Tab value="yarn">
  ```json title="./package.json"
  {
    "workspaces": [
      "apps/*",
      "packages/*"
    ]
  }
  ```

<LinkToDocumentation href="https://yarnpkg.com/features/workspaces#how-are-workspaces-declared">yarn workspace documentation</LinkToDocumentation>
</Tab>

  <Tab value="npm">
  ```json title="./package.json"
  {
    "workspaces": [
      "apps/*",
      "packages/*"
    ]
  }
  ```

<LinkToDocumentation href="https://docs.npmjs.com/cli/v7/using-npm/workspaces#defining-workspaces">npm workspace documentation</LinkToDocumentation>
</Tab>

  <Tab value="bun (Beta)">
  ```json title="./package.json"
  {
    "workspaces": [
      "apps/*",
      "packages/*"
    ]
  }
  ```

<LinkToDocumentation href="https://bun.sh/docs/install/workspaces">bun workspace documentation</LinkToDocumentation>
</Tab>

</PackageManagerTabs>

Using this configuration, every directory **with a `package.json`** in the `apps` or `packages` directories will be considered a package.

<Callout type="error">
Turborepo does not support nested packages like `apps/**` or `packages/**` due to ambiguous behavior among package managers in the JavaScript ecosystem. Using a structure that would put a package at `apps/a` and another at `apps/a/b` will result in an error.

If you'd like to group packages by directory, you can do this using globs like `packages/*` and `packages/group/*` and **not** creating a `packages/group/package.json` file.

</Callout>
</Step>

<Step>

#### `package.json` in each package

In the directory of the package, there must be a `package.json` to make the package discoverable to your package manager and `turbo`. The [requirements for the `package.json` of a package](#anatomy-of-a-package) are below.

</Step>
</Steps>

### Root `package.json`

The root `package.json` is the base for your workspace. Below is a common example of what you would find in a root `package.json`:

<PackageManagerTabs>

<Tab value="pnpm">

```json title="./package.json"
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "pnpm@9.0.0"
}
```

</Tab>

<Tab value="yarn">

```json title="./package.json"
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "yarn@1.22.19",
  "workspaces": ["apps/*", "packages/*"]
}
```

</Tab>

<Tab value="npm">

```json title="./package.json"
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "npm@10.0.0",
  "workspaces": ["apps/*", "packages/*"]
}
```

</Tab>

<Tab value="bun (Beta)">

```json title="./package.json"
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "bun@1.2.0",
  "workspaces": ["apps/*", "packages/*"]
}
```

</Tab>
</PackageManagerTabs>

### Root `turbo.json`

`turbo.json` is used to configure the behavior of `turbo`. To learn more about how to configure your tasks, visit the [Configuring tasks](/docs/crafting-your-repository/configuring-tasks) page.

### Package manager lockfile

A lockfile is key to reproducible behavior for both your package manager and `turbo`. Additionally, Turborepo uses the lockfile to understand the dependencies between your [Internal Packages](/docs/core-concepts/internal-packages) within your Workspace.

<Callout type="warn">
  If you do not have a lockfile present when you run `turbo`, you may see
  unpredictable behavior.
</Callout>

## Anatomy of a package

It's often best to start thinking about designing a package as its own unit within the Workspace. At a high-level, each package is almost like its own small "project", with its own `package.json`, tooling configuration, and source code. There are limits to this idea—but its a good mental model to _start_ from.

Additionally, a package has specific entrypoints that other packages in your Workspace can use to access the package, specified by [`exports`](#exports).

### `package.json` for a package

#### `name`

[The `name` field](https://nodejs.org/api/packages.html#name) is used to identify the package. It should be unique within your workspace.

<Callout type="info">
It's best practice to use a namespace prefix for your [Internal Packages](/docs/core-concepts/internal-packages) to avoid conflicts with other packages on the npm registry. For example, if your organization is named `acme`, you might name your packages `@acme/package-name`.

We use `@repo` in our docs and examples because it is an unused, unclaimable namespace on the npm registry. You can choose to keep it or use your own prefix.

</Callout>

#### `scripts`

The `scripts` field is used to define scripts that can be run in the package's context. Turborepo will use the name of these scripts to identify what scripts to run (if any) in a package. We talk more about these scripts on the [Running Tasks](/docs/crafting-your-repository/running-tasks) page.

#### `exports`

[The `exports` field](https://nodejs.org/api/packages.html#exports) is used to specify the entrypoints for other packages that want to use the package. When you want to use code from one package in another package, you'll import from that entrypoint.

For example, if you had a `@repo/math` package, you might have the following `exports` field:

```json title="./packages/math/package.json"
{
  "exports": {
    ".": "./src/constants.ts",
    "./add": "./src/add.ts",
    "./subtract": "./src/subtract.ts"
  }
}
```

Note that this example uses the [Just-in-Time Package](/docs/core-concepts/internal-packages#just-in-time-packages) pattern for simplicity. It exports TypeScript directly, but you might choose to use the [Compiled Package](/docs/core-concepts/internal-packages#compiled-packages) pattern instead.

<Callout type="info">
  The `exports` field in this example requires modern versions of Node.js and
  TypeScript.
</Callout>

This would allow you to import `add` and `subtract` functions from the `@repo/math` package like so:

```ts title="./apps/my-app/src/index.ts"
import { GRAVITATIONAL_CONSTANT, SPEED_OF_LIGHT } from '@repo/math';
import { add } from '@repo/math/add';
import { subtract } from '@repo/math/subtract';
```

Using exports this way provides three major benefits:

- **Avoiding barrel files**: Barrel files are files that re-export other files in the same package, creating one entrypoint for the entire package. While they might appear convenient, they're [difficult for compilers and bundlers to handle](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js#what's-the-problem-with-barrel-files) and can quickly lead to performance problems.
- **More powerful features**: `exports` also has other powerful features compared to [the `main` field](https://nodejs.org/api/packages.html#main) like [Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports). In general, we recommend using `exports` over `main` whenever possible as it is the more modern option.
- **IDE autocompletion**: By specifying the entrypoints for your package using `exports`, you can ensure that your code editor can provide auto-completion for the package's exports.

#### `imports` (optional)

[The `imports` field](https://nodejs.org/api/packages.html#imports) gives you a way to create subpaths to other modules within your package. You can think of these like "shortcuts" to write simpler import paths that are more resilient to refactors that move files. To learn how, visit [the TypeScript page](/docs/guides/tools/typescript#use-nodejs-subpath-imports-instead-of-typescript-compiler-paths).

<Callout type="info">
You may be more familiar with TypeScript's `compilerOptions#paths` option, which accomplishes a similar goal. As of TypeScript 5.4, TypeScript can infer subpaths from `imports`, making it a better option since you'll be working with Node.js conventions. For more information, visit [our TypeScript guide](/docs/guides/tools/typescript#use-nodejs-subpath-imports-instead-of-typescript-compiler-paths).

</Callout>

### Source code

Of course, you'll want some source code in your package. Packages commonly use an `src` directory to store their source code and compile to a `dist` directory (that should also be located within the package), although this is not a requirement.

## Common pitfalls

- If you're using TypeScript, you likely don't need a `tsconfig.json` in the root of your workspace. Packages should independently specify their own configurations, usually building off of a shared `tsconfig.json` from a separate package in the workspace. For more information, visit [the TypeScript guide](/docs/guides/tools/typescript#you-likely-dont-need-a-tsconfigjson-file-in-the-root-of-your-project).
- You want to avoid accessing files across package boundaries as much as possible. If you ever find yourself writing `../` to get from one package to another, you likely have an opportunity to re-think your approach by installing the package where it's needed and importing it into your code.

## Next steps

With your Workspace configured, you can now use your package manager to [install dependencies into your packages](/docs/crafting-your-repository/managing-dependencies).

import { PackageManagerTabs, Tab } from '#components/tabs';
import { Callout } from '#components/callout';
import { LinkToDocumentation } from '#components/link-to-documentation';

- **External dependencies** come from [the npm registry](https://www.npmjs.com/), allowing you to leverage valuable code from the ecosystem to build your applications and libraries faster.
- **Internal dependencies** let you share functionality within your repository, dramatically improving discoverability and usability of shared code. We will discuss how to build an Internal Package in [the next guide](/docs/crafting-your-repository/creating-an-internal-package).

<PackageManagerTabs>

<Tab value="pnpm">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "next": "latest", // External dependency
    "@repo/ui": "workspace:*" // Internal dependency
  }
}
```
</Tab>

<Tab value="yarn">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "next": "latest", // External dependency
    "@repo/ui": "*" // Internal dependency
  }
}
```
</Tab>

<Tab value="npm">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "next": "latest", // External dependency
    "@repo/ui": "*" // Internal dependency
  }
}
```
</Tab>

<Tab value="bun (Beta)">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "next": "latest", // External dependency
    "@repo/ui": "workspace:*" // Internal dependency
  }
}
```
</Tab>
</PackageManagerTabs>

## Best practices for dependency installation

### Install dependencies where they're used

When you install a dependency in your repository, you should install it directly in the package that uses it. The package's `package.json` will have every dependency that the package needs. This is true for both external and internal dependencies.

<Callout type="good-to-know">
  Note that your package manager may choose to [use a different node_modules
  location than the package](#node_modules-locations).
</Callout>

To quickly install dependencies in multiple packages, you can use your package manager:

<PackageManagerTabs>

<Tab value="pnpm">

```bash title="Terminal"
pnpm add jest --save-dev --recursive --filter=web --filter=@repo/ui --filter=docs
```

<LinkToDocumentation href="https://pnpm.io/cli/recursive">pnpm documentation</LinkToDocumentation>
</Tab>

<Tab value="yarn">
Yarn 1:

```bash title="Terminal"
yarn workspace web add jest --dev
yarn workspace @repo/ui add jest --dev
```

<LinkToDocumentation href="https://classic.yarnpkg.com/en/docs/cli/add">
  Yarn 1 documentation
</LinkToDocumentation>

Yarn 2+:

```bash title="Terminal"
yarn workspaces foreach -R --from '{web,@repo/ui}' add jest --dev
```

<LinkToDocumentation href="https://yarnpkg.com/cli/workspaces/foreach#usage">
  Yarn 2+ documentation
</LinkToDocumentation>
</Tab>

<Tab value="npm">

```bash title="Terminal"
npm install jest --workspace=web --workspace=@repo/ui --save-dev
```

<LinkToDocumentation href="https://docs.npmjs.com/cli/v7/using-npm/config#workspace">npm documentation</LinkToDocumentation>
</Tab>

<Tab value="bun (Beta)">

```bash title="Terminal"
bun install jest --filter=web --filter=@repo/ui --dev
```

<LinkToDocumentation href="https://bun.sh/docs/install/workspaces">bun documentation</LinkToDocumentation>
</Tab>
</PackageManagerTabs>

This practice has several benefits:

- **Improved clarity**: It's easier to understand what a package depends on when its dependencies are listed in its `package.json`. Developers working in the repository can see at a glance what dependencies are used within the package.
- **Enhanced flexibility**: In a monorepo at scale, it can be unrealistic to expect each package to use the same version of an external dependency. When there are many teams working in the same codebase, there will be differing priorities, timelines, and needs due to the realities of [operating at scale](https://vercel.com/blog/how-to-scale-a-large-codebase). By installing dependencies in the package that uses them, you can enable your `ui` team to bump to the latest version of TypeScript, while your `web` team can prioritize shipping new features and bumping TypeScript later. Additionally, if you still want to keep dependency versions in sync, [you can do that, too](/docs/crafting-your-repository/managing-dependencies#keeping-dependencies-on-the-same-version).
- **Better caching ability**: If you install too many dependencies in the root of your repository, you'll be changing the workspace root whenever you add, update, or delete a dependency, leading to unnecessary cache misses.
- **Pruning unused dependencies**: For Docker users, [Turborepo's pruning feature](/docs/reference/prune) can remove unused dependencies from Docker images to create lighter images. When dependencies are installed in the packages that they are meant for, Turborepo can read your lockfile and remove dependencies that aren't used in the packages you need.

### Few dependencies in the root

Following the first principle above to [install dependencies in the package where they're used](#install-dependencies-where-theyre-used), you'll find that you naturally end up with few dependencies in the root of your workspace.

The only dependencies that belong in the workspace root are **tools for managing the repository** whereas dependencies for building applications and libraries are installed in their respective packages. Some examples of dependencies that make sense to install in the root are [`turbo`](https://www.npmjs.com/package/turbo), [`husky`](https://www.npmjs.com/package/husky), or [`lint-staged`](https://www.npmjs.com/package/lint-staged).

## Managing dependencies

### Turborepo does not manage dependencies

Note that Turborepo does not play a role in managing your dependencies, leaving that work up to your package manager of choice.

It's up to the package manager to handle things like downloading the right external dependency version, symlinking, and resolving modules. The recommendations on this page are best practices for managing dependencies in a Workspace, and are not enforced by Turborepo.

### Module resolution differs amongst package managers

Package managers have different module resolution algorithms, which leads to differences in behavior that can be difficult to predict.

In the Turborepo documentation, we make many recommendations according to the expected behaviors of the package managers. Our coverage of how to handle dependencies is best effort and you may need to adapt the documented behavior for your package manager or repository's needs.

However, if you find an issue with the documentation that appears to be universally incorrect for all package managers or a specific one, please let us know with a GitHub Issue so we can improve.

### node_modules locations

Depending on your choice of package manager, version, settings, and where your dependencies are installed in your Workspace, you may see `node_modules` and the dependencies inside it in various locations within the Workspace. Dependencies could be found in the root `node_modules`, in packages' `node_modules`, or both.

As long as your scripts and tasks are able to find the dependencies they need, your package manager is working correctly.

<Callout type="info" title="Referencing `node_modules` in your code">
The specific locations for `node_modules` within the Workspace are not a part of the public API of package managers. This means that referencing `node_modules` directly (like `node ./node_modules/a-package/dist/index.js`) can be brittle, since the location of the dependency on disk can change with other dependency changes around the Workspace.

Instead, rely on conventions of the Node.js ecosystem for accessing dependency modules whenever possible.

</Callout>

### Keeping dependencies on the same version

Some monorepo maintainers prefer to keep dependencies on the same version across all packages by rule. There are several ways to achieve this:

#### Using purpose-built tooling

Tools like [`syncpack`](https://www.npmjs.com/package/syncpack), [`manypkg`](https://www.npmjs.com/package/@manypkg/cli), and [`sherif`](https://www.npmjs.com/package/sherif) can be used for this specific purpose.

#### Using your package manager

You can use your package manager to update dependency versions in one command.

<PackageManagerTabs>

<Tab value="pnpm">

```bash title="Terminal"
pnpm up --recursive typescript@latest
```

<small>[→ pnpm documentation](https://pnpm.io/cli/update#--recursive--r)</small>

</Tab>

<Tab value="yarn">
Yarn 1:
```bash title="Terminal"
yarn upgrade-interactive --latest
```
<small>[→ Yarn 1 documentation](https://classic.yarnpkg.com/en/docs/cli/upgrade-interactive)</small>

Yarn 2+:

```bash title="Terminal"
yarn upgrade typescript@latest --upgrade
```

<small>[→ Yarn 2+ documentation](https://yarnpkg.com/cli/up)</small>

</Tab>

<Tab value="npm">
```bash title="Terminal"
npm install typescript@latest --workspaces
```
  <small>[→ npm documentation](https://docs.npmjs.com/cli/v7/using-npm/config#workspaces)</small>

</Tab>

<Tab value="bun (Beta)">
No equivalent

<small>[→ Bun documentation](https://bun.sh/docs/install/workspaces)</small>

</Tab>
</PackageManagerTabs>

#### pnpm catalogs

In pnpm v9.5+, you can use catalogs to define dependency version ranges as reusable constants. This will keep dependencies on the same version since you're referencing the same value across the workspace.

To learn more, [visit the pnpm catalogs documentation](https://pnpm.io/catalogs).

#### Using an IDE

Your IDE's refactoring tooling can find and replace the version of a dependency across all `package.json` files in your repository at once. Try using a regex like `"next": ".*"` on `package.json` files to find all instances of the `next` package and replace them with the version you want. When you're done, make sure to run your package manager's install command to update your lockfile.

## Next steps

Now that you know how to manage dependencies effectively in a workspace, let's [create an Internal Package](/docs/crafting-your-repository/creating-an-internal-package) to be used as a dependency in your monorepo.

import { Callout } from '#components/callout';
import { Steps, Step } from '#components/steps';
import { PackageManagerTabs, Tabs, Tab } from '#components/tabs';
import { Files, File, Folder } from '#components/files';

[Internal Packages](/docs/core-concepts/internal-packages) are the building blocks of your workspace, giving you a powerful way to share code and functionality across your repo. Turborepo automatically understands the relationships between Internal Packages using the dependencies in `package.json`, creating a [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph) under the hood to optimize your repository's workflows.

![Visual representation of a Package Graph in a Turborepo.](/images/docs/package-graph.png)

Let's create your first Internal Package to share math utilities in your repo using the guidance in the [Anatomy of a package](/docs/crafting-your-repository/structuring-a-repository#anatomy-of-a-package) section and the [Compiled Packages](/docs/core-concepts/internal-packages#compiled-packages) pattern. In the steps below, we assume you've [created a new repository using `create-turbo`](/docs/getting-started/installation) or are using a similarly structured repository.

<Steps>
<Step>
### Create an empty directory

You'll need a directory to put the package in. Let's create one at `./packages/math`.

<Files>
  <File name="package.json" />
  <File name="turbo.json" />
  <Folder name="apps" />
  <Folder name="packages" defaultOpen>
    <Folder name="math" green defaultOpen />
    <Folder name="ui">
      <File name="package.json" />
    </Folder>
    <Folder name="eslint-config">
      <File name="package.json" />
    </Folder>
    <Folder name="typescript-config">
      <File name="package.json" />
    </Folder>
  </Folder>
</Files>

</Step>
<Step>
### Add a package.json

Next, create the `package.json` for the package. By adding this file, you'll fulfill [the two requirements for an Internal Package](/docs/crafting-your-repository/structuring-a-repository#specifying-packages-in-a-monorepo), making it discoverable to Turborepo and the rest of your Workspace:

<PackageManagerTabs>

<Tab value="pnpm">
```json title="./packages/math/package.json"
{
  "name": "@repo/math",
  "type": "module",
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  },
  "exports": {
    "./add": {
      "types": "./src/add.ts",
      "default": "./dist/add.js"
    },
    "./subtract": {
      "types": "./src/subtract.ts",
      "default": "./dist/subtract.js"
    }
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "latest"
  }
}
```
</Tab>

<Tab value="yarn">
```json title="./packages/math/package.json"
{
  "name": "@repo/math",
  "type": "module",
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  },
  "exports": {
    "./add": {
      "types": "./src/add.ts",
      "default": "./dist/add.js"
    },
    "./subtract": {
      "types": "./src/subtract.ts",
      "default": "./dist/subtract.js"
    }
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "latest"
  }
}
```
</Tab>

<Tab value="npm">
```json title="./packages/math/package.json"
{
  "name": "@repo/math",
  "type": "module",
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  },
  "exports": {
    "./add": {
      "types": "./src/add.ts",
      "default": "./dist/add.js"
    },
    "./subtract": {
      "types": "./src/subtract.ts",
      "default": "./dist/subtract.js"
    }
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "typescript": "latest"
  }
}
```

</Tab>

<Tab value="bun (Beta)">
```json title="./packages/math/package.json"
{
  "name": "@repo/math",
  "type": "module",
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  },
  "exports": {
    "./add": {
      "types": "./src/add.ts",
      "default": "./dist/add.js"
    },
    "./subtract": {
      "types": "./src/subtract.ts",
      "default": "./dist/subtract.js"
    }
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "typescript": "latest"
  }
}
```

</Tab>
</PackageManagerTabs>

Let's break down this `package.json` piece-by-piece:

- **`scripts`**: The `dev` and `build` script compile the package using [the TypeScript compiler](https://www.typescriptlang.org/docs/handbook/compiler-options.html). The `dev` script will watch for changes to source code and automatically recompile the package.
- **`devDependencies`**: `typescript` and `@repo/typescript-config` are `devDependencies` so you can use those packages in the `@repo/math` package. In a real-world package, you will likely have more `devDependencies` and `dependencies` - but we can keep it simple for now.
- **`exports`**: Defines multiple entrypoints for the package so it can be used in other packages (`import { add } from '@repo/math'`).

Notably, this `package.json` declares an Internal Package, `@repo/typescript-config`, as a dependency. Turborepo will recognize `@repo/math` as a dependent of `@repo/typescript-config` for ordering your tasks.

</Step>

<Step>
  ### Add a `tsconfig.json`

Specify the TypeScript configuration for this package by adding a `tsconfig.json` file to **the root of the package**. TypeScript has [an `extends` key](https://www.typescriptlang.org/tsconfig#extends), allowing you to use a base configuration throughout your repository and overwrite with different options as needed.

```json title="./packages/math/tsconfig.json"
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

You've done four important things here:

- The `@repo/typescript-config/base.json` configuration that lives in `./packages/typescript-config` has all the configuration you need so you extend from it.
- [The `outDir` key](https://www.typescriptlang.org/tsconfig/#outDir) in `compilerOptions` tells TypeScript where to put the compiled output. It matches the directory specified in your `exports` in `package.json`.
- [The `rootDir` key in `compilerOptions`](https://www.typescriptlang.org/tsconfig/#rootDir) ensures that the output in `outDir` uses the same structure as the `src` directory.
- The [`include`](https://www.typescriptlang.org/tsconfig/#include) and [`exclude`](https://www.typescriptlang.org/tsconfig/#exclude) keys are not inherited from the base configuration, [according to the TypeScript specification](https://www.typescriptlang.org/tsconfig#include), so you've included them here.

<Callout type="info">
  There's a lot more to learn about TypeScript configuration, but this is a good
  place to start for now. If you'd like to learn more, visit [the official
  TypeScript documentation](https://www.typescriptlang.org/tsconfig) or [our
  TypeScript guide](/docs/guides/tools/typescript).
</Callout>

</Step>

<Step>
### Add a `src` directory with source code

You can now write some code for your package. Create two files inside a `src` directory:

<Tabs items={['add.ts', 'subtract.ts']}>
<Tab value="add.ts">

    ```ts title="./packages/math/src/add.ts"
    export const add = (a: number, b: number) => a + b;
    ```

  </Tab>
  <Tab value="subtract.ts">

    ```ts title="./packages/math/src/subtract.ts"
    export const subtract = (a: number, b: number) => a - b;
    ```

  </Tab>
</Tabs>

These files map to the outputs that will be created by `tsc` when you run `turbo build` in a moment.

</Step>

<Step>
### Add the package to an application

You're ready to use your new package in an application. Let's add it to the `web` application.

<PackageManagerTabs>

<Tab value="pnpm">
```diff title="apps/web/package.json"
  "dependencies": {
+   "@repo/math": "workspace:*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
```
</Tab>

<Tab value="yarn">
```diff title="apps/web/package.json"
  "dependencies": {
+   "@repo/math": "*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
```
</Tab>

<Tab value="npm">
```diff title="apps/web/package.json"
  "dependencies": {
+   "@repo/math": "*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
```
</Tab>

<Tab value="bun (Beta)">
```diff title="apps/web/package.json"
  "dependencies": {
+   "@repo/math": "workspace:*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
```
</Tab>
</PackageManagerTabs>

<Callout type="warn">
  You just changed the dependencies in your repo. Make sure to run your package
  manager's installation command to update your lockfile.
</Callout>

`@repo/math` is now available in the `web` application, you can use it in your code:

```tsx title="apps/web/src/app/page.tsx"
import { add } from '@repo/math/add';

function Page() {
  return <div>{add(1, 2)}</div>;
}

export default Page;
```

</Step>

<Step>
### Edit `turbo.json`

Add the artifacts for the new `@repo/math` library to the `outputs` for the `build` task in `turbo.json`. This ensures that its build outputs will be cached by Turborepo, so they can be restored instantly when you start running builds.

```json title="./turbo.json"
// [!code word:"dist/**"]
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    }
  }
}
```

</Step>

<Step>
### Run `turbo build`

If you've [installed `turbo` globally](/docs/getting-started/installation#global-installation), run `turbo build` in your terminal at the root of your Workspace. You can also run the `build` script from `package.json` with your package manager, which will use `turbo run build`.

The `@repo/math` package built before the `web` application built so that the runtime code in `./packages/math/dist` is available to the `web` application when it bundles.

<Callout type="info">
  You can run `turbo build` again to see your `web` application rebuild in
  **milliseconds**. We'll discuss this at length in [the Caching
  guide](/docs/crafting-your-repository/caching).
</Callout>

</Step>
</Steps>

## Best practices for Internal Packages

### One "purpose" per package

When you're creating Internal Packages, it's recommended to create packages that have a single "purpose". This isn't a strict science or rule, but a best practice depending on your repository, your scale, your organization, what your teams need, and more. This strategy has several advantages:

- **Easier to understand**: As a repository scales, developers working in the repository will more easily be able to find the code they need.
- **Reducing dependencies per package**: Using fewer dependencies per package makes it so Turborepo can more effectively [prune the dependencies of your package graph](/docs/reference/prune).

Some examples include:

- **`@repo/ui`**: A package containing all of your shared UI components
- **`@repo/tool-specific-config`**: A package for managing configuration of a specific tool
- **`@repo/graphs`**: A domain-specific library for creating and manipulating graphical data

### Application Packages do not contain shared code

When you're creating [Application Packages](/docs/core-concepts/package-types#application-packages), it's best to avoid putting shared code in those packages. Instead, you should create a separate package for the shared code and have the application packages depend on that package.

Additionally, Application Packages are not meant to be installed into other packages. Instead, they should be thought of as an entrypoint to your [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph).

<Callout type="good-to-know">
  There are [rare
  exceptions](/docs/core-concepts/package-types#installing-an-applicaiton-package-into-another-package)
  to this rule.
</Callout>

## Next steps

With a new Internal Package in place, you can start [configuring tasks](/docs/crafting-your-repository/configuring-tasks).

import { LinkToDocumentation } from '#components/link-to-documentation';
import { Callout } from '#components/callout';
import { Tabs, Tab } from '#components/tabs';
import { Files, File, Folder } from '#components/files';
import { ThemeAwareImage } from '#components/theme-aware-image';

A task is a script that Turborepo runs. You can express relationships between tasks in your [`turbo.json` configuration](/docs/reference/configuration) and [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph).

Turborepo will always parallelize any work that it can to ensure everything runs as fast as possible. This is faster than running tasks one at a time, and it's a part of what makes Turborepo so fast.

For example, <code style={{textWrap: "wrap"}}>yarn workspaces run lint && yarn workspaces run build && yarn workspaces run test</code> would look like this:

<ThemeAwareImage
dark={{
    alt: 'A graphical representation of `turbo run lint test build`. It shows all tasks running in parallel, with much less empty space where scripts are not being ran.',
    src: '/images/docs/slow-tasks-dark.png',
    props: {
      width: 778,
      height: 331,
    },
  }}
light={{
    alt: 'A graphical representation of `turbo run lint test build`. It shows all tasks running in parallel, with much less empty space where scripts are not being ran.',
    src: '/images/docs/slow-tasks-light.png',
    props: {
      width: 778,
      height: 331,
    },
  }}
/>

But, to get the same work done **faster** with Turborepo, you can use `turbo run lint build test`:

<ThemeAwareImage
dark={{
    alt: 'A graphical representation of `turbo run lint test build`. It shows all tasks running in parallel, with much less empty space where scripts are not being ran.',
    src: '/images/docs/turborepo-tasks-fast-dark.png',
    props: {
      width: 778,
      height: 448,
    },
  }}
light={{
    alt: 'A graphical representation of `turbo run lint test build`. It shows all tasks running in parallel, with much less empty space where scripts are not being ran.',
    src: '/images/docs/turborepo-tasks-fast-light.png',
    props: {
      width: 778,
      height: 448,
    },
  }}
/>

## Getting started

The root `turbo.json` file is where you'll register the tasks that Turborepo will run. Once you have your tasks defined, you'll be able to run one or more tasks using [`turbo run`](/docs/reference/run).

- If you're starting fresh, we recommend [creating a new repository using `create-turbo`](/docs/getting-started/installation) and editing the `turbo.json` file to try out the snippets in this guide.
- If you're adopting Turborepo in an existing repository, create a `turbo.json` file in the root of your repository. You'll be using it to learn about the rest of the configuration options in this guide.

<Files>
  <File name="turbo.json" green />
  <File name="package.json" />
  <Folder name="apps" />
  <Folder name="packages" />
</Files>

## Defining tasks

Each key in the `tasks` object is a task that can be executed by `turbo run`. Turborepo will search your packages for **scripts in their `package.json` that have the same name as the task**.

To define a task, use [the `tasks` object](/docs/reference/configuration#tasks) in `turbo.json`. For example, a basic task with no dependencies and no outputs named `build` might look like this:

```json title="./turbo.json"
{
  "tasks": {
    "build": {} // Incorrect! // [!code highlight]
  }
}
```

If you run `turbo run build` at this point, Turborepo will run all `build` scripts in your packages in parallel and won't cache any file outputs. **This will quickly lead to errors.** You're missing a few important pieces to make this work how you'd expect.

### Running tasks in the right order

[The `dependsOn` key](/docs/reference/configuration#dependson) is used to specify the tasks that must complete before a different task begins running. For example, in most cases, you want the `build` script for your libraries to complete before your application's `build` script runs. To do this, you'd use the following `turbo.json`:

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"] // [!code highlight]
    }
  }
}
```

You now have the build order you would expect, building _dependencies_ before _dependents_.

**But be careful.** At this point, you haven't marked the build outputs for caching. To do so, jump to the [Specifying outputs](#specifying-outputs) section.

#### Depending on tasks in dependencies with `^`

The `^` microsyntax tells Turborepo to run the task starting at the bottom of the dependency graph. If your application depends on a library named `ui` and the library has a `build` task, the `build` script in `ui` will run **first**. Once it has successfully completed, the `build` task in your application will run.

This is an important pattern as it ensures that your application's `build` task will have all of the necessary dependencies that it needs to compile. This concept also applies as your dependency graph grows to a more complex structure with many levels of task dependencies.

#### Depending on tasks in the same package

Sometimes, you may need to ensure that two tasks in the same package run in a specific order. For example, you may need to run a `build` task in your library before running a `test` task in the same library. To do this, specify the script in the `dependsOn` key as a plain string (without the `^`).

```json title="./turbo.json"
{
  "tasks": {
    "test": {
      "dependsOn": ["build"] // [!code highlight]
    }
  }
}
```

#### Depending on a specific task in a specific package

You can also specify an individual task in a specific package to depend on. In the example below, the `build` task in `utils` must be run before any `lint` tasks.

```json title="./turbo.json"
{
  "tasks": {
    "lint": {
      "dependsOn": ["utils#build"] // [!code highlight]
    }
  }
}
```

You can also be more specific about the dependent task, limiting it to a certain package:

```json title="./turbo.json"
{
  "tasks": {
    "web#lint": {
      "dependsOn": ["utils#build"] // [!code highlight]
    }
  }
}
```

With this configuration, the `lint` task in your `web` package can only be run after the `build` task in the `utils` package is complete.

#### No dependencies

Some tasks may not have any dependencies. For example, a task for finding typos in Markdown files likely doesn't need to care about the status of your other tasks. In this case, you can omit the `dependsOn` key or provide an empty array.

```json title="./turbo.json"
{
  "tasks": {
    "spell-check": {
      "dependsOn": [] // [!code highlight]
    }
  }
}
```

### Specifying `outputs`

<Callout type="info">
  Turborepo caches the outputs of your tasks so that you never do the same work
  twice. We'll discuss this in depth in [the Caching
  guide](/docs/crafting-your-repository/caching), but let's make sure your tasks
  are properly configured first.
</Callout>

The `outputs` key tells Turborepo **files and directories** it should cache when the task has successfully completed. **Without this key defined, Turborepo will not cache any files. Hitting cache on subsequent runs will not restore any file outputs.**

Below are a few examples of outputs for common tools:

<Tabs items={["Next.js", "Vite", "tsc"]} storageKey="outputs-tools">
<Tab value="Next.js">

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**"] // [!code highlight]
    }
  }
}
```

</Tab>

<Tab value="Vite">
```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"] // [!code highlight]
    }
  }
}
```
</Tab>
<Tab value="tsc">
```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "outputs": ["dist/**"] // [!code highlight]
    }
  }
}
```
</Tab>
</Tabs>

Globs are relative to the package, so `dist/**` will handle the `dist` that is outputted for each package, respectively. For more on building globbing patterns for the `outputs` key, see [the globbing specification](/docs/reference/globs).

### Specifying `inputs`

The `inputs` key is used to specify the files that you want to include in the task's hash for [caching](/docs/crafting-your-repository/caching). By default, Turborepo will include all files in the package that are tracked by Git. However, you can be more specific about which files are included in the hash using the `inputs` key.

As an example, a task for finding typos in Markdown files could be defined like this:

```json title="./turbo.json"
{
  "tasks": {
    "spell-check": {
      "inputs": ["**/*.md", "**/*.mdx"] // [!code highlight]
    }
  }
}
```

Now, **only** changes in Markdown files will cause the `spell-check` task to miss cache.

<Callout type="error">
This feature opts out of all of Turborepo's default `inputs` behavior, including following along with changes tracked by source control. This means that your `.gitignore` file will no longer be respected, and you will need to ensure that you do not capture those files with your globs.

To restore the default behavior, use [the `$TURBO_DEFAULT$` microsyntax](#restoring-defaults-with-turbo_default).

</Callout>

#### Restoring defaults with `$TURBO_DEFAULT$`

[The default `inputs` behavior](/docs/reference/configuration#inputs) is often what you will want for your tasks. However, you can increase your cache hit ratios for certain tasks by fine-tuning your `inputs` to ignore changes to files that are known to not affect the task's output.

For this reason, you can use the `$TURBO_DEFAULT$` microsyntax to fine-tune the default `inputs` behavior:

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", "!README.md"] // [!code highlight]
    }
  }
}
```

In this task definition, Turborepo will use the default `inputs` behavior for the `build` task, but will ignore changes to the `README.md` file. If the `README.md` file is changed, the task will still hit cache.

### Registering Root Tasks

You can also run scripts in the `package.json` in the Workspace root using `turbo`. For example, you may want to run a `lint:root` task for the files in your Workspace's root directory in addition to the `lint` task in each package:

<Tabs items={["turbo.json", "package.json"]}>
<Tab value="turbo.json">

```json title="./turbo.json"
{
  "tasks": {
    "lint": {
      "dependsOn": ["^lint"]
    },
    "//#lint:root": {} // [!code highlight]
  }
}
```

</Tab>
<Tab value="package.json">
```json title="./package.json"
{
  "scripts": {
    "lint": "turbo run lint lint:root",
    "lint:root": "eslint ." // [!code highlight]
  }
}
```
</Tab>
</Tabs>

With the Root Task now registered, `turbo run lint:root` will now run the task. You can also run `turbo run lint lint:root` to run all your linting tasks.

#### When to use Root Tasks

- **Linting and formatting of the Workspace root**: You might have code in your Workspace root that you want to lint and format. For example, you might want to run ESLint or Prettier in your root directory.
- **Incremental migration**: While you're migrating to Turborepo, you might have an in-between step where you have some scripts that you haven't moved to packages yet. In this case, you can create a Root Task to start migrating and fan the tasks out to packages later.
- **Scripts without a package scope**: You may have some scripts that don't make sense in the context of specific packages. Those scripts can be registered as Root Tasks so you can still run them with `turbo` for caching, parallelization, and workflow purposes.

## Advanced use cases

### Using Package Configurations

[Package Configurations](/docs/reference/package-configurations) are `turbo.json` files that are placed directly into a package. This allows a package to define specific behavior for its own tasks without affecting the rest of the repository.

In large monorepos with many teams, this allows teams greater control over their own tasks. To learn more, visit [the Package Configurations documentation](/docs/reference/package-configurations)

### Long-running tasks with runtime dependencies

You might have a long-running task that requires another task to always be running at the same time. For this, use [the `with` key](/docs/reference/configuration#with).

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

A long-running task never exits, meaning you can't depend on it. Instead, the `with` keyword will run the `api#dev` task whenever the `web#dev` task runs.

### Performing side-effects

Some tasks should always be run no matter what, like a deployment script after a cached build. For these tasks, add `"cache": false` to your task definition.

```json title="./turbo.json"
{
  "tasks": {
    "deploy": {
      "dependsOn": ["^build"],
      "cache": false // [!code highlight]
    },
    "build": {
      "outputs": ["dist/**"]
    }
  }
}
```

### Dependent tasks that can be run in parallel

Some tasks can be run in parallel despite being dependent on other packages. An example of tasks that fit this description are linters, since a linter doesn't need to wait for outputs in dependencies to run successfully.

Because of this, you may be tempted to define your `check-types` task like this:

```json title="./turbo.json"
{
  "tasks": {
    "check-types": {} // Incorrect! // [!code highlight]
  }
}
```

This runs your tasks in parallel - but doesn't account for source code changes in dependencies. This means you can:

1. Make a breaking change to the interface of your `ui` package.
2. Run `turbo check-types`, hitting cache in an application package that depends on `ui`.

This is incorrect, since the application package will show a successful cache hit, despite not being updated to use the new interface. Checking for TypeScript errors in your application package manually in your editor is likely to reveal errors.

Because of this, you make a small change to your `check-types` task definition:

```json title="./turbo.json"
{
  "tasks": {
    "check-types": {
      "dependsOn": ["^check-types"] // This works...but could be faster! // [!code highlight]
    }
  }
}
```

If you test out making breaking changes in your `ui` package again, you'll notice that the caching behavior is now correct. However, tasks are no longer running in parallel.

To meet both requirements (correctness and parallelism), you can introduce [Transit Nodes](/docs/core-concepts/package-and-task-graph#transit-nodes) to your Task Graph:

```json title="./turbo.json"
{
  "tasks": {
    "transit": {
      "dependsOn": ["^transit"]
    },
    "check-types": {
      "dependsOn": ["transit"]
    }
  }
}
```

These Transit Nodes create a relationship between your package dependencies using a task that doesn't do anything because it doesn't match a script in any `package.json`s. Because of this, your tasks can run in parallel **and** be aware of changes to their internal dependencies.

<Callout type="info">
  In this example, we used the name `transit` - but you can name the task
  anything that isn't already a script in your Workspace.
</Callout>

## Next steps

There are more options available in [the Configuring `turbo.json` documentation](/docs/reference/configuration) that you will explore in the coming guides. For now, you can start running a few tasks to see how the basics work.

import { Callout } from '#components/callout';
import { PackageManagerTabs, Tab } from '#components/tabs';
import { LinkToDocumentation } from '#components/link-to-documentation';
import { InVersion } from '#components/in-version';

Turborepo optimizes the developer workflows in your repository by automatically parallelizing and caching tasks. Once a task is [registered in `turbo.json`](/docs/crafting-your-repository/configuring-tasks), you have a powerful new toolset for running the scripts in your repository:

- [Use `scripts` in `package.json` for tasks you need to run often](#using-scripts-in-packagejson)
- [Use global `turbo` to quickly run custom tasks on-demand](#using-global-turbo)
- [Filter tasks by directories, package names, source control changes, and more](#using-filters)

Running tasks through `turbo` is powerful because you get one model for executing workflows throughout your repository in development and in your CI pipelines.

## Using `scripts` in `package.json`

For tasks that you run frequently, you can write your `turbo` commands directly into your root `package.json`.

```jsonc title="./package.json"
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  }
}
```

<Callout type="good-to-know">
  `turbo` is an alias for `turbo run` - but we recommend using `turbo run` in
  `package.json` and CI workflows to avoid potential collisions with possible
  `turbo` subcommands that could be added in the future.
</Callout>

These scripts can then be run using your package manager.

<PackageManagerTabs>

  <Tab value="pnpm">
  ```bash title="Terminal"
  pnpm dev
  ```

  </Tab>

  <Tab value="yarn">

```bash title="Terminal"
yarn dev
```

  </Tab>

  <Tab value="npm">

```bash title="Terminal"
npm run dev
```

  </Tab>

  <Tab value="bun (Beta)">

```bash title="Terminal"
bun run dev
```

  </Tab>
</PackageManagerTabs>

<Callout type="warn">
You only want to write `turbo` commands in your root `package.json`. Writing `turbo` commands into the `package.json` of packages can lead to recursively
calling `turbo`.

</Callout>

## Using global `turbo`

[Installing `turbo` globally](/docs/getting-started/installation#global-installation) lets you run commands directly from your terminal. This improves your local development experience since it makes it easier to run exactly what you need, when you need it.

Additionally, global `turbo` is useful in your CI pipelines, giving you maximum control of exactly which tasks to run at each point in your pipeline.

### Automatic Package Scoping

When you're in a package's directory, `turbo` will automatically scope commands to the [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph) for that package. This means you can quickly write commands without having to [write filters](/docs/reference/run#--filter-string) for the package.

```bash title="Terminal"
cd apps/docs
turbo build
```

In the example above, the `turbo build` command will run the `build` task for the `docs` package using the `build` task registered in `turbo.json`.

<Callout type="good-to-know">
  [Using a filter](#using-filters) will override Automatic Package Scoping.
</Callout>

### Customizing behavior

In [the documentation for the `run` subcommand](/docs/reference/run), you'll find many useful flags to tailor the behavior of `turbo run` for what you need. When running global `turbo`, you can go faster using workflows like:

- **Variations of your most common commands**: The `build` script in `package.json` has the most utility when it is `turbo build` - but you might only be interested in a specific package at the moment. You can quickly filter for the specific package you're interested in using `turbo build --filter=@repo/ui`.
- **One-off commands**: Commands like `turbo build --dry` aren't needed often so you likely won't create a script in your `package.json` for it. Instead, you can run it directly in your terminal whenever you need it.
- **Overriding `turbo.json` configuration**: Some CLI flags have an equivalent in `turbo.json` that you can override. For instance, you may have a `turbo build` command configured to use [`"outputLogs": "full"` in `turbo.json`](/docs/reference/configuration#outputlogs) - but you're only interested in seeing errors at the moment. Using global `turbo`, you can use `turbo lint --output-logs=errors-only` to only show errors.

## Running multiple tasks

`turbo` is able to run multiple tasks, parallelizing whenever possible.

```bash title="Terminal"
turbo run build test lint check-types
```

This command will run all of the tasks, automatically detecting where it can run a script as early as possible, according to your task definitions.

<Callout type="info" title="Ordering of tasks">
`turbo test lint` will run tasks exactly the same as `turbo lint test`.

If you want to ensure that one task blocks the execution of another, express that relationship in your [task configurations](/docs/crafting-your-repository/configuring-tasks#defining-tasks).

</Callout>

## Using filters

While [caching](/docs/crafting-your-repository/running-tasks) ensures you stay fast by never doing the same work twice, you can also filter tasks to run only a subset of [the Task Graph](/docs/core-concepts/package-and-task-graph#task-graph).

There are many advanced use cases for filtering in [the `--filter` API reference](/docs/reference/run#--filter-string) but the most common use cases are discussed below.

### Filtering by package

Filtering by package is a simple way to only run tasks for the packages you're currently working on.

```bash title="Terminal"
turbo build --filter=@acme/web
```

<InVersion version="2.2.4">

You can also filter to a specific task for the package directly in your CLI command without needing to use `--filter`:

```bash title="Terminal"
# Run the `build` task for the `web` package
turbo run web#build

# Run the `build` task for the `web` package, and the `lint` task for the `docs` package
turbo run web#build docs#lint
```

</InVersion>

### Filtering by directory

Your repository might have a directory structure where related packages are grouped together. In this case, you can capture the glob for that directory to focus `turbo` on those packages.

```bash title="Terminal"
turbo lint --filter="./packages/utilities/*"
```

### Filtering to include dependents

When you're working on a specific package, you might want to run tasks for the package and its dependents. The `...` microsyntax is useful when you're making changes to a package and want to ensure that the changes don't break any of its dependents.

```bash title="Terminal"
turbo build --filter=...ui
```

### Filtering to include dependencies

To limit the scope to a package and its dependencies, append `...` to the package name. This runs the task for the specified package and all packages it depends on.

```bash title="Terminal"
turbo dev --filter=web...
```

### Filtering by source control changes

Using filters to run tasks based on changes in source control is a great way to run tasks only for the packages that are affected by your changes. **Source control filters must be wrapped in `[]`**.

- **Comparing to the previous commit**: `turbo build --filter=[HEAD^1]`
- **Comparing to the main branch**: `turbo build --filter=[main...my-feature]`
- **Comparing specific commits using SHAs**: `turbo build --filter=[a1b2c3d...e4f5g6h]`
- **Comparing specific commits using branch names**: `turbo build --filter=[your-feature...my-feature]`

<Callout type="info">
  In general, you can rely on caching to keep your repository fast. When you're
  using [Remote Caching](/docs/core-concepts/remote-caching), you can count on
  hitting cache for unchanged packages.
</Callout>

### Combining filters

For even more specificity, you can combine filters to further refine the entrypoints into your [Task Graph](/docs/core-concepts/package-and-task-graph#task-graph).

```bash title="Terminal"
turbo build --filter=...ui --filter={./packages/*} --filter=[HEAD^1]
```

Multiple filters are combined as a **union**, meaning that the [Task Graph](/docs/core-concepts/package-and-task-graph#task-graph) will include tasks that match any of the filters. For more information on advanced usage of filters, see [the `--filter` API reference](/docs/reference/run#--filter-string).

## Next steps

When you start running tasks in your repository, you might start noticing that your tasks get faster. Next, you'll explore [caching](/docs/crafting-your-repository/caching) and how `turbo` makes it so you never do the same work twice.

import { Step, Steps } from '#components/steps';
import { PackageManagerTabs, Tab } from '#components/tabs';
import { Callout } from '#components/callout';

Turborepo uses caching to speed up builds, ensuring you **never do the same work twice**. When your task is cacheable, Turborepo will restore the results of your task from cache using a fingerprint from the first time the task ran.

![12 tasks are being ran in 3 packages, resulting in a ">>> FULL TURBO" cache hit. The total time it takes to restore these tasks from cache is 80 milliseconds.](/images/docs/why-turborepo-solution.png)

Turborepo's caching results in significant time savings when working locally - and is even more powerful when [Remote Caching](/docs/core-concepts/remote-caching) is enabled, sharing a cache among your entire team and CI.

On this page, you'll learn:

- [How to hit your first Turborepo cache](#hit-your-first-turborepo-cache)
- [How to enable Remote Caching](/docs/core-concepts/remote-caching)
- [What Turborepo uses for the inputs and outputs to a hash](/docs/crafting-your-repository/caching#task-inputs)
- [How to troubleshoot caching issues](#troubleshooting)

<Callout type="good-to-know">
  Turborepo assumes that your tasks are **deterministic**. If a task is able to
  produce different outputs given the set of inputs that Turborepo is aware of,
  caching may not work as expected.
</Callout>

## Hit your first Turborepo cache

You can try out Turborepo's caching behavior in three steps:

<Steps>
<Step>
### Create a new Turborepo project

Use `npx create-turbo@latest` and follow the prompts to create a new Turborepo.

```bash title="Terminal"
npx create-turbo@latest
```

</Step>
<Step>
### Run a build for the first time

If you have [`turbo` installed globally](/docs/getting-started/installation#global-installation), run `turbo build` in your repository.

Alternatively, you can run the `build` script in `package.json` using your package manager.

<PackageManagerTabs>

<Tab value="pnpm">
```bash title="Terminal"
pnpm run build
```

</Tab>

<Tab value="yarn">
```bash title="Terminal"
yarn build
```

</Tab>

<Tab value="npm">

```bash title="Terminal"
npm run build
```

</Tab>

<Tab value="bun (Beta)">

```bash title="Terminal"
bun run build
```

</Tab>
</PackageManagerTabs>

This will result in a cache miss, since you've never ran `turbo` before with this [set of inputs](/docs/crafting-your-repository/caching#task-inputs) in this repository. The inputs are turned into a hash to check for in your local filesystem cache or in [the Remote Cache](/docs/core-concepts/remote-caching).

</Step>

<Step>

### Hit the cache

Run `turbo build` again. You will see a message like this:

![A terminal window showing two tasks that have been ran through `turbo`. They successfully complete in 116 milliseconds.](/images/docs/full-turbo.png)

</Step>

</Steps>

Because the inputs' fingerprint is already in the cache, there's no reason to rebuild your applications from zero again. You can restore the results of the previous build from cache, saving resources and time.

## Remote Caching

Turborepo stores the results of tasks in the `.turbo/cache` directory on your machine. However, you can make your entire organization even faster by sharing this cache with your teammates and CI.

To learn more about Remote Caching and its benefits, visit the [Remote Caching page](/docs/core-concepts/remote-caching).

### Enabling Remote Cache

First, authenticate with your Remote Cache provider:

```bash title="Terminal"
npx turbo login
```

Then, link the repository on your machine to Remote Cache:

```bash title="Terminal"
npx turbo link
```

Now, when you run a task, Turborepo will automatically send the outputs of the task to Remote Cache. If you run the same task on a different machine that is also authenticated to your Remote Cache, it will hit cache the first time it runs the task.

For information on how to connect your CI machines to Remote Cache, visit [the Constructing CI guide](/docs/crafting-your-repository/constructing-ci#enabling-remote-caching).

<Callout type="info">
  By default, Turborepo uses [Vercel Remote
  Cache](https://vercel.com/docs/monorepos/remote-caching) with zero
  configuration. If you'd like to use a different Remote Cache, visit the
  [Remote Caching API
  documentation](/docs/core-concepts/remote-caching#self-hosting)
</Callout>

## What gets cached?

Turborepo caches two types of outputs: Task outputs and Logs.

### Task outputs

Turborepo caches the file outputs of a task that are defined in [the `outputs` key](/docs/reference/configuration#outputs) of `turbo.json`. When there's a cache hit, Turborepo will restore the files from the cache.

The `outputs` key is optional, see [the API reference](/docs/reference/configuration#outputs) for how Turborepo behaves in this case.

<Callout type="warn" title="Providing file outputs">
If you do not declare file outputs for a task, Turborepo will not cache them. This might be okay for some tasks (like linters) - but many tasks produce files that you will want to be cached.

If you're running into errors with files not being available when you hit cache, make sure that you have defined the outputs for your task.

</Callout>

### Logs

Turborepo always captures the terminal outputs of your tasks, restoring those logs to your terminal from the first time that the task ran.

You can configure the verbosity of the replayed logs using [the `--output-logs` flag](/docs/reference/run#--output-logs-option) or [`outputLogs` configuration option](/docs/reference/configuration#outputlogs).

## Task inputs

Inputs are hashed by Turborepo, creating a "fingerprint" for the task run. When "fingerprints" match, running the task will hit the cache.

Under the hood, Turborepo creates two hashes: a global hash and a task hash. If either of the hashes change, the task will miss cache.

### Global hash inputs

| Input                                                                                  | Example                                                                                                                                                    |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resolved task definition from root `turbo.json`<br /> and package `turbo.json`         | Changing [`outputs`](/docs/reference/configuration#outputs) in either root `turbo.json` or [Package Configuration](/docs/reference/package-configurations) |
| Lockfile changes that affect the Workspace root                                        | Updating dependencies in root `package.json` will cause **all** tasks to miss cache                                                                        |
| [`globalDependencies`](/docs/reference/configuration#globaldependencies) file contents | Changing `./.env` when it is listed in `globalDependencies` will cause **all** tasks to miss cache                                                         |
| Values of variables listed in [`globalEnv`](/docs/reference/configuration#globalenv)   | Changing the value of `GITHUB_TOKEN` when it is listed in `globalEnv`                                                                                      |
| Flag values that affect task runtime                                                   | Using behavior-changing flags like `--cache-dir`, `--framework-inference`, or `--env-mode`                                                                 |
| Arbitrary passthrough arguments                                                        | `turbo build -- --arg=value` will miss cache compared to `turbo build` or `turbo build -- --arg=diff`                                                      |

### Package hash inputs

| Input                                                                   | Example                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| [Package Configuration](/docs/reference/package-configurations) changes | Changing a package's `turbo.json`                       |
| Lockfile changes that affect the package                                | Updating dependencies in a package's `package.json`     |
| Package's `package.json` changes                                        | Updating the `name` field in a package's `package.json` |
| File changes in source control                                          | Writing new code in `src/index.ts`                      |

## Troubleshooting

### Using dry runs

Turborepo has a [`--dry` flag](/docs/reference/run#--dry----dry-run) that can be used to see what would happen if you ran a task without actually running it. This can be useful for debugging caching issues when you're not sure which tasks you're running.

For more details, visit the [`--dry` API reference](/docs/reference/run#--dry----dry-run).

### Using Run Summaries

Turborepo has a [`--summarize` flag](/docs/reference/run#--summarize) that can be used to get an overview of all of a task's inputs, outputs, and more. Comparing two summaries will show why two task's hashes are different. This can be useful for:

- Debugging inputs: There are many inputs to a task in Turborepo. If a task is missing cache when you expect it to hit, you can use a Run Summary to check which inputs are different that you weren't expecting.
- Debugging outputs: If cache hits aren't restoring the files you're expecting, a Run Summary can help you understand what outputs are being restored from cache.

<Callout type="info" title="Summaries viewer">
  While there is not a Turborepo-native Run Summaries UI viewer, we encourage
  you to use the community-built
  [https://turbo.nullvoxpopuli.com](https://turbo.nullvoxpopuli.com) if you
  would like to view your Run Summaries as a web view.
</Callout>

### Turning off caching

Sometimes, you may not want to write the output of tasks to the cache. This can be set permanently for a task using [`"cache": false`](/docs/reference/configuration#cache) or for a whole run using [ the `--cache <options>` flag](/docs/reference/run#--no-cache).

### Overwriting a cache

If you want to force `turbo` to re-execute a task that has been cached, use [the `--force` flag](/docs/reference/run#--force). Note that this disables **reading** the cache, **not writing**.

### Caching a task is slower than executing the task

It's possible to create scenarios where caching ends up being slower than not caching. These cases are rare, but a few examples include:

- **Tasks that execute extremely fast**: If a task executes faster than a network round-trip to the [Remote Cache](/docs/core-concepts/remote-caching), you should consider not caching the task.
- **Tasks whose output assets are enormous**: It's possible to create an artifact that is so big that the time to upload or download it exceeds the time to regenerate it, like a complete Docker Container. In these cases, you should consider not caching the task.
- **Scripts that have their own caching**: Some tasks have their own internal caching behavior. In these cases, configuration can quickly become complicated to make Turborepo's cache and the application cache work together.

While these situations are rare, be sure to test the behavior of your projects to determine if disabling caching in specific places provides a performance benefit.

## Next steps

Now that you've seen how Turborepo's caching makes your repository faster, let's take a look at how to develop applications and libraries in your Turborepo.

import { Tabs, Tab } from '#components/tabs';
import { LinkToDocumentation } from '#components/link-to-documentation';

Developing applications in a monorepo unlocks powerful workflows, enabling you to make atomic commits to source control with easy access to code.

Most development tasks are long-running tasks that watch for changes to your code. Turborepo enhances this experience with a powerful terminal UI and other capabilities like:

- [Configuration for `dev` tasks](#configuring-development-tasks)
- [Interacting with tasks](#interacting-with-tasks)
- [Watch Mode](#watch-mode)
- [Running setup scripts](#running-setup-tasks-before-dev)
- [Filtering tasks to run a subset of your packages](#running-a-specific-application)

## Configuring development tasks

Defining a development task in `turbo.json` tells Turborepo that you'll be running a long-lived task. This is useful for things like running a development server, running tests, or building your application.

To register a `dev` task, add it to your `turbo.json` with two properties:

```json title="./turbo.json"
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- **"cache": false**: Tells Turborepo to not attempt to cache the results of the task. Since this is a development task, you're likely to be making frequent changes to your code, so caching the results is not useful.
- **"persistent": true**: Tells Turborepo to keep the task running until you stop it. This key serves as a signal for your terminal UI to treat the task as long-running and interactive. Additionally, it prevents you from accidentally depending on a task that will not exit.

You can now run your `dev` task to start your development scripts in parallel:

```bash title="Terminal"
turbo dev
```

### Running setup tasks before `dev`

You may also want to run scripts that set up your development environment or pre-build packages. You can make sure those tasks run before the `dev` task with `dependsOn`:

```json title="./turbo.json"
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["//#dev:setup"]
    },
    "//#dev:setup": {
      "outputs": [".codegen/**"]
    }
  }
}
```

In this example, we're using a [Root Task](/docs/crafting-your-repository/configuring-tasks#registering-root-tasks) but you can use the same idea for [arbitrary tasks in packages](/docs/crafting-your-repository/configuring-tasks#depending-on-a-specific-task-in-a-specific-package).

### Running a specific application

The `--filter` flag allows you to pick a subset of your [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph) so you can run your `dev` task for a specific application and its dependencies:

```bash title="Terminal"
turbo dev --filter=web
```

## Using the terminal UI

Turborepo's terminal UI enables a number of features that create a highly interactive experience around your tasks.

### Customizing your view

You can quickly adjust the UI to your needs using keybinds.

| Keybind | Action                                                            |
| ------- | ----------------------------------------------------------------- |
| `m`     | Toggle popup listing keybinds                                     |
| `↑`/`↓` | Select the next/previous task in the task list                    |
| `j`/`k` | Select the next/previous task in the task list                    |
| `p`     | Toggle selection pinning for selected task                        |
| `h`     | Toggle visibility of the task list                                |
| `c`     | When logs are highlighted, copy selection to the system clipboard |
| `u`/`d` | Scroll logs `u`p and `d`own                                       |

### Interacting with tasks

Some of your tools may allow you to type input into them. Examples of this include Drizzle ORM's interactive migrations or Jest's filtering and re-running of test suites.

You can interact with tasks that are [marked as interactive](/docs/reference/configuration#interactive) to give them input.

| Keybind  | Action            |
| -------- | ----------------- |
| `i`      | Begin interacting |
| `Ctrl+z` | Stop interacting  |

## Watch Mode

Many tools have a built-in watcher, like [`tsc --watch`](https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options),
that will respond to changes in your source code. However, some don't.

`turbo watch` adds a dependency-aware watcher to any tool. Changes to source code will follow [the Task Graph](/docs/core-concepts/package-and-task-graph#task-graph) that you've described in `turbo.json`, just like all your other tasks.

For example, using a package structure like [`create-turbo`](/docs/reference/create-turbo) with the following tasks and scripts:

<Tabs items={["turbo.json", "packages/ui", "apps/web"]}>
<Tab value="turbo.json">

```json title="turbo.json"
{
  "tasks": {
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

</Tab>

<Tab value="packages/ui">

```json title="package.json"
{
  "name": "@repo/ui"
  "scripts": {
    "dev": "tsc --watch",
    "lint": "eslint ."
  }
}
```

</Tab>

<Tab value="apps/web">

```json title="package.json"
{
  "name": "web"
  "scripts": {
    "dev": "next dev",
    "lint": "eslint ."
  },
  "dependencies": {
      "@repo/ui": "workspace:*"
    }
}
```

</Tab>
</Tabs>

When you run `turbo watch dev lint`, you'll see the `lint` scripts are re-run whenever you make source code changes, despite ESLint not having a built-in watcher. `turbo watch` is also aware of internal dependencies, so a code change in `@repo/ui` will re-run the task in both `@repo/ui` and `web`.

The Next.js development server in `web` and the TypeScript Compiler's built-in watcher in `@repo/ui` will continue to work as usual, since they are marked with `persistent`.

For more information, [visit the `turbo watch` reference](/docs/reference/watch).

## Limitations

### Teardown tasks

In some cases, you may want to run a script when the `dev` task is stopped. Turborepo is unable to run those teardown scripts when exiting because `turbo` exits when your `dev` tasks exit.

Instead, create a `turbo dev:teardown` script that you run separately after you've exited your primary `turbo dev` task.

## Next steps

Once you have a version of your application that you'd like to deploy, it's time to learn how to configure environment variables in Turborepo.

import { Fragment } from 'react';
import { Callout } from '#components/callout';
import { Tabs, Tab } from '#components/tabs';
import { Accordion, Accordions } from '#components/accordion';
import frameworks from '@turbo/types/src/json/frameworks.json';

Environment variable inputs are a vital part of your applications that you'll need to account for in your Turborepo configuration.

There are three important questions when working with environment variables in Turborepo:

- [Are my environment variables accounted for in the task hash?](#adding-environment-variables-to-task-hashes)
- [Which Environment Mode will `turbo` use?](#environment-modes)
- [Have I handled my `.env` files?](#handling-env-files)

<Callout type="error">
  Failing to account for environment variables in your configuration can result
  in shipping your application with the wrong configuration. This can cause
  serious issues like shipping your preview deployments to production.
</Callout>

<Callout type="good-to-know">
  Turborepo also uses [System Environment
  Variables](/docs/reference/system-environment-variables) to configure its own
  behavior. Below, you'll find information about environment variables for your
  task's runtime and how they affect task hashing.
</Callout>

## Adding environment variables to task hashes

Turborepo needs to be aware of your environment variables to account for changes in application behavior. To do this, use the `env` and `globalEnv` keys in your `turbo.json` file.

```json title="./turbo.json"
{
  "globalEnv": ["IMPORTANT_GLOBAL_VARIABLE"],
  "tasks": {
    "build": {
      "env": ["MY_API_URL", "MY_API_KEY"]
    }
  }
}
```

- **globalEnv**: Changes to the values of any environment variables in this list will change the hash for all tasks.
- **env**: Includes changes to the values of environment variables that affect the task, allowing for better granularity. For example, a `lint` task probably doesn't need to miss cache when the value of `API_KEY` changes, but a `build` task likely should.

<Callout type="good-to-know">
  Turborepo supports wildcards for environment variables so you can easily
  account for all environment variables with a given prefix. Visit [the API
  reference for `env`](/docs/reference/configuration#wildcards) for more.
</Callout>

### Framework Inference

Turborepo automatically adds prefix wildcards to your [`env`](/docs/reference/configuration#env) key for common frameworks. If you're using one of the frameworks below in a package, you don't need to specify environment variables with these prefixes:

<table>
  <thead>
    <tr>
      <th>Framework</th>
      <th>
        <span>
          <code>env</code> wildcards
        </span>
      </th>
    </tr>
  </thead>
  <tbody>
    {frameworks.map(({ name, envWildcards }) => (
      <tr key={name}>
        <td>{name}</td>
        <td>
          {envWildcards.map((envWildcard, index) => (
            <Fragment key={envWildcard}>
              {index !== 0 ? <span>, </span> : null}
              <code>{envWildcard}</code>
            </Fragment>
          ))}
        </td>
      </tr>
    ))}
  </tbody>
</table>

<Callout type="good-to-know">Framework inference is per-package.</Callout>

If you'd like to opt out of Framework Inference, you can do so by:

- Running your tasks with `--framework-inference=false`
- Adding a negative wildcard to the `env` key (for example, `"env": ["!NEXT_PUBLIC_*"]`)

## Environment Modes

Turborepo's Environment Modes allow you to control which environment variables are available to a task at runtime:

- [Strict Mode](#strict-mode) (Default): Filter environment variables to **only** those that are specified in the `env` and `globalEnv` keys in `turbo.json`.
- [Loose Mode](#loose-mode): Allow all environment variables for the process to be available.

### Strict Mode

Strict Mode filters the environment variables available to a task's runtime to **only** those that are specified in the `globalEnv` and `env` keys in `turbo.json`.

This means that tasks that do not account for all of the environment variables that they need are likely to fail. This is a good thing, since you don't want to cache a task that can potentially have different behavior in a different environment.

<Callout type="warn" title="Cache safety with Strict Mode">
  While Strict Mode makes it much more likely for your task to fail when you
  haven't accounted for all of your environment variables, it doesn't guarantee
  task failure. If your application is able to gracefully handle a missing
  environment variable, you could still successfully complete tasks and get
  unintended cache hits.
</Callout>

#### Passthrough variables

In advanced use cases, you may want to make some environment variables
available to a task without including them in the hash. Changes to these variables don't affect task outputs but still need to be available for the task to run successfully.

For these cases, add those environment variables to [`globalPassThroughEnv`](/docs/reference/configuration#globalpassthroughenv) and [`passThroughEnv`](/docs/reference/configuration#passthroughenv).

#### CI vendor compatibility

Strict Mode will filter out environment variables that come from your CI vendors until you've accounted for them using [`env`](/docs/reference/configuration#env), [`globalEnv`](/docs/reference/configuration#globalenv), [`passThroughEnv`](/docs/reference/configuration#passthroughenv), or [`globalPassThroughEnv`](/docs/reference/configuration#globalpassthroughenv).

If any of these variables are important to your tasks and aren't included by [Framework Inference](#framework-inference), make sure they are in your `turbo.json` configuration.

### Loose Mode

Loose Mode does not filter your environment variables according to your `globalEnv` and `env` keys. This makes it easier to get started with incrementally migrating to Strict Mode.

Use [the `--env-mode` flag](/docs/reference/run#--env-mode-option) to enable Loose Mode on any invocation where you're seeing environment variables cannot be found by your scripts:

```bash title="Terminal"
turbo run build --env-mode=loose
```

As long as the environment variable is available when `turbo` is ran, your script will be able to use it. However, this also **lets you accidentally forget to account for an environment variable in your configuration much more easily**, allowing the task to hit cache when it shouldn't.

For example, you may have some code in your application that fetches data from an API, using an environment variable for the base URL:

```ts title="./apps/web/data-fetcher.ts"
const data = fetch(`${process.env.MY_API_URL}/resource/1`);
```

You then build your application using a value for `MY_API_URL` that targets your preview environment. When you're ready to ship your application, you build for production and see a cache hit - even though the value of the `MY_API_URL` variable has changed! `MY_API_URL` changed - but Turborepo restored a version of your application from cache that uses the preview environment's `MY_API_URL` rather than production's.

When you're using Loose Mode, `MY_API_URL` is available in the task runtime **even though it isn't accounted for in the task hash**. To make this task more likely to fail and protect you from this misconfiguration, we encourage you to opt for [Strict Mode](#strict-mode).

### Platform Environment Variables

When deploying your application to [Vercel](https://vercel.com/new?ref=turborepo), you likely already have [environment variables](https://vercel.com/docs/projects/environment-variables) configured on your project. Turborepo will automatically check these variables against your `turbo.json` configuration to ensure that you've [accounted for them](/docs/crafting-your-repository/using-environment-variables#adding-environment-variables-to-task-hashes),
and will warn you about any missing variables.

This functionality can be disabled by setting `TURBO_PLATFORM_ENV_DISABLED=false`

## Handling `.env` files

`.env` files are great for working on an application locally. **Turborepo does not load .env files into your task's runtime**, leaving them to be handled by your framework, or tools like [`dotenv`](https://www.npmjs.com/package/dotenv).

However, it's important that `turbo` knows about changes to values in your `.env` files so that it can use them for hashing. If you change a variable in your `.env` files between builds, the `build` task should miss cache.

To do this, add the files to the [`inputs`](/docs/reference/configuration#inputs) key:

```json title="./turbo.json"
{
  "globalDependencies": [".env"], // All task hashes
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", ".env"] // Only the `build` task hash
    }
  }
}
```

### Multiple `.env` files

You can capture multiple `.env` files at once using a `*`.

```json title="./turbo.json"
{
  "globalDependencies": [".env"], // All task hashes
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", ".env*"] // Only the `build` task hash
    }
  }
}
```

<Callout type="info">
  `.env` files can load variables into the task runtime even when the
  environment variables have not been added to [the `env`
  key](/docs/reference/configuration#env). Ensure that you add your environment
  variables for your builds the `env` key for CI and production builds.
</Callout>

## Best practices

### Use `.env` files in packages

Using a `.env` file at the root of the repository is not recommended. Instead, we recommend placing your `.env` files into the packages where they're used.

This practice more closely models the runtime behavior of your applications since environment variables exist in each application's runtime individually. Additionally, as your monorepo scales, this practice makes it easier to manage each application's environment, preventing environment variable leakage across applications.

<Callout type="good-to-know">
  You may find it easier to use a root `.env` file when incrementally migrating
  to a monorepo. Tools like [dotenv](https://www.npmjs.com/package/dotenv) can
  load `.env` files from different locations.
</Callout>

### Use `eslint-config-turbo`

[The `eslint-config-turbo` package](/docs/reference/eslint-config-turbo) helps you find environment variables that are used in your code that aren't listed in your `turbo.json`. This helps ensure that all your environment variables are accounted for in your configuration.

### Avoid creating or mutating environment variables at runtime

Turborepo hashes the environment variables for your task at the beginning of the task. If you create or mutate environment variables during the task, Turborepo will not know about these changes and will not account for them in the task hash.

For instance, Turborepo will not be able to detect the inline variable in the example below:

```json title="./apps/web/package.json"
{
  "scripts": {
    "dev": "export MY_VARIABLE=123 && next dev"
  }
}
```

`MY_VARIABLE` is being added to the environment _after_ the `dev` task has started, so `turbo` will not be able to use it for hashing.

## Examples

Below are examples of proper environment variable configuration for a few popular frameworks:

<Accordions>
<Accordion title="Next.js">

The `turbo.json` below expresses:

- The `build` and `dev` tasks will have different hashes for changes to `MY_API_URL` and `MY_API_KEY`.
- The `build` and `dev` tasks use the same [file loading order as Next.js](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#environment-variable-load-order), with `.env` having the most precedence.
- The `test` task does not use environment variables, so the `env` key is omitted. (Depending on your testing structure, your `test` task may need an `env` key.)

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "env": ["MY_API_URL", "MY_API_KEY"],
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env.production.local",
        ".env.local",
        ".env.production",
        ".env"
      ]
    },
    "dev": {
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env.development.local",
        ".env.local",
        ".env.development",
        ".env"
      ]
    },
    "test": {}
  }
}
```

</Accordion>
<Accordion title="Vite">
The `turbo.json` below expresses:
- The `build` and `dev` tasks will have different hashes for changes to `MY_API_URL` and `MY_API_KEY`.
- The `build` and `dev` tasks use the same [file loading order as Vite](https://vitejs.dev/guide/env-and-mode#env-files), with `.env` having the most precedence.
- The `test` task does not use environment variables, so the `env` key is omitted. (Depending on your testing structure, your `test` task may need an `env` key.)

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "env": ["MY_API_URL", "MY_API_KEY"],
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env.production.local",
        ".env.local",
        ".env.production",
        ".env"
      ]
    },
    "dev": {
      "inputs": [
        "$TURBO_DEFAULT$",
        ".env.development.local",
        ".env.local",
        ".env.development",
        ".env"
      ]
    },
    "test": {}
  }
}
```

</Accordion>
</Accordions>

## Troubleshooting

### Use `--summarize`

[The `--summarize` flag](/docs/reference/run#--summarize) can be added to your `turbo run` command to produce a JSON file summarizing data about your task. Checking the diff for the `globalEnv` and `env` key can help you identify any environment variables that may be missing from your configuration.

## Next steps

Once you've accounted for your environment variables, you're ready to start building the CI pipelines that build, check, and deploy your applications, at the speed of `turbo`.

import { Callout } from '#components/callout';
import { Tabs, Tab } from '#components/tabs';
import { Step, Steps } from '#components/steps';

Turborepo speeds up builds, lints, tests, and any other tasks that you need to do in your Continuous Integration pipelines. Through parallelization and [Remote Caching](/docs/core-concepts/remote-caching), Turborepo makes your CI dramatically faster.

For examples of how to connect your CI vendor to Remote Cache and run tasks, visit our [CI guides](/docs/guides/ci-vendors).

## Enabling Remote Caching

To enable Remote Caching for your CI, setup the environment variables for Turborepo to access your Remote Cache.

| Environment Variable | Description                                                                                                                                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TURBO_TOKEN`        | The Bearer token to access the Remote Cache                                                                                                                                                                                                                                                                                  |
| `TURBO_TEAM`         | The account name associated with your repository. When using{' '} <a href="https://vercel.com/docs/monorepos/remote-caching#vercel-remote-cache" rel="noreferrer noopener" target="_blank" >Vercel Remote Cache</a>, this is [your team's slug](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fsettings&title=Get+team+slug). |

When you run tasks through `turbo`, your CI will be able to hit cache, speeding up your pipelines.

<Callout type="info" title="Remote Cache hosting">
Vercel's built-in CI/CD is automatically connected to your managed Vercel Remote Cache with zero configuration. To retrieve a token for connecting your other CI vendors to Vercel Remote Cache, visit the [Vercel Remote Cache documentation](https://vercel.com/docs/monorepos/remote-caching#use-remote-caching-from-external-ci/cd).

For self-hosted Remote Cache options, visit [Turborepo's Remote Cache documentation](/docs/core-concepts/remote-caching#remote-cache-api).

</Callout>

## Running tasks in CI

By [installing `turbo` globally](/docs/getting-started/installation#global-installation) onto your development and CI machines, you can use one mental model to run your entire repository, from development to ship. The tasks that you've registered in your `turbo.json` will work exactly the same in CI.

- For more information on how to set up tasks, visit the [Configuring Tasks](/docs/crafting-your-repository/configuring-tasks) page.
- For examples of running tasks in CI, visit our [CI guides](/docs/guides/ci-vendors).

### Filtering for entry points

You can filter your tasks using [the `--filter` flag](/docs/reference/run#--filter-string) exactly the same as when you're working with `turbo` locally. Filtering by packages, directories, and Git history are all supported in CI.

<Callout type="info" title="Using Git history in CI">
  Filtering using source control changes is only possible when history is
  available on the machine. If you are using shallow clones, history will not be
  available.
</Callout>

You can also use [the `--affected` flag](#running-only-affected-tasks) to only run tasks in packages that have changes.

## Docker

Docker is an important part of many deployment pipelines. [Turborepo's `prune` subcommand](/docs/reference/prune) helps you ship lightweight images by removing unnecessary dependencies and code from your images.

For more on how to deploy from a Turborepo with Docker, visit [the dedicated Docker guide](/docs/guides/tools/docker).

## Skipping tasks and other unnecessary work

### Running only affected tasks

You can use the `--affected` flag to only run tasks that have changes.

```bash title="Terminal"
turbo run build --affected
```

You'll want to use this flag in situations like:

- You're running many tasks across packages in your monorepo, and only want to run those tasks in packages with code changes.
- You’re _not_ using a Remote Cache, but still want to do as little work as possible in CI.
- You _are_ using a Remote Cache, and you’re in a large repository. By minimizing the amount of tasks that will be restored from cache, there will be less data to send across the network, resulting in faster cache restoration.
- You’re already using [advanced filtering techniques](/docs/reference/run#advanced-filtering-examples) or [`turbo-ignore`](/docs/reference/turbo-ignore) to create the same or similar behavior as `--affected`. You likely have the opportunity to simplify your scripting using this new flag.
  - `--affected` will can handle shallow clones more gracefully than bespoke filtering because it falls back to running all tasks.

#### Using `--affected` in GitHub Actions

CI/CD pipelines are a perfect place to use `--affected`. With `--affected`, Turborepo can automatically detect that you're running in GitHub Actions by inspecting environment variables set by GitHub, like `GITHUB_BASE_REF`.

In the context of a PR, this means that Turborepo can determine which packages have changed between the PR's base branch and the PR's head branch. This allows you to run tasks only for the packages that are affected by the changes in the PR.

While `GITHUB_BASE_REF` works well in `pull_request` and `pull_request_target` events, it is not available during regular push events. In those cases, we use `GITHUB_EVENT_PATH` to determine the base branch to compare your commit to. In force pushes and pushing branch with no additional commits, we compare to the parent of the first commit on the branch.

### Using `turbo-ignore`

As your codebase and CI grow, you may start to look for more ways to get even faster. While hitting cache is useful, you also may be able to skip work entirely. Using `turbo-ignore`, you can skip lengthy container preparation steps like dependency installation that will end up resulting in a cache hit, anyway.

<Steps>
<Step>
### Checkout the repository

Start by cloning your repository. Note that a clone with history to the cloning depth you plan on using is necessary for comparisons.

<Callout type="good-to-know">
  By default, `turbo-ignore` uses the parent commit. To customize for more
  depth, see [the turbo-ignore reference](/docs/reference/turbo-ignore).
</Callout>

</Step>
<Step>
### Run `turbo-ignore` for the package and task

By default, `turbo-ignore` will use the `build` task in the current working directory.

- To check for changes to a different task, use the `--task` flag.
- To check for changes for a specific package and its dependencies, add the package's name as an argument.

<Tabs items={["web#build (Named)", "web#build (Inferred)", "docs#test (--task flag)"]}>
<Tab value="web#build (Named)">

Check for changes for the `build` task for the `web` package and its dependencies by adding the `web` package as an argument:

```bash title="Terminal"
npx turbo-ignore web
```

</Tab>

<Tab value="web#build (Inferred)">

Check for changes for the `build` task for the `web` package and its dependencies using [Automatic Package Scoping](/docs/crafting-your-repository/running-tasks#automatic-package-scoping):

```bash title="Terminal"
cd apps/web
npx turbo-ignore
```

</Tab>

<Tab value="docs#test (--task flag)">

Check for changes for the `test` task for the `docs` package and its dependencies using [Automatic Package Scoping](/docs/crafting-your-repository/running-tasks#automatic-package-scoping) and the `--task` flag:

```bash title="Terminal"
cd apps/docs
npx turbo-ignore --task=test
```

</Tab>
</Tabs>
</Step>

<Step>
### Handle the result

If changes are detected in the package or its [Internal Dependencies](/docs/core-concepts/internal-packages), `turbo` will exit with a `1` status code. If no changes are detected, it will exit with `0`.

Using this status code, you can choose what the rest of your CI pipeline should do. For instance, a `1` exit code likely means that you should move forward with installing dependencies and running tasks.

</Step>
</Steps>
For more advanced use cases, see the [`turbo-ignore` reference](/docs/reference/turbo-ignore).

## Best practices

### Rely on caching

Turborepo's caching abilities allow you to create fast CI pipelines with minimal complexity. Through [Remote Caching](/docs/core-concepts/remote-caching) and using the `--filter` flag to target packages for builds, Turborepo will handle change detection for large monorepos with little overhead.

For example, your CI could run these two commands to quickly handle quality checks and build your target application:

- `turbo run lint check-types test`: Run quality checks for your entire repository. Any packages that haven't changed will hit cache.
- `turbo build --filter=web`: Build the `web` package using the `build` task you've registered in `turbo.json`. If the `web` package or its dependencies haven't changed, the build will also hit cache.

As your codebase scales, you may find more specific opportunities to optimize your CI - but relying on caching is a great place to start.

### Global `turbo` in CI

Using global `turbo` is convenient in CI workflows, allowing you to easily run commands specific to your CI and take advantage of [Automatic Workspace Scoping](/docs/crafting-your-repository/running-tasks#automatic-package-scoping).

However, in some cases, you may be running `turbo` commands or scripts that use `turbo` **before installing packages with your package manager**. One example of this is [using `turbo prune` to create a Docker image](/docs/guides/tools/docker#example). In this situation, global `turbo` will not be able to use the version from `package.json` because the binary for that version hasn't been installed yet.

For this reason, we encourage you to **pin your global installation of `turbo` in CI to the major version in `package.json`** since breaking changes will not be introduced within a major version. You could additionally opt for added stability by pinning an exact version, trading off for maintenance burden to receive bug fixes in patch releases.

### Use `turbo run` in CI

`turbo run` is the most common command you will use when working in your Turborepo so it is aliased to `turbo` for convenience. While this is great for working locally, there are other subcommands for `turbo` like [`turbo prune`](/docs/reference/prune) and [`turbo generate`](/docs/reference/generate).

We're always working to make `turbo` better so we may add more subcommands in the future. For this reason, you can prevent naming collisions by using `turbo run` in your CI.

As an example, if you have a `turbo deploy` command in your CI pipelines, it may conflict with a potential `deploy` subcommand built directly into the `turbo` CLI. To avoid this, use `turbo run deploy` in your CI pipeline instead.

## Troubleshooting

### Hitting cache results in broken builds

If your task is **passing when you miss cache but failing when you hit cache**, you likely haven't configured [the `outputs` key](/docs/reference/configuration#outputs) for your task correctly.

### Deployment using the wrong environment variables

If you haven't defined the `env` or `globalEnv` keys for your task, Turborepo will not be able to use them when creating hashes. This means your task can hit cache despite being in a different environment.

Check your configuration for the `env` and `globalEnv` keys.

## Next steps

You now have everything you need to ship applications with Turborepo. To learn more about specific use cases, [check the Guides](/docs/guides) or [dive deeper into core concepts](/docs/core-concepts).

Turborepo includes tools for understanding your repository structure, that can help you use and optimize your codebase.

## `turbo ls`

To list your packages, you can run `turbo ls`. This will show the packages in your repository and where they're located.

```bash title="Terminal"
> turbo ls

  @repo/eslint-config packages/eslint-config
  @repo/typescript-config packages/typescript-config
  @repo/ui packages/ui
  docs apps/docs
  web apps/web
```

You can [apply filters](/docs/crafting-your-repository/running-tasks#using-filters) to `ls`, just like `run`:

```bash title="Terminal"
> turbo ls --filter ...ui
3 packages (pnpm9)

  @repo/ui packages/ui
  docs apps/docs
  web apps/web
```

## `turbo run`

To determine which tasks can be run in your monorepo, simply call `turbo run` without any tasks. You will get a list of
tasks and the packages in which they are defined:

```bash title="Terminal"
> turbo run
No tasks provided, here are some potential ones

  lint
    @repo/ui, docs, web
  build
    docs, web
  dev
    docs, web
  start
    docs, web
  generate:component
    @repo/ui
```

## `turbo query`

If you wish to dig into your repository structure, since `2.2.0`, Turborepo provides a GraphQL interface into your repository
via `turbo query`. You can execute queries such as finding all packages that have a `test` task:

```bash title="Terminal"
> turbo query "query { packages(filter: { has: { field: TASK_NAME, value: \"build\"}}) { items { name } } }"
{
  "data": {
    "packages": {
      "items": [
        {
          "name": "//"
        },
        {
          "name": "docs"
        },
        {
          "name": "web"
        }
      ]
    }
  }
}
```

This can be helpful for diagnosing potential problems in your package or task dependency graph. For instance, let's say
you're getting a lot of cache misses in your builds. This could be because there's a package that keeps getting changed
and is imported throughout your codebase.

To do this, we can run a query to find packages that are directly imported more than 10 times in your monorepo:

```bash title="Terminal"
> turbo query "query { packages(filter: { greaterThan: { field: DIRECT_DEPENDENT_COUNT, value: 10 } }) { items { name } } }"
{
  "data": {
    "packages": {
      "items": [
        {
          "name": "utils"
        }
      ]
    }
  }
}
```

Now that we've found this package, we can try to split it up into smaller packages so that a small change won't
invalidate the whole dependency graph.

Or let's say you're using our new `--affected` flag, but you're still running more tasks than you'd like.
With `turbo query`, you can find all the packages and the reason why they were invalidated:

```bash title="Terminal"
> turbo query "query { affectedPackages(base: \"HEAD^\", head: \"HEAD\") { items { reason {  __typename } } } }"
{
  "data": {
    "affectedPackages": {
      "items": [
        {
          "name": "utils",
          "reason": {
            "__typename": "FileChanged"
          }
        },
        {
          "name": "web",
          "reason": {
            "__typename": "DependencyChanged"
          }
        },
        {
          "name": "docs",
          "reason": {
            "__typename": "DependencyChanged"
          }
        },
        {
          "name": "cli",
          "reason": {
            "__typename": "DependencyChanged"
          }
        },
      ]
    }
  }
}
```

import { Callout } from '#components/callout';

In Turborepo, we talk about two types of packages:

- [Application Packages](#application-packages)
- [Library Packages](#library-packages)

## Application Packages

An Application Package is a package in your workspace that will be deployed from your workspace. Examples of Application Packages are Next.js, Svelte, Vite, or CLI applications that are commonly found in the `./apps` directory.

It's best practice that your Application Packages are the "end" of your [Package Graph](/docs/core-concepts/package-and-task-graph#package-graph), not being installed into other packages of your repository. Your CI/CD pipelines will most often finalize at these nodes of your Package and Task Graphs.

### Installing an application package into another package

In rare cases, you may need to install an Application Package into another package. This should be the exception. If you find you are doing this often, you may want to rethink your package structure.

An example of an exception for this rule is installing your Application Package into a package that handles end-to-end testing. Once installed, you can depend on the Application Package in your end-to-end testing package so it is aware of re-deploys of the application.

## Library Packages

Library Packages contain code that you intend to share around your workspace. They aren't independently deployable. Instead, they support the Application Packages to create the final deployables from your repository. You might also refer to these packages as [Internal Packages](/docs/core-concepts/internal-packages), which have their own sub-types.

import { PackageManagerTabs, Tab } from '#components/tabs';

Internal Packages are libraries whose source code is inside your Workspace. You can quickly make Internal Packages to share code within your monorepo and choose to [publish them to the npm registry](/docs/guides/publishing-libraries) if you need to later.

Internal Packages are used in your repository by installing them in `package.json` similar to an external package coming from the npm registry. However, instead of marking a version to install, you can reference the package using your package manager's workspace installation syntax:

<PackageManagerTabs>

<Tab value="pnpm">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/ui": "workspace:*" // [!code highlight]
  }
}
```
</Tab>

<Tab value="yarn">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/ui": "*" // [!code highlight]
  }
}
```
</Tab>

<Tab value="npm">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/ui": "*" // [!code highlight]
  }
}
```
</Tab>

<Tab value="bun (Beta)">
```json title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/ui": "workspace:*" // [!code highlight]
  }
}
```
</Tab>
</PackageManagerTabs>

In the [Creating an Internal Package guide](/docs/crafting-your-repository/creating-an-internal-package), you can build an Internal Package from the beginning using [the Compiled Package strategy](#compiled-packages). On this page, we'll describe other strategies for creating Internal Packages and their tradeoffs, including [publishing the package to the npm registry](#publishable-packages) to create an External Package.

You can then import the package into your code like you're used to doing with an external package:

```tsx title="./apps/web/app/page.tsx"
import { Button } from '@repo/ui'; // [!code highlight]

export default function Page() {
  return <Button>Submit</Button>;
}
```

## Compilation Strategies

Depending on what you need from your library, you can choose one of three compilation strategies:

- [**Just-in-Time Packages**](#just-in-time-packages): Create minimal configuration for your package by allowing application bundlers to compile the package as it uses it.
- [**Compiled Packages**](#compiled-packages): With a moderate amount of configuration, compile your package using a build tool like `tsc` or a bundler.
- [**Publishable Packages**](#publishable-packages): Compile and prepare a package to publish to the npm registry. This approach requires the most configuration.

### Just-in-Time Packages

A Just-in-Time package is compiled by the application that uses it. This means you can use your TypeScript (or uncompiled JavaScript) files directly, requiring much less configuration than the other strategies on this page.

This strategy is most useful when:

- Your applications are built using a modern bundler like Turbopack, webpack, or Vite.
- You want to avoid configuration and setup steps.
- You're satisfied with your applications' build times, even when you can't hit cache for the package.

A `package.json` for a Just-in-Time package may look like this one:

```json title="./packages/ui/package.json"
{
  "name": "@repo/ui",
  "exports": {
    "./button": "./src/button.tsx", // [!code highlight]
    "./card": "./src/card.tsx" // [!code highlight]
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0", // [!code highlight]
    "check-types": "tsc --noEmit" // [!code highlight]
  }
}
```

There are a few important things to notice in this `package.json`:

- **Directly exporting TypeScript**: The `exports` field marks the entrypoints for the package and, in this case, you're **referencing TypeScript files directly**. This is possible because the bundler for the application will compile the code as it uses it in its build process.
- **No `build` script**: Because this package is exporting TypeScript, it doesn't need a build step for transpiling the package. This means you don't have to configure a build tool in this package to make it work in your Workspace.

#### Limitations and tradeoffs

- **Only applicable when consumers do transpiling**: This strategy can only be used when the package is going to be used in tooling that uses a bundler or natively understands TypeScript. The consumer's bundler is responsible for transpiling the TypeScript packages to JavaScript. If your builds or other usages of the package are not able to consume TypeScript, you will need to move to the [Compiled Packages](#compiled-packages) strategy.
- **No TypeScript `paths`**: A library that is being transpiled by its consumer cannot use the `compilerOptions.paths` configuration because TypeScript assumes that source code is being transpiled in the package where it is written. If you're using TypeScript 5.4 or later, we recommend [using Node.js subpath imports](https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/#auto-import-support-for-subpath-imports). To learn how, visit [our TypeScript page](/docs/guides/tools/typescript#use-nodejs-subpath-imports-instead-of-typescript-compiler-paths).
- **Turborepo cannot cache a build for a Just-in-Time Package**: Because the package doesn't have its own `build` step, it can't be cached by Turborepo. This tradeoff may make sense for you if you want to keep configuration to a minimum and are okay with the build times for your applications.
- **Errors in internal dependencies will be reported**: When directly exporting TypeScript, type-checking in a dependent package will fail if code in an internal dependency has TypeScript errors. You may find this confusing or problematic in some situations.

### Compiled Packages

A Compiled Package is a package that handles its own compilation using a build tool, like [`tsc` (the TypeScript compiler)](https://www.typescriptlang.org/docs/handbook/compiler-options.html#handbook-content).

```json title="./packages/ui/package.json"
{
  "name": "@repo/ui",
  "exports": {
    "./button": {
      "types": "./src/button.tsx", // [!code highlight]
      "default": "./dist/button.js" // [!code highlight]
    },
    "./card": {
      "types": "./src/card.tsx", // [!code highlight]
      "default": "./dist/card.js" // [!code highlight]
    }
  },
  "scripts": {
    "build": "tsc" // [!code highlight]
  }
}
```

Compiling your library produces compiled JavaScript outputs into a directory (`dist`, `build`, etc.) that you will use for the entrypoints for your package. The build outputs will be cached by Turborepo once they're added to the [`outputs` key of the task](/docs/reference/configuration#outputs), allowing you to have faster build times.

#### Limitations and tradeoffs

- **Using the TypeScript compiler**: The majority of Compiled Packages should use `tsc`. Since the package is highly likely to be consumed by an application that is using a bundler, the application's bundler will prepare the library package for distribution in the application's final bundles, handling polyfilling, downleveling, and other concerns. A bundler should only be used if you have a specific use case that requires it, like bundling static assets into your package's outputs.
- **More configuration**: Compiled Packages require deeper knowledge and configuration to create build outputs. There are [many configurations for the TypeScript compiler](https://www.typescriptlang.org/docs/handbook/compiler-options.html#compiler-options) that can be difficult to manage and understand, and further configuration to optimize for bundlers, like [the `sideEffects` key in `package.json`](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free). You can find some of our recommendations in [our dedicated TypeScript guide](/docs/guides/tools/typescript).

### Publishable packages

Publishing a package to the npm registry comes with the most strict requirements of the packaging strategies on this page. Because you don't know anything about how your package will be used by consumers who download the package from the registry, you may find it difficult due to the numerous configurations required for a robust package.

Additionally, the process of publishing a package to the npm registry requires specialized knowledge and tooling. We recommend [`changesets`](https://github.com/changesets/changesets) for managing versioning, changelogs, and the publishing process.

For a detailed guide, visit [our Publishing packages guide](/docs/guides/publishing-libraries).

import { File, Folder, Files } from '#components/files';
import { Callout } from '#components/callout';

## Package Graph

The Package Graph is the structure of your monorepo created by your package manager. When you install [Internal Packages](/docs/core-concepts/internal-packages) into each other, Turborepo will automatically identify those dependency relationships to build a foundational understanding of your Workspace.

This sets the groundwork for the Task Graph, where you'll define how **tasks** relate to each other.

## Task Graph

In `turbo.json`, you express how tasks relate to each other. You can think of these relationships as
dependencies between tasks, but we have a more formal name for them: the Task Graph.

<Callout type="good-to-know">
  You can generate a visualization of the task graph for your tasks using [the
  `--graph` flag](/docs/reference/run#--graph-file-type).
</Callout>

Turborepo uses a data structure called a [directed acyclic graph (DAG)](https://en.wikipedia.org/wiki/Directed_acyclic_graph) to
understand your repository and its tasks. A graph is made up of "nodes" and
"edges". In the Task Graph, the nodes are tasks and the edges are the
dependencies between tasks. A _directed_ graph indicates that the edges
connecting each node have a direction, so if Task A points to Task B, we can say
that Task A depends on Task B. The direction of the edge depends on which task
depends on which.

For example, let's say you have a monorepo with an application in `./apps/web` that
depends on two packages: `@repo/ui` and `@repo/utils`:

<Files>
  <Folder name="apps" defaultOpen>
    <Folder name="web" />
  </Folder>
  <Folder name="packages" defaultOpen>
    <Folder name="ui" />
    <Folder name="utils" />
  </Folder>
</Files>

You also have a `build` task that depends on `^build`:

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

Turborepo will build a task graph like this:

![Task graph visualization. The diagram has one node at the top named "apps/web" with two lines that connect to other nodes, "packages/ui" and "packages/utils" respectively.](/images/docs/simple-task-graph.png)

### Transit Nodes

A challenge when building a Task Graph is handling nested dependencies. For
example, let's say your monorepo has a `docs` app that depends on the `ui`
package, which depends on the `core` package:

<Files>
  <Folder name="apps" defaultOpen>
    <Folder name="docs" />
  </Folder>
  <Folder name="packages" defaultOpen>
    <Folder name="ui" />
    <Folder name="core" />
  </Folder>
</Files>

Let's assume the `docs` app and the `core` package each have a `build` task, but
the `ui` package does not. You also have a `turbo.json` that configures the
`build` task the same way as above with `"dependsOn": ["^build"]`. When you run
`turbo run build`, what would you expect to happen?

Turborepo will build this Task Graph:

![A Task Graph visualization with a Transit Node. The diagram has one node at the top named "apps/doc" with a line that connects to a "packages/ui" node. This node does not have a "build" task. The "packages/ui" node has another line to a "packages/core" node that does have a "build" task.](/images/docs/transitive-nodes.png)

You can think of this graph in a series of steps:

- The `docs` app only depends on `ui`.
- The `ui` package does **not** have a build script.
- The `ui` package's _dependencies_ have a `build` script, so the task graph knows to include those.

Turborepo calls the `ui` package a Transit Node in this scenario, because it
doesn't have its own `build` script. Since it doesn't have a `build` script,
Turborepo won't execute anything for it, but it's still part of the graph for
the purpose of including its own dependencies.

#### Transit Nodes as entry points

What if the `docs/` package didn't implement the `build` task? What would
you expect to happen in this case? Should the `ui` and `core` packages still
execute their build tasks? Should _anything_ happen here?

Turborepo's mental model is that all nodes in the Task Graph are the same. In other words,
Transit Nodes are included in the graph regardless of where they appear in the graph.
This model can have unexpected consequences. For example, let's say you've configured
your `build` task to depend on `^test`:

```json title="./turbo.json"
{
  "tasks": {
    "build": {
      "dependsOn": ["^test"]
    }
  }
}
```

Let's say your monorepo has many apps and many packages. All packages have
`test` tasks, but only one app has a `build` task. Turborepo's mental model
says that when you run `turbo run build`, even if an app doesn't implement `build`
the `test` task of all packages that are dependencies will show up in the graph.

import { PackageManagerTabs, Tab } from '#components/tabs';
import { Callout } from '#components/callout';

[Vite](https://vitejs.dev/) is a build tool that aims to provide a faster and leaner development experience for modern web projects.

## Quickstart

To get started with Vite in a Turborepo quickly, use [the `with-vite` example](https://github.com/vercel/turborepo/tree/main/examples/with-vite):

<PackageManagerTabs>

<Tab value="pnpm">

```bash title="Terminal"
pnpm dlx create-turbo@latest -e with-vite
```

</Tab>

<Tab value="yarn">

```bash title="Terminal"
yarn dlx create-turbo@latest -e with-vite
```

</Tab>

<Tab value="npm">

```bash title="Terminal"
npx create-turbo@latest -e with-vite
```

</Tab>

<Tab value="bun (Beta)">

```bash title="Terminal"
bunx create-turbo@latest -e with-vite
```

</Tab>
</PackageManagerTabs>

## Adding a Vite application to an existing repository

Use [`npm create vite`](https://vitejs.dev/guide/#scaffolding-your-first-vite-project) to set up a new Vite application in a package. From the root of your repository, run:

<PackageManagerTabs>

<Tab value="pnpm">

```bash title="Terminal"
pnpm create vite@latest apps/my-app
```

</Tab>

<Tab value="yarn">

```bash title="Terminal"
yarn create vite@latest apps/my-app
```

</Tab>

<Tab value="npm">

```bash title="Terminal"
npm create vite@latest apps/my-app
```

</Tab>

<Tab value="bun (Beta)">

```bash title="Terminal"
bun create vite@latest apps/my-app
```

</Tab>
</PackageManagerTabs>

## Integrating with your repository

To add [Internal Packages](/docs/core-concepts/internal-packages) to your new application, install them into the app with your package manager:

<PackageManagerTabs>

<Tab value="pnpm">

```diff title="./apps/my-app/package.json"
{
  "name": "my-app",
  "dependencies": {
+   "@repo/ui": "workspace:*"
  }
}
```

</Tab>

<Tab value="yarn">

```diff title="./apps/my-app/package.json"
{
  "name": "my-app",
  "dependencies": {
+   "@repo/ui": "*"
  }
}
```

</Tab>

<Tab value="npm">

```diff title="./apps/my-app/package.json"
{
 "name": "my-app",
  "dependencies": {
+   "@repo/ui": "*"
  }
}
```

</Tab>

<Tab value="bun (Beta)">

```diff title="./apps/my-app/package.json"
{
 "name": "my-app",
  "dependencies": {
+   "@repo/ui": "workspace:*"
  }
}
```

</Tab>
</PackageManagerTabs>

Make sure to run your package manager's install command. You also may need to update `scripts` in `package.json` to fit your use case in your repository.

### Customizing tasks

By default, the new application will use the tasks defined in the root `turbo.json`. If you'd like to configure tasks differently for the new application, use [Package Configurations](/docs/reference/package-configurations).

import { PackageManagerTabs, Tab } from '#components/tabs';
import { Callout } from '#components/callout';

Framework bindings in a [Library Package](/docs/core-concepts/package-types#library-packages) integrate your library's code more deeply with a framework by leveraging APIs from the framework directly in the library.

To do this, use the `peerDependencies` field in `package.json` of the library, which makes the framework APIs available in your library without installing it directly in the package.

<Callout type="good-to-know">
  On this page, we'll be using Next.js for examples, but the concepts below
  apply to any framework or other dependency.
</Callout>

## Example

Add a `peerDependency` to your library for the dependency that you intend to create bindings for.

```json title="./packages/ui/package.json"
{
  "name": "@repo/ui",
  "peerDependencies": {
    "next": "*"
  }
}
```

<Callout type="good-to-know">
  In the example above, the `peerDependency` for `next` accepts any version. You
  may want to specify a range (for example, `">=15"`) according to your needs.
  Additionally, for older package managers, you may need to instruct your
  package manager to install peer dependencies with configuration, or add the
  dependency to `devDependencies` as a workaround.
</Callout>

This will make the dependency available in your library, allowing you to write code like below. Note the `className` prop, which sets a default styling for this component in the monorepo and can be overridden in the `props` object.

```tsx title="./packages/ui/src/link.tsx"
import Link from 'next/link';
import type { ComponentProps } from 'react';

type CustomLinkProps = ComponentProps<typeof Link>;

export function CustomLink({ children, ...props }: CustomLinkProps) {
  return (
    <Link className="text-underline hover:text-green-400" {...props}>
      {children}
    </Link>
  );
}
```

The version of `next` that will be resolved for the package will come from the consumers of the library. For example, if Next.js 15 is installed in your applications, the TypeScript types and APIs for `next` will also be Next.js 15.

## Splitting framework bindings using entrypoints

Using export paths to split a package into framework-specific entrypoints is the simplest way to add bindings to a library that aims to support multiple frameworks. By splitting entrypoints, bundlers have an easier time understanding the framework you intend to target and you're less likely to see strange bundling errors.

The example below shows a library with two entrypoints, each for a different type of link component. These abstractions likely contain your own styles, APIs, and other adjustments on top of the element they're wrapping.

- `./link`: An `<a>` HTML tag with some default styles from your design system
- `./next-js/link`: A customized version of [the Next.js `Link` component](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#link-component) with props that are preset to your organization's preferences
- `./svelte/link`: A customized version of an [`a` tag for Svelte](https://svelte.dev/docs/kit/link-options) with presets.

```json title="./packages/ui/package.json"
{
  "exports": {
    "./link": "./dist/link.js",
    "./next-js/link": "./dist/next-js/link.js"
  },
  "peerDependencies": {
    "next": "*"
  }
}
```

<Callout type="good-to-know">
  In the example above, the `peerDependency` for `next` accepts any version. You
  may want to specify a range (for example, `">=15"`) according to your needs.
</Callout>

This concept can be applied to any number of frameworks or other dependencies that you'd like to provide bindings for.

import { PackageManagerTabs, Tab } from '#components/tabs';
import { Steps, Step } from '#components/steps';
import { Callout } from '#components/callout';

The following example shows how to use Turborepo with [GitHub Actions](https://github.com/features/actions).

For a given root `package.json`:

```json title="./package.json"
{
  "name": "my-turborepo",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

And a `turbo.json`:

```json title="./turbo.json"
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**", "other-output-dirs/**"],
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

Create a file called `.github/workflows/ci.yml` in your repository with the following contents:

<PackageManagerTabs>
  <Tab value="pnpm">
    ```yaml title=".github/workflows/ci.yml"
    name: CI

    on:
      push:
        branches: ["main"]
      pull_request:
        types: [opened, synchronize]

    jobs:
      build:
        name: Build and Test
        timeout-minutes: 15
        runs-on: ubuntu-latest
        # To use Remote Caching, uncomment the next lines and follow the steps below.
        # env:
        #  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
        #  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

        steps:
          - name: Check out code
            uses: actions/checkout@v4
            with:
              fetch-depth: 2

          - uses: pnpm/action-setup@v3
            with:
              version: 8

          - name: Setup Node.js environment
            uses: actions/setup-node@v4
            with:
              node-version: 20
              cache: 'pnpm'

          - name: Install dependencies
            run: pnpm install

          - name: Build
            run: pnpm build

          - name: Test
            run: pnpm test
    ```

  </Tab>

  <Tab value="yarn">

    ```yaml title=".github/workflows/ci.yml"
    name: CI

    on:
      push:
        branches: ["main"]
      pull_request:
        types: [opened, synchronize]

    jobs:
      build:
        name: Build and Test
        timeout-minutes: 15
        runs-on: ubuntu-latest
        # To use Remote Caching, uncomment the next lines and follow the steps below.
        # env:
        #  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
        #  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

        steps:
          - name: Check out code
            uses: actions/checkout@v4
            with:
              fetch-depth: 2

          - name: Setup Node.js environment
            uses: actions/setup-node@v4
            with:
              node-version: 20
              cache: 'yarn'

          - name: Install dependencies
            run: yarn

          - name: Build
            run: yarn build

          - name: Test
            run: yarn test
    ```

  </Tab>
  <Tab value="npm">

    ```yaml title=".github/workflows/ci.yml"
    name: CI

    on:
      push:
        branches: ["main"]
      pull_request:
        types: [opened, synchronize]

    jobs:
      build:
        name: Build and Test
        timeout-minutes: 15
        runs-on: ubuntu-latest
        # To use Remote Caching, uncomment the next lines and follow the steps below.
        # env:
        #  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
        #  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
        #  TURBO_REMOTE_ONLY: true

        steps:
          - name: Check out code
            uses: actions/checkout@v4
            with:
              fetch-depth: 2

          - name: Setup Node.js environment
            uses: actions/setup-node@v4
            with:
              node-version: 20
              cache: 'npm'

          - name: Install dependencies
            run: npm install

          - name: Build
            run: npm run build

          - name: Test
            run: npm run test
    ```

  </Tab>

  <Tab value="bun (Beta)">
    ```yaml title=".github/workflows/ci.yml"
    name: CI

    on:
      push:
        branches: ["main"]
      pull_request:
        types: [opened, synchronize]

    jobs:
      build:
        name: Build and Test
        timeout-minutes: 15
        runs-on: ubuntu-latest
        # To use Remote Caching, uncomment the next lines and follow the steps below.
        # env:
        #  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
        #  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

        steps:
          - name: Check out code
            uses: actions/checkout@v4
            with:
              fetch-depth: 2

          - uses: oven-sh/setup-bun@v2

          - name: Setup Node.js environment
            uses: actions/setup-node@v4
            with:
              node-version: 20

          - name: Install dependencies
            run: bun install

          - name: Build
            run: bun run build

          - name: Test
            run: bun run test
    ```

  </Tab>

</PackageManagerTabs>

## Remote Caching with Vercel Remote Cache

To use Remote Caching with GitHub Actions, add the following environment variables to your GitHub Actions workflow
to make them available to your `turbo` commands.

- `TURBO_TOKEN` - The Bearer token to access the Remote Cache
- `TURBO_TEAM` - The account to which the repository belongs

To use Remote Caching, retrieve the team and token for the Remote Cache for your provider. In this example, we'll use [Vercel Remote Cache](https://vercel.com/docs/monorepos/remote-caching).

<Steps>
<Step>
Create a Scoped Access Token to your account in the [Vercel Dashboard](https://vercel.com/account/tokens)

![Vercel Access Tokens](/images/docs/vercel-create-token.png)

Copy the value to a safe place. You'll need it in a moment.

</Step>
<Step>
Go to your GitHub repository settings and click on the **Secrets** and then **Actions** tab. Create a new secret called `TURBO_TOKEN` and enter the value of your Scoped Access Token.

![GitHub Secrets](/images/docs/github-actions-secrets.png)
![GitHub Secrets Create](/images/docs/github-actions-create-secret.png)

</Step>

<Step>
Create a new repository variable (click the **Variables** tab) called `TURBO_TEAM` and enter [your Team URL](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fsettings&title=Find+Team+URL).

<Callout type="good-to-know">
  Using a repository variable rather than a secret will keep GitHub Actions from
  censoring your team name in log output.
</Callout>

![GitHub Repository Variables](/images/docs/vercel-team-repo-var.png)

</Step>
<Step>
At the top of your GitHub Actions workflow, provide the following environment variables to jobs that use `turbo`:

```yaml title=".github/workflows/ci.yml"
# ...

jobs:
  build:
    name: Build and Test
    timeout-minutes: 15
    runs-on: ubuntu-latest
    # To use Turborepo Remote Caching, set the following environment variables for the job.
    env: # [!code highlight]
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }} # [!code highlight]
      TURBO_TEAM: ${{ vars.TURBO_TEAM }} # [!code highlight]

    steps:
      - name: Check out code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
    # ...
```

</Step>
</Steps>

## Remote Caching with GitHub actions/cache

The following steps show how you could use [actions/cache](https://github.com/actions/cache) to cache your monorepo artifacts on GitHub.

<Steps>
<Step>
Supply a package.json script that will run tasks using Turborepo.

Example `package.json` with a `build` script:

```json title="./package.json"
{
  "name": "my-turborepo",
  "scripts": {
    "build": "turbo run build"
  },
  "devDependencies": {
    "turbo": "1.2.5"
  }
}
```

</Step>
<Step>
Configure your GitHub pipeline with a step which uses the `actions/cache@v4` action before the build steps of your CI file.

- Make sure that the `path` attribute set within the `actions/cache` action matches the output location above. In the example below, `path` was set to `.turbo`.
- State the cache key for the current run under the `key` attribute. In the example below, we used a combination of the runner os and GitHub sha as the cache key.
- State the desired cache prefix pattern under the `restore-keys` attribute. Make sure this pattern will remain valid for future ci runs. In the example below, we used the `${{ runner.os }}-turbo-` as the cache key prefix pattern to search against. This allows us to hit the cache on any subsequent ci runs despite `github.sha` changing.

Example `ci` yaml with `.turbo` as chosen cache folder:

```yaml title=".github/workflows/ci.yml"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Check out code
        uses: actions/checkout@v4

      - name: Cache turbo build setup # [!code highlight]
        uses: actions/cache@v4 # [!code highlight]
        with: # [!code highlight]
          path: .turbo # [!code highlight]
          key: ${{ runner.os }}-turbo-${{ github.sha }} # [!code highlight]
          restore-keys: | # [!code highlight]
            ${{ runner.os }}-turbo-

      - name: Setup Node.js environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
```

</Step>
</Steps>

import { PackageManagerTabs, Tabs, Tab } from '#components/tabs';
import { Callout } from '#components/callout';
import { Files, Folder, File } from '#components/files';
import { CreateTurboCallout } from './create-turbo-callout.tsx';

ESLint is a static analysis tool for quickly finding and fixing problems in your JavaScript code.

<CreateTurboCallout />

In this guide, we'll cover:

- [ESLint v9 with Flat Configuration](#eslint-v9-flat-configs)
- [ESLint v8 with legacy configuration](#eslint-v8-legacy)
- [How to set up a `lint` task (applies to both versions)](#setting-up-a-lint-task)

We will share configurations across the monorepo's Workspace, ensuring configuration is consistent across packages and composable to maintain high cache hit ratios.

## ESLint v9 (Flat Configs)

Using ESLint v9's Flat Configs, we will end up with a file structure like this:

<Files>
  <Folder name="apps" defaultOpen>
    <Folder name="docs" defaultOpen>
     <File name="package.json" />
     <File name="eslint.config.js" green />
    </Folder>

    <Folder name="web" defaultOpen>
     <File name="package.json" />
     <File name="eslint.config.js" green />
    </Folder>

  </Folder>

  <Folder name="packages" defaultOpen>
    <Folder name="eslint-config" defaultOpen>
     <File name="base.js" green />
     <File name="next.js" green />
     <File name="react-internal.js" green />
     <File name="package.json" />
    </Folder>

    <Folder name="ui" defaultOpen>
     <File name="eslint.config.js" green />
     <File name="package.json" />
    </Folder>

  </Folder>
</Files>

This structure includes:

- A package called `@repo/eslint-config` in `./packages/eslint-config` that holds all ESLint configuration
- Two applications, each with their own `eslint.config.js`
- A `ui` package that also has its own `eslint.config.js`

### About the configuration package

The `@repo/eslint-config` package has three configuration files, `base.js`, `next.js`, and `react-internal.js`. They are [exported from `package.json`](https://github.com/vercel/turborepo/blob/main/examples/basic/packages/eslint-config/package.json#L6) so that they can be used by other packages, according to needs. Examples of the configurations can be found [in the Turborepo GitHub repository](https://github.com/vercel/turborepo/tree/main/examples/basic/packages/eslint-config) and are available in `npx create-turbo@latest`.

Notably, the `next.js` and `react-internal.js` configurations use the `base.js` configuration for consistency, extending it with more configuration for their respective requirements. Additionally, notice that [the `package.json` for `eslint-config`](https://github.com/vercel/turborepo/blob/main/examples/basic/packages/eslint-config/package.json) has all of the ESLint dependencies for the repository. This is useful, since it means we don't need to re-specify the dependencies in the packages that import `@repo/eslint-config`.

### Using the configuration package

In our `web` app, we first need to add `@repo/eslint-config` as a dependency.

<PackageManagerTabs>

  <Tab value="pnpm">
```jsonc title="./apps/web/package.json"
{
  "devDependencies": {
    "@repo/eslint-config": "workspace:*"
  }
}
```
  </Tab>

  <Tab value="yarn">
```jsonc title="./apps/web/package.json"
{
  "devDependencies": {
    "@repo/eslint-config": "*"
  }
}
```
  </Tab>

  <Tab value="npm">
```jsonc title="./apps/web/package.json"
{
  "devDependencies": {
    "@repo/eslint-config": "*"
  }
}
```
  </Tab>

  <Tab value="bun (Beta)">
```jsonc title="./apps/web/package.json"
{
  "devDependencies": {
    "@repo/eslint-config": "workspace:*"
  }
}
```
  </Tab>
</PackageManagerTabs>

We can then import the configuration like this:

```js title="./apps/web/eslint.config.js"
import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
export default nextJsConfig;
```

Additionally, you can add configuration specific to the package like this:

```js title="./apps/web/eslint.config.js"
import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  // Other configurations
];
```

## ESLint v8 (Legacy)

<Callout type="warn">
  ESLint v8 is end-of-life as of October 5, 2024. We encourage you to upgrade to
  ESLint v9 or later. This documentation is here to help with existing projects
  that have not yet upgraded.
</Callout>

Using legacy configuration from ESLint v8 and lower, we will end up with a file structure like this:

<Files>
  <Folder name="apps" defaultOpen>
    <Folder name="docs" defaultOpen>
     <File name="package.json" />
     <File name=".eslintrc.js" green />
    </Folder>

    <Folder name="web" defaultOpen>
     <File name="package.json" />
     <File name=".eslintrc.js" green />
    </Folder>

  </Folder>

  <Folder name="packages" defaultOpen>
    <Folder name="eslint-config" defaultOpen>
     <File name="base.js" green />
     <File name="next.js" green />
     <File name="react-internal.js" green />
     <File name="package.json" />
    </Folder>

    <Folder name="ui" defaultOpen>
     <File name=".eslintrc.js" green />
     <File name="package.json" />
    </Folder>

  </Folder>
</Files>

There's a package called `@repo/eslint-config`, and two applications, each with their own `.eslintrc.js`.

### The `@repo/eslint-config` package

The `@repo/eslint-config` file contains two files, `next.js`, and `library.js`. These are two different ESLint configurations, which we can use in different packages, depending on our needs.

A configuration for Next.js may look like this:

```js title="./packages/eslint-config/next.js"
/* Custom ESLint configuration for use with Next.js apps. */
module.exports = {
  extends: [
    'eslint-config-turbo',
    'eslint-config-next',
    // ...your other ESLint configurations
  ].map(require.resolve),
  // ...your other configuration
};
```

The `package.json` looks like this:

```json title="./packages/eslint-config/package.json"
{
  "name": "@repo/eslint-config",
  "version": "0.0.0",
  "private": true,
  "devDependencies": {
    "eslint": "^8",
    "eslint-config-turbo": "latest",
    "eslint-config-next": "latest"
  }
}
```

Note that the ESLint dependencies are all listed here. This is useful, since it means we don't need to re-specify the dependencies inside the apps which import `@repo/eslint-config`.

### How to use the `@repo/eslint-config` package

In our `web` app, we first need to add `@repo/eslint-config` as a dependency.

<PackageManagerTabs>

  <Tab value="pnpm">
```jsonc title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/eslint-config": "workspace:*"
  }
}
```
  </Tab>
  <Tab value="yarn">
```jsonc title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/eslint-config": "*"
  }
}
```
  </Tab>

  <Tab value="npm">
```jsonc title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/eslint-config": "*"
  }
}
```
  </Tab>

  <Tab value="bun (Beta)">
```jsonc title="./apps/web/package.json"
{
  "dependencies": {
    "@repo/eslint-config": "workspace:*"
  }
}
```
  </Tab>
</PackageManagerTabs>

We can then import the config like this:

```js title="./apps/web/.eslintrc.js"
module.exports = {
  root: true,
  extends: ['@repo/eslint-config/next.js'],
};
```

By adding `@repo/eslint-config/next.js` to our `extends` array, we're telling ESLint to look for a package called `@repo/eslint-config`, and reference the file `next.js`.

## Setting up a `lint` task

The `package.json` for each package where you'd like to run ESLint should look like this:

```json title="./packages/*/package.json"
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

With your scripts prepared, you can then create your Turborepo task:

```bash title="./turbo.json"
{
  "tasks": {
    "lint": {}
  }
}
```

You can now run `turbo lint` with [global `turbo`](/docs/getting-started/installation#global-installation) or create a script in your root `package.json`:

```json title="./package.json"
{
  "scripts": {
    "lint": "turbo run lint"
  }
}
```

import { Callout } from '#components/callout';
import { File, Folder, Files } from '#components/files';
import { PackageManagerTabs, Tabs, Tab } from '#components/tabs';
import { LinkToDocumentation } from '#components/link-to-documentation';

TypeScript is an excellent tool in monorepos, allowing teams to safely add types to their JavaScript code. While there is some complexity to getting set up, this guide will walk you through the important parts of a TypeScript setup for most use cases.

- [Sharing TypeScript configuration](#sharing-tsconfigjson)
- [Building a TypeScript package](#building-a-typescript-package)
- [Making type checking faster across your workspace](/docs/guides/tools/typescript#linting-your-codebase)

<Callout type="info">
  This guide assumes you are using a recent version of TypeScript and uses some
  features that are only available in those versions. You may need to adjust the
  guidance on this page if you are unable to features from those versions.
</Callout>

## Sharing `tsconfig.json`

You want to build consistency into your TypeScript configurations so that your entire repo can use great defaults and your fellow developers can know what to expect when writing code in the Workspace.

TypeScript's `tsconfig.json` sets the configuration for the TypeScript compiler and features an [`extends` key](https://www.typescriptlang.org/tsconfig#extends) that you'll use to share configuration across your workspace.

This guide will use [`create-turbo`](/docs/reference/create-turbo) as an example.

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

### Use a base `tsconfig` file

Inside `packages/typescript-config`, you have a few `json` files which represent different ways you might want to configure TypeScript in various packages. The `base.json` file is extended by every other `tsconfig.json` in the workspace and looks like this:

```json title="./packages/typescript-config/base.json"
{
  "compilerOptions": {
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "es2022",
    "allowJs": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "module": "NodeNext"
  }
}
```

<LinkToDocumentation href="https://www.typescriptlang.org/tsconfig">
  `tsconfig` options reference
</LinkToDocumentation>

### Creating the rest of the package

The other `tsconfig` files in this package use the `extends` key to start with the base configuration and customize for specific types of projects, like for Next.js (`nextjs.json`) and a React library (`react-library.json`).

Inside `package.json`, name the package so it can be referenced in the rest of the Workspace:

```json title="packages/typescript-config/package.json"
{
  "name": "@repo/typescript-config"
}
```

## Building a TypeScript package

### Using the configuration package

First, install the `@repo/typescript-config` package into your package:

<PackageManagerTabs>

<Tab value="pnpm">
```json title="./apps/web/package.json"
{
  "devDependencies": {
     "@repo/typescript-config": "workspace:*",
     "typescript": "latest",
  }
}
```
</Tab>

<Tab value="yarn">
```json title="./apps/web/package.json"
{
  "devDependencies": {
     "@repo/typescript-config": "*",
     "typescript": "latest",
  }
}
```
</Tab>

<Tab value="npm">
```json title="./apps/web/package.json"
{
  "devDependencies": {
     "@repo/typescript-config": "*",
     "typescript": "latest",
  }
}
```
</Tab>

<Tab value="bun (Beta)">
```json title="./apps/web/package.json"
{
  "devDependencies": {
     "@repo/typescript-config": "workspace:*",
     "typescript": "latest",
  }
}
```
</Tab>
</PackageManagerTabs>

Then, extend the `tsconfig.json` for the package from the `@repo/typescript-config` package. In this example, the `web` package is a Next.js application:

```json title="./apps/web/tsconfig.json"
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Creating entrypoints to the package

First, make sure your code gets compiled with `tsc` so there will be a `dist` directory. You'll need a `build` script as well as a `dev` script:

```json title="./packages/ui/package.json"
{
  "scripts": {
    "dev": "tsc --watch",
    "build": "tsc"
  }
}
```

Then, set up the entrypoints for your package in `package.json` so that other packages can use the compiled code:

```json title="./packages/ui/package.json"
{
  "exports": {
    "./*": {
      "types": "./src/*.ts",
      "default": "./dist/*.js"
    }
  }
}
```

Setting up `exports` this way has several advantages:

- Using the `types` field allows `tsserver` to use the code in `src` as the source of truth for your code's types. Your editor will always be up-to-date with the latest interfaces from your code.
- You can quickly add new entrypoints to your package without creating [dangerous barrel files](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js#what's-the-problem-with-barrel-files).
- You'll receive auto-importing suggestions for your imports across package boundaries in your editor.

<Callout type="warn">
  If you're publishing the package, you cannot use references to source code in
  `types` since only the compiled code will be published to npm. You'll need to
  generate and reference declaration files and source maps.
</Callout>

## Linting your codebase

To use TypeScript as a linter, you can check the types across your workspace **fast** using Turborepo's caching and parallelization.

First, add a `check-types` script to any package that you want to check the types for:

```json title="./apps/web/package.json"
{
  "scripts": {
    "check-types": "tsc --noEmit"
  }
}
```

Then, create a `check-types` task in `turbo.json`. From the [Configuring tasks guide](/docs/crafting-your-repository/configuring-tasks#dependent-tasks-that-can-be-run-in-parallel), we can make the task run in parallel while respecting source code changes from other packages using a [Transit Node](/docs/core-concepts/package-and-task-graph#transit-nodes):

```json title="./turbo.json"
{
  "tasks": {
    "topo": {
      "dependsOn": ["^topo"]
    },
    "check-types": {
      "dependsOn": ["topo"]
    }
  }
}
```

Then, run your task using `turbo check-types`.

## Best practices

### Use `tsc` to compile your packages

For [Internal Packages](/docs/core-concepts/internal-packages), we recommend that you use `tsc` to compile your TypeScript libraries whenever possible. While you can use a bundler, it's not necessary and adds extra complexity to your build process. Additionally, bundling a library can mangle the code before it makes it to your applications' bundlers, causing hard to debug issues.

### Enable go-to-definition across package boundaries

"Go-to-definition" is an editor feature for quickly navigating to the original declaration or definition of a symbol (like a variable or function) with a click or hotkey. Once TypeScript is configured correctly, you can navigate across [Internal Packages](/docs/core-concepts/internal-packages) with ease.

#### Just-in-Time Packages

Exports from [Just-in-Time Packages](/docs/core-concepts/internal-packages#just-in-time-packages) will automatically bring you to the original TypeScript source code. Go-to-definition will work as expected.

#### Compiled Packages

Exports from [Compiled Packages](/docs/core-concepts/internal-packages#compiled-packages) require the use of [`declaration`](https://www.typescriptlang.org/tsconfig/#declaration) and [`declarationMap`](https://www.typescriptlang.org/tsconfig/#declarationMap) configurations for go-to-definition to work. After you've enabled these two configurations for the package, compile the package with `tsc`, and open the output directory to find declaration files and source maps.

<Files>
  <Folder defaultOpen name="packages">
    <Folder defaultOpen name="ui">
      <Folder defaultOpen name="dist">
        <File name="button.js" />
        <File name="button.d.ts" green />
        <File name="button.d.ts.map" green />
      </Folder>
    </Folder>
  </Folder>
</Files>

With these two files in place, your editor will now navigate to the original source code.

### Use Node.js subpath imports instead of TypeScript compiler `paths`

It's possible to create absolute imports in your packages using [the TypeScript compiler's `paths` option](https://www.typescriptlang.org/tsconfig#paths), but these paths can cause failed compilation when using [Just-in-Time Packages](https://turborepo.com/docs/core-concepts/internal-packages#just-in-time-packages). [As of TypeScript 5.4](https://devblogs.microsoft.com/typescript/announcing-typescript-5-4/#auto-import-support-for-subpath-imports), you can use [Node.js subpath imports](https://nodejs.org/api/packages.html#imports) instead for a more robust solution.

#### Just-in-Time Packages

In [Just-in-Time packages](https://turborepo.com/docs/core-concepts/internal-packages#just-in-time-packages), `imports` must target the source code in the package, since build outputs like `dist` won't be created.

<Tabs storageKey="ts-imports-jit" items={["package.json", "Source code"]}>
<Tab value="package.json">

```json title="./packages/ui/package.json"
{
  "imports": {
    "#*": "./src/*"
  }
}
```

</Tab>
<Tab value="Source code">
```tsx title="./packages/ui/button.tsx"
import { MY_STRING } from "#utils.ts" // Uses .ts extension // [!code highlight]

export const Button = () => {
return (
<button>{MY_STRING}</button>
)
}

````
</Tab>

</Tabs>

#### Compiled Packages

In [Compiled packages](https://turborepo.com/docs/core-concepts/internal-packages#compiled-packages), `imports` target the built outputs for the package.

<Tabs storageKey="ts-imports-compiled" items={["package.json", "Source code"]}>
  <Tab value="package.json">
```json title="./packages/ui/package.json"
{
  "imports": {
    "#*": "./dist/*"
  }
}
````

</Tab>

  <Tab value="Source code">

```tsx title="./packages/ui/button.tsx"
import { MY_STRING } from '#utils.js'; // Uses .js extension // [!code highlight]

export const Button = () => {
  return <button>{MY_STRING}</button>;
};
```

</Tab>

</Tabs>

### You likely don't need a `tsconfig.json` file in the root of your project

As mentioned in the [Structuring your repository guide](/docs/crafting-your-repository/structuring-a-repository#anatomy-of-a-package), you want to treat each package in your tooling as its own unit. This means each package should have its own `tsconfig.json` to use instead of referencing a `tsconfig.json` in the root of your project. Following this practice will make it easier for Turborepo to cache your type checking tasks, simplifying your configuration.

The only case in which you may want to have a `tsconfig.json` in the Workspace root is to set configuration for TypeScript files that are not in packages. For example, if you have a script written with TypeScript that you need to run from the root, you may need a `tsconfig.json` for that file.

However, this practice is also discouraged since any changes in the Workspace root will cause all tasks to miss cache. Instead, move those scripts to a different directory in the repository.

### You likely don't need TypeScript Project References

We don't recommend using TypeScript Project References as they introduce both another point of configuration as well as another caching layer to your workspace. Both of these can cause problems in your repository with little benefit, so we suggest avoiding them when using Turborepo.

## Limitations

### Your editor won't use a package's TypeScript version

`tsserver` is not able to use different TypeScript versions for different packages in your code editor. Instead, it will discover a specific version and use that everywhere.

This can result in differences between the linting errors that show in your editor and when you run `tsc` scripts to check types. If this is an issue for you, consider [keeping the TypeScript dependency on the same version](/docs/crafting-your-repository/managing-dependencies#keeping-dependencies-on-the-same-version).
