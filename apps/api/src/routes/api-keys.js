const { Router } = require("express");
const apiKeysController = require("../controllers/apiKeysController");

const apiKeysRouter = Router();

apiKeysRouter.get("/", apiKeysController.getAll);
apiKeysRouter.post("/", apiKeysController.create);
apiKeysRouter.patch("/:id/revoke", apiKeysController.revoke);
apiKeysRouter.delete("/:id", apiKeysController.remove);

module.exports = apiKeysRouter;
