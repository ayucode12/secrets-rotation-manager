const { Router } = require("express");
const usersController = require("../controllers/usersController");

const usersRouter = Router();

usersRouter.get("/", usersController.getAll);
usersRouter.get("/:id", usersController.getById);
usersRouter.put("/:id", usersController.update);
usersRouter.delete("/:id", usersController.remove);

module.exports = usersRouter;
