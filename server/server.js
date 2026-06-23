const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/login", require("./routes/login"));
app.use("/vehicle", require("./routes/vehicle"));

app.listen(3000, () => {
    console.log("Server Running On Port 3000");
});