const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "data.json");

/**
 * Middleware to parse JSON
 * We add an error handler below to catch invalid JSON
 */
app.use(express.json());

/**
  Read data.json safely
 */
function readDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const rawData = fs.readFileSync(DATA_FILE, "utf8");
    return rawData ? JSON.parse(rawData) : [];
  } catch (err) {
    throw new Error("Failed to read or parse data file");
  }
}

/**
 * Helper: Write to data.json safely
 */
function writeDataFile(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error("Failed to write data file");
  }
}

/**
 * GET /kgl/procurement
 * Returns all procurement records
 */
app.get("/kgl/procurement", (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(200).json([]);
    }

    const data = fs.readFileSync(DATA_FILE, "utf8");
    const records = data ? JSON.parse(data) : [];

    res.status(200).json(records);
  } catch (err) {
    res.status(500).json({
      error: "Failed to load procurement data",
    });
  }
});


/**
 * POST /kgl/procurement
 * Adds a new procurement record
 */
app.post("/kgl/procurement", (req, res) => {
  try {
    const { produceName, tonnage, cost } = req.body;

    if (!produceName || tonnage == null || cost == null) {
      return res.status(400).json({
        error: "produceName, tonnage, and cost are required",
      });
    }

    const records = readDataFile();

    const newRecord = {
      id: Date.now(),
      produceName,
      tonnage,
      cost,
      createdAt: new Date().toISOString(),
    };

    records.push(newRecord);
    writeDataFile(records);

    res.status(201).json({
      message: "Procurement record added successfully",
      record: newRecord,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Invalid JSON handler (must come AFTER express.json())
 */
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  next(err);
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`KGL Procurement Server running on http://localhost:${PORT}`);
});
