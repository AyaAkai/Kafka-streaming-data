const config = {
    tabWidth: 4,
    printWidth: 100,
    bracketSameLine: true,
    overrides: [
        {
            files: ["*.yaml", "*.yml", "*.json"],
            options: {
                tabWidth: 2,
            },
        },
    ],
};

export default config;
