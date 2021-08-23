const mysql = require('mysql');
const csv = require('csvtojson');
const uuid = require('uuid');

const resultUpcomingPath = 'result_upcoming.csv';
const resultPlayedPath = 'result_played.csv';

const db_config = {
    host: 'us-cdbr-east-04.cleardb.com',
    user: 'b4f1d1000f371b',
    password: 'e7402430',
    database: 'heroku_55e746305ab6fd3'
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

const createTable = (query) => {
    return new Promise ((resolve, reject) => {
        connection.query(query, (err, res) => {
            if (err) reject(err);
            return resolve(res);
        });
    });
}

const initTables = async () => {
    const teamsQuery = 'CREATE TABLE IF NOT EXISTS teams (\
        id VARCHAR(255) NOT NULL,\
        name VARCHAR(100) NOT NULL,\
        PRIMARY KEY(id));';
    const tournamentsQuery = 'CREATE TABLE IF NOT EXISTS tournaments (\
        id VARCHAR(255) NOT NULL,\
        name VARCHAR(100) NOT NULL,\
        PRIMARY KEY(id));';
    const matchesQuery = 'CREATE TABLE IF NOT EXISTS matches (\
        matchId VARCHAR(255) NOT NULL,\
        tournamentId VARCHAR(255) NOT NULL,\
        status ENUM("upcoming", "played") NOT NULL, \
        homeTeamId VARCHAR(255) NOT NULL,\
        awayTeamId VARCHAR(255) NOT NULL,\
        homeScore INT DEFAULT NULL,\
        awayScore INT DEFAULT NULL,\
        startTime VARCHAR(100) NOT NULL,\
        kickoff VARCHAR(5) DEFAULT NULL,\
        PRIMARY KEY(matchId));';
    await createTable(teamsQuery);
    await createTable(tournamentsQuery);
    await createTable(matchesQuery);
    
}

const insertItem = (table, param) => {
    const insertIdQuery = 'INSERT INTO ' + table + ' (id, name) VALUES (?, ?);';
    const id = uuid.v4();
    return new Promise((resolve, reject) => {
        connection.query(insertIdQuery, [id, param], (err) => {
            if (err) reject1(err);
            return resolve(id);
        });
    });
}

const insertItemAndGenerateId = (param, table) => {
    const getIdQuery = 'SELECT id FROM ' + table + ' WHERE name="' + param + '";';
    return new Promise((resolve, reject) => {
        connection.query(getIdQuery, async (err, res) => {
            if (err) reject(err);
            if (res.length === 0) {
                const id = await insertItem(table, param);
                return resolve(id);
            }
            else {
                return resolve(res[0].id);
            }
        });
    });
}

const getIdItem = (param, table, paramName) => {
    const getIdQuery = 'SELECT id FROM ' + table + ' WHERE name="' + param + '";';
    return new Promise((resolve, reject) => {
        connection.query(getIdQuery, (ree, res) =>{
            if (err) reject(err);
            if (res.length === 0)
                throw 'Invalid ' + paramName + ' name, please enter again';
            return resolve(res[0].id);
        });
    });
}

const getDataByTeam = (teamId, status) => {
    let getMatchesQuery;
    if (status === undefined)
        getMatchesQuery = 'SELECT * FROM matches WHERE homeTeamId="' + teamId + '" OR awayTeamId="' + teamId + '";';
    else
        getMatchesQuery = 'SELECT * FROM matches WHERE (homeTeamId="' + teamId + '" OR awayTeamId="' + teamId + '") \
                AND status="' + status + '";';
    return new Promise((resolve, reject) => {
        connection.query(getMatchesQuery, (err, res) =>{
            if (err) reject(err);
            return resolve(res);
        });
    });
}

const getDataByTournament = (tournamentId, status) => {
    let getMatchesQuery;
    if (status === undefined)
        getMatchesQuery = 'SELECT * FROM matches WHERE tournamentId="' + tournamentId + '";';
    else
        getMatchesQuery = 'SELECT * FROM matches WHERE tournamentId="' + tournamentId + '"\
                AND status="' + status + '";';
    return new Promise((resolve, reject) => {
        connection.query(getMatchesQuery, (err, res) =>{
            if (err) reject(err);
            return resolve(res);
        });
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
        handle_connection();
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