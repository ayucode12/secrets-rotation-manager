const { Router } = require("express");
const secretsRoutes = require("./secrets");
const logsRoutes = require("./logs");
const authRoutes = require("./auth");
const usersRoutes = require("./users");
const apiKeysRoutes = require("./api-keys");
const clientRoutes = require("./client");

const v1Router = Router();

v1Router.use("/auth", authRoutes);
v1Router.use("/users", usersRoutes);
v1Router.use("/secrets", secretsRoutes);
v1Router.use("/logs", logsRoutes);
v1Router.use("/api-keys", apiKeysRoutes);
v1Router.use("/client", clientRoutes);

module.exports = v1Router;
