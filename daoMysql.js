const mysql = require('mysql');
const csv = require('csvtojson');
const uuid = require('uuid');

const resultUpcomingPath = 'result_upcoming.csv';
const resultPlayedPath = 'result_played.csv';

const db_config = {
    host: 'us-cdbr-east-04.cleardb.com',
    user: 'b245e232bf8015',
    password: 'a70686d5',
    database: 'heroku_fd800f3f2a7d32b'
};

let connection; 

const handle_connection = async () => {
    connection = mysql.createConnection(db_config); 
    await connection.connect((err) => {
        if (err) {                                     
            console.log('error when connecting to db:', err);
            setTimeout(handle_connection, 1000); 
        }  
        console.log("db connected");
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

const initTables = async () => {
    await connection.query(
        'CREATE TABLE IF NOT EXISTS teams (\
        id VARCHAR(255) NOT NULL,\
        name VARCHAR(100) NOT NULL,\
        PRIMARY KEY(id));',
        (error) => {
            if (error) throw error;
            console.log("teams table was created");
    });
    await connection.query(
        'CREATE TABLE IF NOT EXISTS tournaments (\
        id VARCHAR(255) NOT NULL,\
        name VARCHAR(100) NOT NULL,\
        PRIMARY KEY(id));',
        (error) => {
            if (error) throw error;
            console.log("tournaments table was created");
    });
    await connection.query(
        'CREATE TABLE IF NOT EXISTS matches (\
        matchId VARCHAR(255) NOT NULL,\
        tournamentId VARCHAR(255) NOT NULL,\
        status ENUM("upcoming", "played") NOT NULL, \
        homeTeamId VARCHAR(255) NOT NULL,\
        awayTeamId VARCHAR(255) NOT NULL,\
        homeScore INT DEFAULT NULL,\
        awayScore INT DEFAULT NULL,\
        startTime VARCHAR(100) NOT NULL,\
        kickoff VARCHAR(5) DEFAULT NULL,\
        PRIMARY KEY(matchId));',
        (error) => {
            if (error) throw error;
            console.log("matches table was created");
    });
}

const insertItemAndGenerateId = async (param, table) => {
    const getIdQuery = 'SELECT id FROM ' + table + ' WHERE name="' + param + '";';
    const generatedId = await connection.query(getIdQuery, async (err, res) => {
        if (err) throw err;
        if (res.length === 0) {
            const insertIdQuery = 'INSERT INTO "' + table + '" (id, name) VALUES (?, ?);';
            const id = uuid.v4();
            await connection.query(insertIdQuery, [id, param], (err) => {
                if (err) throw err;
            });
            return id;
        }
        else {
            return res[0].id;
        }
    });
    return generatedId;
}

const getIdItem = async (param, table, paramName) => {
    let id;
    let sql = 'SELECT id FROM ' + table + ' WHERE name="' + param + '";';
        await connection.query(sql, (err, res) => {
            if (err) throw err;
            if (res.length === 0)
                throw 'Invalid ' + paramName + ' name, please enter again';
            id = res[0].id;
        });
    return id;
}

const getDataByTeam = async (teamId, status) => {
    let sql;
    if (status === undefined)
        sql = 'SELECT * FROM matches WHERE homeTeamId="' + teamId + '" OR awayTeamId="' + teamId + '";';
    else
        sql = 'SELECT * FROM matches WHERE (homeTeamId="' + teamId + '" OR awayTeamId="' + teamId + '") \
                AND status="' + status + '";';
    await connection.query(sql, (err, res) => {
        if (err) throw err;
        return res;
    });
}

const getDataByTournament = async (tournamentId, status) => {
    let sql;
    if (status === undefined)
        sql = 'SELECT * FROM matches WHERE tournamentId="' + tournamentId + '";';
    else
        sql = 'SELECT * FROM matches WHERE tournamentId="' + tournamentId + '"\
                AND status="' + status + '";';
    await connection.query(sql, (err, res) => {
        if (err) throw err;
        return res;
    });
}

const initData = async (dataFilePath, type) => {
    let jsonObj = await csv().fromFile(dataFilePath);
    for (item of jsonObj){
        //generate ids
        let homeTeamId = await insertItemAndGenerateId(item.home_team, 'teams');
        let awayTeamId = await insertItemAndGenerateId(item.away_team, 'teams');
        let tournamentId = await insertItemAndGenerateId(item.tournament, 'tournaments');
        
        let status = type === 'played'? 'played' : 'upcoming';
        let homeScore = type === 'played'? item.home_score : undefined;
        let awayScore = type === 'played'? item.away_score : undefined;
        let kickoff = type === 'upcoming'? item.kickoff : undefined;
        //insert match
        let sql = 'INSERT INTO matches (matchId, tournamentId, status, homeTeamId, awayTeamId,\
            homeScore, awayScore, startTime, kickoff)\
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);';
        let params = [uuid.v4(), tournamentId, status, homeTeamId, awayTeamId, 
                      homeScore, awayScore, item.start_time, kickoff];
        await connection.query(sql, params, (err) => {
            if (err) throw err;
        });
    }
}

module.exports = {
    init: async () => {
        await handle_connection();
        await initTables();
        await initData(resultUpcomingPath, 'upcoming');
        await initData(resultPlayedPath, 'played');
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