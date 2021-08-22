const dataModels = require('./dao');


module.exports = {
    matchesInit: async () => {
        await dataModels.init();
    },

    //queries
    matchesQuery: async (team=undefined, tournament=undefined, status=undefined) => {
        return await dataModels.matchesQuery(team, tournament, status);
    }
}