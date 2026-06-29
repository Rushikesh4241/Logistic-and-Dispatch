const express = require("express");
const router = express.Router();
const getConnection = require("../db");

router.post("/", async (req, res) => {
  let connection;

  try {
    const { vehicleNumber, vehicleType, capacity } = req.body;

    connection = await getConnection();
    await connection.execute(
      `INSERT INTO VEHICLE(VEHICLENUMBER, VEHICLETYPE, CAPACITY)
       VALUES (:1, :2, :3)`,
      [vehicleNumber, vehicleType, capacity],
      { autoCommit: true }
    );

    res.json({
      success: true,
      message: "Vehicle Added",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Insert Failed",
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

router.get("/next/:id", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT VEHICLEID, VEHICLENUMBER, VEHICLETYPE, CAPACITY
       FROM VEHICLE
       WHERE VEHICLEID = (
         SELECT MIN(VEHICLEID) FROM VEHICLE WHERE VEHICLEID > :1
       )`,
      [req.params.id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No more records found",
      });
    }

    const row = result.rows[0];
    res.json({
      vehicleId: row[0],
      vehicleNumber: row[1],
      vehicleType: row[2],
      capacity: row[3],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Fetch Failed",
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// FETCH PREVIOUS VEHICLE
router.get("/previous/:id", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT VEHICLEID, VEHICLENUMBER, VEHICLETYPE, CAPACITY
       FROM VEHICLE
       WHERE VEHICLEID = (
         SELECT MAX(VEHICLEID) FROM VEHICLE WHERE VEHICLEID < :1
       )`,
      [req.params.id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No more records found",
      });
    }

    const row = result.rows[0];
    res.json({
      vehicleId: row[0],
      vehicleNumber: row[1],
      vehicleType: row[2],
      capacity: row[3],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Fetch Failed",
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// FETCH VEHICLE BY ID
router.get("/:id", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT VEHICLEID, VEHICLENUMBER, VEHICLETYPE, CAPACITY
       FROM VEHICLE
       WHERE VEHICLEID = :id`,
      [req.params.id]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle Not Found",
      });
    }

    const row = result.rows[0];
    res.json({
      vehicleId: row[0],
      vehicleNumber: row[1],
      vehicleType: row[2],
      capacity: row[3],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Fetch Failed",
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// UPDATE VEHICLE
router.put("/:id", async (req, res) => {
  let connection;

  try {
    const { vehicleNumber, vehicleType, capacity } = req.body;
    connection = await getConnection();

    const result = await connection.execute(
      `UPDATE VEHICLE
       SET VEHICLENUMBER = :1,
           VEHICLETYPE   = :2,
           CAPACITY      = :3
       WHERE VEHICLEID = :4`,
      [vehicleNumber, vehicleType, capacity, req.params.id],
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    res.json({
      success: true,
      message: "Vehicle Updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Update Failed",
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// VIEW ALL VEHICLES
router.get("/", async (req, res) => {
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT VEHICLEID, VEHICLENUMBER, VEHICLETYPE, CAPACITY
       FROM VEHICLE
       ORDER BY VEHICLEID`
    );

    const vehicles = result.rows.map((row) => ({
      vehicleId: row[0],
      vehicleNumber: row[1],
      vehicleType: row[2],
      capacity: row[3],
    }));

    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Fetch Failed",
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

module.exports = router;