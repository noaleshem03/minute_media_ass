const matchesDao = require('./daoMysql');


module.exports = {
    matchesInit: async () => {
        await matchesDao.init();
    },

    //queries
    matchesQuery: async (team=undefined, tournament=undefined, status=undefined) => {
        return await matchesDao.matchesQuery(team, tournament, status);
    }
}