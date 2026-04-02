const { Router } = require("express");
const logsController = require("../controllers/logsController");

const logsRouter = Router();

logsRouter.get("/", logsController.getAll);

module.exports = logsRouter;
