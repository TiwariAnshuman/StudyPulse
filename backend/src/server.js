import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      console.log(
        `StudyPulse API running at http://localhost:${env.PORT}`,
      );
    });
  } catch {
    console.error("Server startup failed.");
    process.exitCode = 1;
  }
}

startServer();