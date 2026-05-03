require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

//  Conexión DB
require("./db");

//  Rutas
const registerRoutes = require("./routes/register");
const loginRoutes = require("./routes/login");
const catalogosRoutes = require("./routes/catalogos.routes");

app.use("/", registerRoutes);
app.use("/", loginRoutes);
app.use("/", catalogosRoutes);

app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});