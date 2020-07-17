// Grab .env file if there is one
require("dotenv").config();

const app = require("./server/express");

const port = parseInt(process.env.PORT, 10) || 3001;
app.set("port", port);

app.listen(app.get("port"), () => {
  console.log(`Find the server at: http://localhost:${app.get("port")}/`); // eslint-disable-line no-console
});
