const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");
const getConnection = require("../db");

// LOV
router.get("/types", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT LOV_VALUE FROM LOV_MASTER
       WHERE LOV_TYPE = 'VehicleType'
         AND STATUS = 'ACTIVE'
       ORDER BY LOV_VALUE`
    );

    const types = (result.rows || []).map((row) => row[0]);

    res.json(types);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to fetch vehicle types",
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }
});


//next id
router.get("/next-id", async (req, res) => {

  let connection;

  try {

    connection = await getConnection();

    const result = await connection.execute(
      `SELECT NVL(MAX(VEHICLEID), 0) + 1 FROM VEHICLE`
    );

    const nextId = result.rows && result.rows[0] ? result.rows[0][0] : 1;
    res.json({ nextId });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to get next vehicle ID",
    });

  } finally {
    if (connection) {
      await connection.close();
    }
  }

});

//save
router.post("/", async (req, res) => {

  let connection;

  try {

    const { vehicleId, vehicleNumber, vehicleType, capacity } = req.body;

    connection = await getConnection();

    let result;

    if (vehicleId) {

      result = await connection.execute(
        `INSERT INTO VEHICLE (VEHICLEID, VEHICLENUMBER, VEHICLETYPE, CAPACITY)
         VALUES (:vehicleId, :vehicleNumber, :vehicleType, :capacity)`,
        { vehicleId, vehicleNumber, vehicleType, capacity },
        { autoCommit: true }
      );

      res.json({
        success: true,
        message: "Vehicle created successfully.",
        vehicleId,
      });

      return;
    }

    result = await connection.execute(
      `INSERT INTO VEHICLE (VEHICLENUMBER, VEHICLETYPE, CAPACITY)
       VALUES (:vehicleNumber, :vehicleType, :capacity)
       RETURNING VEHICLEID INTO :vehicleId`,
      {
        vehicleNumber,
        vehicleType,
        capacity,
        vehicleId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );

    const createdId = result.outBinds.vehicleId[0];

    res.json({
      success: true,
      message: "Vehicle created successfully.",
      vehicleId: createdId,
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Insert Failed. Check Vehicle ID, number, and type.",
    });

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

// prev-id
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

// fetch id
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


// update
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
      message: "Vehicle updated successfully.",
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