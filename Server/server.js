const express = require("express");

const cors = require("cors");

const path = require("path");


const app = express();


app.use(cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));


app.use("/login", require("./routes/login"));

app.use("/vehicle", require("./routes/vehicle"));

app.use("/customer", require("./routes/customer"));

app.use("/driver", require("./routes/driver"));

app.use("/delivery", require("./routes/delivery"));

app.use("/dispatch-assignment", require("./routes/DispatchAssignment"));

app.use("/dispatch-order", require("./routes/dispatchOrder"));


app.listen(3000, () => {

    console.log("Server Running On Port 3000");

});
