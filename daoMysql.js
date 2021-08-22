const mysql = require('mysql');
const csv = require('csvtojson');
const uuid = require('uuid');

const resultUpcomingPath = 'result_upcoming.csv';
const resultPlayedPath = 'result_played.csv';

const db_config = {
    host: 'us-cdbr-east-04.cleardb.com',
    user: 'b297d974f0bc03',
    password: '7d17a968',
    database: 'heroku_947a0e33bab078d'
};

let connection; 

const handle_connection = () => {
    connection = mysql.createConnection(db_config); 
    connection.connect((err) => {
        if (err) {                                     
            console.log('error when connecting to db:', err);
            setTimeout(handle_connection, 1000); 
        }  
    });          
                               	
    connection.on('error', (err) => {
        console.log('3. db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handle_connection(); 
        } else {
            throw err;
        }
    });
}

const initTables = async (dataFilePath, type) => {
    connection.query(
        `CREATE TABLE IF NOT EXISTS teams (
        id varchar(255) NOT NULL,
        name varchar(100) NOT NULL,
        PRIMARY KEY(id),
        UNIQUE(name));`,
        (error) => {
            if (error) throw error;
            console.log("teams table was created");
    });
    connection.query(
        `CREATE TABLE IF NOT EXISTS tournaments (
        id varchar(255) NOT NULL,
        name varchar(100) NOT NULL
        PRIMARY KEY(id),
        UNIQUE(name));`,
        (error) => {
            if (error) throw error;
            console.log("tournaments table was created");
    });
    connection.query(
        `CREATE TABLE IF NOT EXISTS matches (
        matchId varchar(255) NOT NULL,
        tournamentId varchar(255) NOT NULL,
        status ENUM('upcoming', 'played') NOT NULL, 
        homeTeamId varchar(255) NOT NULL,
        awayTeamId varchar(255) NOT NULL,
        homeScore int DEFAULT NULL,
        awayScore int DEFAULT NULL,
        startTime varchar(100) NOT NULL,
        kickoff varchar(5) DEFAULT NULL,
        PRIMARY KEY(matchId));`,
        (error) => {
            if (error) throw error;
            console.log("matches table was created");
    });
}

const generateId = (param, table) => {
    let id;
    let sql = `SELECT id FROM ` + table + ` WHERE name = ` + param + `;`;
        connection.query(sql, (err, res) => {
            if (err) throw err;
            if (res.length === 0){
                sql = `INSERT INTO ` + table + ` (id, name) 
                VALUES (?, ?);`
                id = uuid.v4();
                let params = [id, param];
                connection.query(sql, params, (err) => {
                    if (err) throw err;
                });
            }
            console.log("!!!!!!!!!!!!!");
            console.log(res);
        });
    return id;
}

const getIdItem = (param, table, paramName) => {
    let id;
    let sql = `SELECT id FROM ` + table + ` WHERE name = ` + param + `;`;
        connection.query(sql, (err, res) => {
            if (err) throw err;
            if (res.length === 0)
                throw 'Invalid ' + paramName + ' name, please enter again';
            id = res[0].id;
        });
    return id;
}

const getDataByTeam = (teamId, status) => {
    let sql;
    if (status === undefined)
        sql = `SELECT * FROM matches WHERE homeTeamId = ` + teamId + ` OR awayTeamId = ` + teamId + `;`;
    else
        sql = `SELECT * FROM matches WHERE (homeTeamId = ` + teamId + ` OR awayTeamId = ` + teamId + `) 
                AND status = ` + status + `;`;
    connection.query(sql, (err, res) => {
        if (err) throw err;
        return res;
    });
}

const getDataByTournament = (tournamentId, status) => {
    let sql;
    if (status === undefined)
        sql = `SELECT * FROM matches WHERE tournamentId = ` + tournamentId + `;`;
    else
        sql = `SELECT * FROM matches WHERE tournamentId = ` + tournamentId + `
                AND status = ` + status + `;`;
    connection.query(sql, (err, res) => {
        if (err) throw err;
        return res;
    });
}

const initData = async (dataFilePath, type) => {
    let jsonObj = await csv().fromFile(dataFilePath);
    jsonObj.forEach((item) => {
        //generate ids
        let homeTeamId = generateId(item.home_team, 'teams');
        let awatTeamId = generateId(item.away_team, 'teams');
        let tournamentId = generateId(item.tournament, 'tournaments');
        
        let status = type === 'played'? 'played' : 'upcoming';
        let homeScore = type === 'played'? item.home_score : undefined;
        let awayScore = type === 'played'? item.away_score : undefined;
        let kickoff = type === 'upcoming'? item.kickoff : undefined;
        //insert match
        let sql = `INSERT INTO matches (matchId, tournamentId, status, homeTeamId, awayTeamId,
            homeScore, awayScore, startTime, kickoff)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`
        let params = [uuid.v4(), tournamentId, status, homeTeamId, awatTeamId, 
                      homeScore, awayScore, item.start_time, kickoff];
        connection.query(sql, params, (err) => {
            if (err) throw err;
        });
    });
}

module.exports = {
    init: async () => {
        handle_connection();
        initTables();
        initData(resultUpcomingPath, 'upcoming');
        initData(resultPlayedPath, 'played');
    },

    matchesQuery: async (team=undefined, tournament=undefined, status=undefined) => {
        if (status !== undefined && status !== 'upcoming' && status !== 'played')
            throw 'Invalid status type, please enter again';
        if (team !== undefined){
            let teamId = getIdItem(team, 'teams', 'team');
            return getDataByTeam(teamId, status);
        }
        else if (tournament !== undefined){
            let tournamentId = getIdItem(tournament, 'tournaments', 'tournament');
            return getDataByTournament(tournamentId, status);
        }    
    }
}