const csv = require('csvtojson');
const uuid = require('uuid');
const resultUpcomingPath = 'result_upcoming.csv';
const resultPlayedPath = 'result_played.csv';

teams = {};
tournaments = {};
matches = {};

const initData = async (dataFilePath, type) => {
    let jsonObj = await csv().fromFile(dataFilePath);
    jsonObj.forEach((item) => {
        //generate id foreach team and tournament
        if (teams[item.home_team] === undefined){
            teams[item.home_team] = uuid.v4();
        }
        if (teams[item.away_team] === undefined){
            teams[item.away_team] = uuid.v4();
        }
        if (tournaments[item.tournament] === undefined){
            tournaments[item.tournament] = uuid.v4();
        }
        
        match = {};
        match['tournament'] = item.tournament;
        match['status'] = undefined;
        match['home'] = {};
        match['away'] = {};
        match['home']['team'] = item.home_team;
        match['away']['team'] = item.away_team;
        match['date'] = item.start_time;
        if (type === 'played'){
            match['status'] = 'played';
            match['home']['score'] = item.home_score;
            match['away']['score'] = item.away_score;
            match['kickoff'] = undefined;
        }
        else if (type === 'upcoming'){
            match['status'] = 'upcoming';
            match['home']['score'] = undefined;
            match['away']['score'] = undefined;
            match['kickoff'] = item.kickoff;
        }

        let matchId = uuid.v4();
        matches[matchId] = match;
    })
}

const filterMatchesArray = (array, param, name, status=undefined) => {
    let result = [];
    for (i of array){
        let iStatus = i['status'];
        if (param === 'team'){
            let homeTeam = i['home']['team'];
            let awayTeam = i['away']['team'];
            if (status === undefined){
                if ((homeTeam === name) || (awayTeam === name))
                    result.push(i);
            }
            else{
                if (((homeTeam === name) || (awayTeam === name)) && iStatus === status)
                    result.push(i);
            } 
        }
        else if (param === 'tournament'){
            let tournament = i['tournament'];
            if (status === undefined){
                if (tournament === name)
                    result.push(i);
            }
            else{
                if ((tournament === name) && (iStatus === status))
                    result.push(i);
            } 
        }
    }
    return result;
}
  

module.exports = {
    init: async () => {
        initData(resultUpcomingPath, 'upcoming');
        initData(resultPlayedPath, 'played');
    },

    matchesQuery: async (team=undefined, tournament=undefined, status=undefined) => {
        let matchesArray = Object.values(matches);
        if (status !== undefined && status !== 'upcoming' && status !== 'played')
            throw 'Invalid status type, please enter again';
        if (team !== undefined){
            let teamId = teams[team];
            if (teamId === undefined)
                throw 'Invalid team name, please enter again';
            return filterMatchesArray(matchesArray, 'team', team, status);
        }
        else if (tournament !== undefined){
            let tournamentId = tournaments[tournament];
            if (tournamentId === undefined)
                throw 'Invalid tournamnet name, please enter again';
            return filterMatchesArray(matchesArray, 'tournament', tournament, status);
        }    
    }
}
