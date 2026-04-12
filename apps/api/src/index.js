const express = require("express");
const cors = require("cors");
const { connectDatabase } = require("@repo/database");
const v1Router = require("./routes");
const demoRouter = require("./routes/demo");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/secrets-manager";

app.set("port", PORT);
app.use(cors());
app.use(express.json());

app.use("/api/v1", v1Router);
app.use("/api", demoRouter);

connectDatabase(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[api] Failed to connect to database:", err.message);
    process.exit(1);
  });

module.exports = app;
