const express = require("express");
const router = express.Router();
const getConnection = require("../db");

//next id
router.get("/new-id", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT NVL(MAX(ASSIGNMENTID), 0) + 1 FROM DISPATCHASSIGNMENT`,
    );

    res.json({ nextId: result.rows[0][0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error calculating sequence parameters" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

// fetch orders
router.get("/orders", async (req, res) => {

  let connection;

  const mode = req.query.mode || "FIND";

  try {

    connection = await getConnection();

    let query = `SELECT ORDERID, CUSTOMERID, TO_CHAR(DISPATCHDATE, 'YYYY-MM-DD'), SOURCE, DESTINATION, STATUS FROM DISPATCHORDER`;

    if (mode === "NEW") {
      query += ` WHERE UPPER(STATUS) = 'PENDING'`;
    }

    query += ` ORDER BY ORDERID`;

    const result = await connection.execute(query);

    res.json(
      result.rows.map((row) => ({
        orderId: row[0],
        customerId: row[1],
        dispatchDate: row[2],
        source: row[3],
        destination: row[4],
        status: row[5],
      })),
    );

  } catch (err) {

    console.error(err);
    res.status(500).json({ message: "Failed to load orders" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

// fetch drivers
router.get("/drivers", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT DRIVERID, DRIVERNAME FROM DRIVER ORDER BY DRIVERID`,
    );

    res.json(
      result.rows.map((row) => ({ driverId: row[0], driverName: row[1] })),
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load drivers" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

// fetch vehicles
router.get("/vehicles", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT VEHICLEID, VEHICLENUMBER, VEHICLETYPE, CAPACITY FROM VEHICLE ORDER BY VEHICLEID`,
    );

    res.json(
      result.rows.map((row) => ({
        vehicleId: row[0],
        vehicleNumber: row[1],
        vehicleType: row[2],
        capacity: row[3],
      })),
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load vehicle grid" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

// next-id
router.get("/next/:id", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT ASSIGNMENTID, ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID = (SELECT MIN(ASSIGNMENTID) FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID > :1)`,
      [req.params.id],
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "No more records" });
    }

    const row = result.rows[0];

    res.json({
      assignmentId: row[0],
      orderId: row[1],
      driverId: row[2],
      vehicleId: row[3],
      assignedDate: row[4],
    });

  } catch (err) {
    res.status(500).json({ message: "Pagination error" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

// prev-id
router.get("/previous/:id", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT ASSIGNMENTID, ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID = (SELECT MAX(ASSIGNMENTID) FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID < :1)`,
      [req.params.id],
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "No prior records" });
    }

    const row = result.rows[0];

    res.json({
      assignmentId: row[0],
      orderId: row[1],
      driverId: row[2],
      vehicleId: row[3],
      assignedDate: row[4],
    });

  } catch (err) {
    res.status(500).json({ message: "Pagination error" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

// fetch id
router.get("/:id", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT ASSIGNMENTID, ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE FROM DISPATCHASSIGNMENT WHERE ASSIGNMENTID = :1`,
      [req.params.id],
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const row = result.rows[0];

    res.json({
      assignmentId: row[0],
      orderId: row[1],
      driverId: row[2],
      vehicleId: row[3],
      assignedDate: row[4],
    });

  } catch (err) {
    res.status(500).json({ message: "Lookup failure" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});


//save
router.post("/", async (req, res) => {

  let connection;

  const { orderId, driverId, vehicleId, dateTime } = req.body;

  try {

    connection = await getConnection();

    if (!dateTime) {

      await connection.execute(
        `INSERT INTO DISPATCHASSIGNMENT (ORDERID, DRIVERID, VEHICLEID) VALUES (:1, :2, :3)`,
        [orderId, driverId, vehicleId],
        { autoCommit: true },
      );

    } else {

      await connection.execute(
        `INSERT INTO DISPATCHASSIGNMENT (ORDERID, DRIVERID, VEHICLEID, ASSIGNEDDATE) VALUES (:1, :2, :3, TO_DATE(:4, 'YYYY-MM-DD'))`,
        [orderId, driverId, vehicleId, dateTime],
        { autoCommit: true },
      );

    }

    res.json({
      success: true,
      message: "Assignment Transaction Saved Successfully",
    });

  } catch (err) {
    res.status(500).json({ success: false, message: "Insertion failed" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});


// update
router.put("/:id", async (req, res) => {

  let connection;

  const { orderId, driverId, vehicleId, dateTime } = req.body;

  try {

    connection = await getConnection();

    await connection.execute(
      `UPDATE DISPATCHASSIGNMENT SET ORDERID = :1, DRIVERID = :2, VEHICLEID = :3, ASSIGNEDDATE = CASE WHEN :4 IS NULL THEN NULL ELSE TO_DATE(:4, 'YYYY-MM-DD') END WHERE ASSIGNMENTID = :5`,
      [orderId, driverId, vehicleId, dateTime || null, req.params.id],
      { autoCommit: true },
    );

    res.json({
      success: true,
      message: `Assignment ID ${req.params.id} updated successfully`,
    });

  } catch (err) {
    res.status(500).json({ message: "Update declined" });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;
