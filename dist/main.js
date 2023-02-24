"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//dependencies
const express_1 = require("./config/express");
const data_source_1 = require("./config/data-source");
//src run
const PORT = process.env.PORT || 4000;
express_1.server.listen(PORT, async () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`======= ENV: ${process.env.NODE_ENV} =======`);
    try {
        //make database connection
        await data_source_1.appDataSource.initialize();
        console.log("Data Source has been initialized!");
    }
    catch (err) {
        console.error("Error during Data Source initialization", err);
    }
});
//# sourceMappingURL=main.js.map