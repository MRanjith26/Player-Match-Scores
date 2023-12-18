const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Starting at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//get all players in player table
app.get("/players", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT 
    * 
    FROM
    player_details`;
  const AllPlayersArray = await db.all(getAllPlayersQuery);
  const getAllPlayersArray = (eachArray) => {
    return {
      playerId: eachArray.player_id,
      playerName: eachArray.player_name,
    };
  };
  response.send(
    AllPlayersArray.map((eachArray) => getAllPlayersArray(eachArray))
  );
});

//get a player from player table by player_id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
  SELECT
  *
  FROM 
  player_details
  WHERE
  player_id = ${playerId};`;
  const playerArray = await db.get(playerQuery);
  const getPlayerArray = (player) => {
    return {
      playerId: player.player_id,
      playerName: player.player_name,
    };
  };
  response.send(getPlayerArray(playerArray));
});

//updates the player details based on player id
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerObject = request.body;
  const { playerName } = playerObject;
  const updatePlayerQuery = `
  UPDATE player_details
  SET
  player_name ='${playerName}'
  WHERE 
  player_id = ${playerId};`;
  const get = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
  SELECT 
  match_id AS matchId,
  match As match,
  year AS year
  FROM 
  match_details
  WHERE
  match_id = ${matchId};`;
  const matchArray = await db.get(getMatchDetailsQuery);
  response.send(matchArray);
});

//Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerDetailsQuery = `
  SELECT 
  match_id AS matchId,
  match,
  year
  FROM match_details NATURAL JOIN player_match_score
  WHERE
  player_id = ${playerId};`;
  const playerMatchArray = await db.all(playerDetailsQuery);
  response.send(playerMatchArray);
});

//
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
  SELECT
  player_id AS playerId,
  player_name AS playerName
  FROM player_details NATURAL JOIN player_match_score
  WHERE
  match_id = ${matchId};`;
  const matchPlayerArray = await db.all(matchDetailsQuery);
  response.send(matchPlayerArray);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player IDv
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const statisticsQuery = `
  SELECT
  player_details.player_id AS playerId,
  player_details.player_name AS playerName,
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes
  FROM player_details INNER JOIN player_match_score
  ON player_details.player_id = player_match_score.player_id
  WHERE
  player_details.player_id = ${playerId};`;
  const statisticsArray = await db.get(statisticsQuery);
  response.send(statisticsArray);
});
module.exports = app;
