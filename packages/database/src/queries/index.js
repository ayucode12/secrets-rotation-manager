const { userQueries } = require("./user.queries");
const { secretQueries } = require("./secret.queries");
const { rotationLogQueries } = require("./rotation-log.queries");
const { apiKeyQueries } = require("./api-key.queries");

module.exports = { userQueries, secretQueries, rotationLogQueries, apiKeyQueries };
