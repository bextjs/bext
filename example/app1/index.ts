import { createBextServer } from "bext";

const app = await createBextServer({
  port: 5002
});

// Log server start
console.log(`🚀 BextJS server started ${app.hostname}:${app.port}`);
