const app = require("express")();
const pg = require("pg");
const { dirname } = require("path");
const { fileURLToPath } = require("url");

const _dirname = dirname(__filename);

const pool = new pg.Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "postgres",
  max: 20,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

app.get("/", (req, res) => {
  res.sendFile(_dirname + "/index.html");
});

app.get("/seats", async (req, res) => {
  const result = await pool.query("select * from seats");
  res.send(result.rows);
});

app.put("/:id/:name", async (req, res) => {
  try {
    const id = req.params.id;
    const name = req.params.name;

    const conn = await pool.connect();
    await conn.query("BEGIN");
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await conn.query(sql, [id]);
    if (result.rowCount === 0) {
      res.send({ error: "Seat already booked" });
      return;
    }
    const sqlU = "update seats set isbooked = 1, name = $2 where id = $1";
    const updateResult = await conn.query(sqlU, [id, name]);

    await conn.query("COMMIT");
    conn.release();
    res.send(updateResult);
  } catch (ex) {
    console.log(ex);
    res.send(500);
  }
});

app.listen(8081, () => console.log("Listening 8081"));
