# Extension development

The project can be developed on Linux, Mac, or Windows. Official CI builds are
performed on Linux, and some configuration and tooling may be optimized for that
platform. Special cases for setup will be noted in this document.

## Dependencies

1. [Install NodeJS][nodejs] for your platform.

    - `node` >= 18.x and <= 22.x
    - `npm` >= 10.x

    To check your current versions, run:

    ```console
    $ node -v && npm -v
    v20.17.0
    10.8.x
    ```

2. Install [Yarn 1 (Classic)][yarn] globally.

    ```console
    npm install -g yarn
    ```

    - `yarn` >= 1.22.x

    To check your current version, run:

    ```console
    $ yarn -v
    1.22.22
    ```

3. Install [Visual Studio Code][vscode]

### Platform dependencies for testing

Depending on your platform, you may need to install additional dependencies to
run the tests.

#### Debian/Ubuntu Linux (include WSL2)

1. Install [xvfb][xvfb] for your platform.

    ```console
    sudo apt update
    sudo apt install -y libxkbfile-dev pkg-config libsecret-1-dev libkrb5-dev libxss1 dbus xvfb libgtk-3-0 libgbm1
    ```

## Building and running

1. Authenticate yarn with Azure Artifacts.
   The easiest way to generate the token is to use the `vsts-npm-auth` tool on Windows. See details [CFS docs] This assumes you have the repo checked out and the `vsts-npm-auth` tool installed. If you don't have it installed, you can install it using the following command:

    ```console
    npm install -g vsts-npm-auth
    ```

    Then, run the following command to generate the token:

    ```powershell
    # In repository root
    vsts-npm-auth -config .npmrc -f
    ```

    If you actually develop on WSL, you'll need to copy your _user_ `.npmrc` file to the WSL filesystem. You can do this by running the following command in WSL:

    ```bash
    # In WSL
    cp /mnt/c/Users/<your-username>/.npmrc ~/.npmrc
    ```

2. Install application dependencies:

    ```console
    yarn install
    ```

3. Compile the source code, recompile on changes:

    ```console
    yarn watch
    ```

4. Launch the extension:

    - Click the "Run and Debug" icon in the Activity Bar on the side of VS Code.
    - Choose either "Launch Extension" or "Launch Extension (With Other Extensions Disabled)".
    - Click the green "Start Debugging" button.

## Debugging

Using either Launch configuration from above, you can set breakpoints in VS Code
for an interactive debugging session.

React-based views (like Connection Dialog or Results Viewer) are executed within
a separate Chromium process. You can use the Chromium DevTools to debug these
views. Open the DevTools by running the command `Debug: Open Webview Developer
Tools` from the Command Palette (Ctrl+Shift+P). On the `Sources` tab, you can
set breakpoints and inspect the React component tree.

### Remote debugging PgToolsService

To configure remote debugging of the PgToolsService during vscode extension development:

1. Checkout the [pgtoolsservice repo][pgts].
2. In a virtual environment (or your default system Python environment), install that project in development mode:

    ```console
    pip install -e .[dev]
    ```

3. Set two environment variables in one or both of the Launch Configuration sections described above:

    ```json
    "env": {
        "PGTOOLSSERVICE_OVERRIDE": "<path to root dir of pgtoolsservice repo>",
        "PYTHON_SERVICE_EXECUTABLE": "<path to python executable with PGTS dependencies installed>"
    }
    ```

    With these variables set, the extension will load the PgToolsService from
    the specified path, and use the specified Python executable to run it. VS
    Code will show a message indicating the path where it loaded the service.
    Within PgToolsService, you can set breakpoints to be triggered.

    You can use two methods to attach a debug session to the PgToolsService process:

    1. Use the "Python: Attach to Process" from the Debug menu: When selecting the
    process, filter for `ossdb` which should only list the process loaded by the
    extension.
    2. Use "Python Debugger: Attach": This will attach to the process remotely,
    via a port specified in the `launch.json` file (default: 50001)

    Option 2 is required for MacOS.

## Recording messages between the extension and PgToolsService

To record messages between the extension and PgToolsService, set the following environment variable:

```console
export PGTS_RECORD_MESSAGES_TO_FILE=/path/to/file.json
```

This will record the messages from a single session to the specified file. The file will be overwritten each time the extension is launched. The session will also be automatically saved every 30 seconds.

## Releasing

This extension uses a conventional trunk-based release model.

### Main Branches

- `main`: Active development branch. All feature work and improvements go here.
- `release/X.Y`: Stable branch for each minor or major release (e.g., `release/1.2`). Used for final QA and tagged releases.

### Supporting Branches

- `user/{initials}/short-description`: Most development branches follow this format for clarity and ownership.
- `feature/short-description`: Used for collaborative or longer-lived work.
- `hotfix/short-description`: Used only to patch a release (i.e., branched from and merged back into `release/X.Y`, not `main`).

All changes ultimately flow back into `main`.

### Release Testing & Signoff

**Automated**:

- Unit and integration tests
- Linting and type checks
- Bundle/build validation (webpack, etc.)

**Manual**:

- Install via .vsix
- Connect to local + remote + Azure Postgres
- Run commands in the command palette
- Run typical DB workflows (CRUD, schema navigation)
- Validate settings, command palette, and UI behavior

**Signoff Checklist:**

- All CI checks pass
- Manual test scenarios verified
- Changelog updated
- Version bump committed + tagged
- VSIX built + tested
- Published to VSCode Marketplace
- GitHub Release created, with artifacts

### Hotfixes

Hotfixes are branched from `main` as `hotfix/{short-description}`. They should
be scoped to a single issue or bug, and are used to address critical issues in a
release branch.

After a PR to merge the fix into `main` is completed, the specific commits
should be cherry-picked into the latest `release/X.Y` branch. A new tag with the
patch version incremented should be created and pushed to produce a new release
including
the hotfix commit.

### Feature Work

- Developers create `user/<initials>/...` or `feature/...` branches from `main`.
- Feature flags (or User Settings, as appropriate) should be used to isolate in-progress work.

All changes must go through PR review and CI validation.

### Versioning & Releases

Follows SemVer: `MAJOR.MINOR.PATCH`. Releases are tagged (e.g., `v1.2.0`) and created via GitHub.

Artifacts:

- .vsix package via vsce
- GitHub Release
- Marketplace publish

### Pre-releases

Dev or pre-releases are lightweight builds intended for ad-hoc testing of
features before a formal `release/X.Y` branch exists. They are built and
published from `main` (or a feature branch if needed) and tagged to enable
reproducible .vsix builds.

They should not be published to the Marketplace, but are shared internally or tested locally.

**Use Cases:**

- Internal validation of in-progress features
- Pre-release feedback from partners or team members
- Validation of bundled assets before final release planning

**Tagging Strategy:**

Use SemVer-compatible pre-release tags that anticipate the next release, e.g.:

- v1.3.0-dev.1
- v1.3.0-dev.2

```console
git tag v1.3.0-dev.1
git push origin v1.3.0-dev.1
```

[nodejs]: https://nodejs.org/en/download/
[yarn]: https://classic.yarnpkg.com/en/docs/install/
[xvfb]: https://www.x.org/releases/X11R7.6/doc/man/man1/Xvfb.1.xhtml
[vscode]: https://code.visualstudio.com/download
[pgts]: https://github.com/microsoft/pgtoolsservice/blob/main/DEVELOPING.md
[CFS docs]: https://dev.azure.com/msdata/Database%20Systems/_artifacts/feed/pgtoolsservice_PublicPackages/connect
