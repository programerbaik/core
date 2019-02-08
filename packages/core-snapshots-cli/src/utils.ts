import { app } from "@arkecosystem/core-kernel";

export const setUpLite = async options => {
    process.env.CORE_SKIP_BLOCKCHAIN = "true";

    await app.setUp("2.0.0", options, {
        include: ["@arkecosystem/core-snapshots"],
    });

    return app;
};

export const tearDown = async () => app.tearDown();