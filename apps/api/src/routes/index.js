const { Router } = require("express");
const secretsRoutes = require("./secrets");
const logsRoutes = require("./logs");

const v1Router = Router();

v1Router.use("/secrets", secretsRoutes);
v1Router.use("/logs", logsRoutes);

module.exports = v1Router;
