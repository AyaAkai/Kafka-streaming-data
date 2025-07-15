# Usage

> [!IMPORTANT] This user guide is in development and may not reflect the latest features and functionality of the extension.

## Making a Connection

### Connecting via Connection Strings

The following are the types of connection strings supported.

-   [Standard Postgres Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING-URIS) patterns

    Example:

    ```bash
    postgres://{user}:{password}@{hostname}:{port}/{database-name}
    ```

-   Semicolon separated key-value pairs
    ```bash
    Server=test-database-1.postgres.database.azure.com;Database=postgres;Port=5432;User Id=admin;Password={your_password};Ssl Mode=Require;
    ```
-   PSQL commands
    ```bash
    psql -h test-database-1.postgres.database.azure.com -p 5432 -U admin postgres
    ```
-   Azure Postgres Flexible server example strings (including code snippets) in "Connection Details" and "Connect from your App" section in Connect Settings:
    -   Connection Details as Environment Variables
        ```bash
        export PGHOST=test-database-1.postgres.database.azure.com
        export PGUSER=admin
        export PGPORT=5432
        export PGDATABASE=postgres
        export PGPASSWORD="{your-password}"
        ```
    -   ADO.NET: same as semicolon separated values
        ```bash
        Server=test-database-1.postgres.database.azure.com;Database=postgres;Port=5432;User Id=admin;Password={your_password};Ssl Mode=Require;
        ```
    -   JDBC: Standard Postgres Connection URI preceded by `jdbc:`
        ```
        jdbc:postgresql://test-database-1.postgres.database.azure.com:5432/postgres?user=admin&password={your_password}&sslmode=require
        ```

## Configuration Options

The following configuration options are available for the PostgreSQL extension. These
can be set in user preferences (cmd+,) or workspace settings
`(.vscode/settings.json)`.

### General Settings

-   **`pgsql.enableExperimentalFeatures`**

    -   **Description**: Enables experimental features in the PostgreSQL extension. The features are not production-ready and may have bugs or issues. Restart Visual Studio Code after changing this setting.
    -   **Default**: `true`
    -   **Valid Values**: `true`, `false`

-   **`pgsql.openQueryResultsInTabByDefault`**

    -   **Description**: Automatically display query results in a new editor tab panel instead of the query pane.
    -   **Default**: `false`
    -   **Valid Values**: `true`, `false`

-   **`pgsql.persistQueryResultTabs`**

    -   **Description**: Should query result selections and scroll positions be saved when switching tabs (may impact performance).
    -   **Default**: `false`

-   **`pgsql.queryHistoryLimit`**

    -   **Description**: Number of most recent query history entries to show in the Query History view.
    -   **Default**: `20`

-   **`pgsql.objectExplorer.expandTimeout`**

    -   **Description**: The timeout in seconds for expanding a node in Object Explorer.
    -   **Default**: `45`
    -   **Minimum**: `1`

-   **`pgsql.enableQueryHistoryFeature`**

    -   **Description**: Should Query History feature be enabled.
    -   **Default**: `true`

-   **`pgsql.enableQueryHistoryCapture`**

    -   **Description**: Should Query History Capture be enabled.
    -   **Default**: `true`

-   **`pgsql.resultsGrid.autoSizeColumns`**

    -   **Description**: Automatically adjust the column widths based on the visible rows in the result set. Could have performance problems with a large number of columns or large cells.
    -   **Default**: `true`

-   **`pgsql.tracingLevel`**

    -   **Description**: Log level for backend services.
    -   **Default**: `All`
    -   **Valid Values**: `All`, `Off`, `Critical`, `Error`, `Warning`, `Information`, `Verbose`

-   **`pgsql.piiLogging`**

    -   **Description**: Should Personally Identifiable Information (PII) be logged in the Azure Logs output channel and the output channel log file.
    -   **Default**: `false`

-   **`pgsql.intelliSense.enableIntelliSense`**

    -   **Description**: Should IntelliSense be enabled.
    -   **Default**: `true`
    -   **Valid Values**: `true`, `false`

### Copilot Settings

-   **`pgsql.copilot.enable`**

    -   **Description**: Enable the `@pgsql` GitHub Copilot Chat agent (requires reload).
    -   **Default**: `false`
    -   **Valid Values**: `true`, `false`

-   **`pgsql.copilot.accessMode`**

    -   **Description**: Choose between `Read Only` or `Read/Write` mode for the `@pgsql` GitHub Copilot Chat agent.
    -   **Default**: `rw`
    -   **Valid Values**: `ro` (Read Only), `rw` (Read/Write)

-   **`pgsql.copilot.modelOptions`**

    -   **Description**: Set the model options for the `@pgsql` GitHub Copilot Chat agent. This can impact the performance of the agent or even break it; only change this if you know what you are doing.
    -   **Default**:
        -   `max_tokens`: `10000`
        -   `temperature`: `0.7`
        -   `top_p`: `0.8`

For a complete list of configuration options, refer to the extension's settings in Visual Studio Code.

## Available Commands

The following commands are available in the PostgreSQL extension. These commands can be accessed via the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on macOS) or through keybindings where applicable.

### General Commands

-   **PGSQL: Show PostgreSQL Extension Logs**

    -   **Description**: Show PostgreSQL Extension Logs.

-   **PGSQL: Show PostgreSQL Tools Service Logs**

    -   **Description**: Show PostgreSQL Tools Service Logs.

-   **PGSQL: Execute PostgreSQL Query**

    -   **Description**: Execute PostgreSQL Query.
    -   **Keybinding**: `Shift+Enter`, or `Ctrl+Shift+E` (Windows/Linux), `Cmd+Shift+E` (macOS).

-   **PGSQL: Execute Current PostgreSQL Statement**

    -   **Description**: Execute Current PostgreSQL Statement.

-   **PGSQL: Cancel PostgreSQL Query**

    -   **Description**: Cancel PostgreSQL Query.

-   **PGSQL: Reveal PostgreSQL Query Result**

    -   **Description**: Reveal PostgreSQL Query Result pane.

-   **PGSQL: Change PostgreSQL Database**

    -   **Description**: Change the database the current query window is connected to.

-   **PGSQL: Add New Connection**

    -   **Description**: Add a new connection to a PostgreSQL database.

-   **PGSQL: Create New Docker Instance**

    -   **Description**: Create a new local Docker PostgreSQL instance.

-   **PGSQL: Open Query History**

    -   **Description**: Open Query History.

-   **PGSQL: Run Query from History**

    -   **Description**: Run Query from History.

-   **PGSQL: Copy Query from History**

    -   **Description**: Copy Query from History.

-   **PGSQL: Delete Query from History**

    -   **Description**: Delete Query from History.

-   **PGSQL: Clear All Query History**

    -   **Description**: Clear All Query History.

-   **PGSQL: Enable Query History Capture**

    -   **Description**: Enable Query History Capture.

-   **PGSQL: Start Query History Capture**

    -   **Description**: Start Query History Capture.

-   **PGSQL: Pause Query History Capture**

    -   **Description**: Pause Query History Capture.

-   **PGSQL: Open a New Query Editor**

    -   **Description**: Open a New Query Editor.

-   **PGSQL: Refresh IntelliSense Cache**

    -   **Description**: Refresh IntelliSense Cache.

-   **PGSQL: Connect with PSQL Terminal**

    -   **Description**: Connect with PSQL Terminal.

-   **PGSQL: Explain Query using GitHub Copilot**

    -   **Description**: Explain Query using GitHub Copilot.

-   **PGSQL: Analyze Query Performance using GitHub Copilot**

    -   **Description**: Analyze Query Performance using GitHub Copilot.

-   **PGSQL: Rewrite Query using GitHub Copilot**
    -   **Description**: Rewrite Query using GitHub Copilot.

For a complete list of commands, refer to the Command Palette in Visual Studio Code.
