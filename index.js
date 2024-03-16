const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

let db = null;
const dbPath = path.join(__dirname, "./userData.db");
const secretKey = "MY_TOKEN";

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  } catch (error) {
    console.log("Error: ", error);
    process.exit(1);
  }
};

const validateUser = async (req, res, next) => {
  let jwtToken;
  const authHeader = req.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    res.status(401);
    res.send("Invalid JWT Token");
  } else {
    const isValidJwt = jwt.verify(jwtToken, secretKey, (err, payload) => {
      if (err) {
        res.status(401);
        res.send("Invalid JWT Token");
      } else {
        req.username = payload.username;
        next();
      }
    });
  }
};

app.post("/register", async (req, res) => {
  const { username } = req.body;
  const dbQuery = `Insert into user(username, score) values('${username}', 0)`;
  await db.run(dbQuery);
  const payload = { username };
  const token = await jwt.sign(payload, secretKey);
  res.status(200).send({ token });
});

app.get("/user", validateUser, async (req, res) => {
  const { username } = req;
  const getUserQuery = `select * from user where username="${username}"`;
  const response = await db.get(getUserQuery);
  res.send(response);
});

app.post("/update_score", validateUser, async (req, res) => {
  const { username } = req;
  const { score } = req.body;
  const updateScoreQuery = `Update user set score = ${score} where username="${username}"`;
  await db.run(updateScoreQuery);
});

app.get("/leader_board", validateUser, async (req, res) => {
  const getLeaderBoard = `Select * from user order by score desc limit 10`;
  const response = await db.all(getLeaderBoard);
});

initializeDbAndServer();
