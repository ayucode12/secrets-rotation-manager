const { Router } = require("express");
const authController = require("../controllers/authController");

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.get("/me", authController.me);

module.exports = authRouter;
