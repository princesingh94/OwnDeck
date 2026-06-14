const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = require("./app");
const connectDb = require("./config/db");
const { startAlertCron } = require("./services/alertService");

const port = process.env.PORT || 5000;

const boot = async () => {
  await connectDb();
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
  startAlertCron();
};

boot().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
