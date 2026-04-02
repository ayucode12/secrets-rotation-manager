const { Router } = require("express");
const secretsController = require("../controllers/secretsController");
const logsController = require("../controllers/logsController");

const secretsRouter = Router();

secretsRouter.get("/", secretsController.getAll);
secretsRouter.post("/", secretsController.create);
secretsRouter.get("/:id", secretsController.getById);
secretsRouter.put("/:id", secretsController.update);
secretsRouter.delete("/:id", secretsController.remove);
secretsRouter.post("/:id/rotate", secretsController.rotate);
secretsRouter.get("/:id/logs", logsController.getBySecretId);

module.exports = secretsRouter;
