const express = require('express');
const bodyParser = require('body-parser');
const matchService = require('./matchService');

//init port
const port = process.env.PORT || 5000;  
//init express
const app = express();
app.use(bodyParser.json());

//listen to port
const server = app.listen(port, () => console.log(`Server started on port ${port}`));

//init data
matchService.matchesInit();

//routs
app.get('/matches', async (req, res, next) => {
    let query = req.query;
    let result;
    try {
        let queryKeys = Object.keys(query);
        if (queryKeys.length === 0){
            return res.status(400).json({
                message: 'Bad query, please enter parameters'
            });
        }
        if (queryKeys.length > 2){
            return res.status(400).json({
                message: 'Bad query, please enter at most 2 parameters'
            });
        }
        
        let queryParam = queryKeys[0].toLowerCase();
        if (queryParam === 'team'){
            if (queryKeys.length === 1)
                result = await matchService.matchesQuery(query.team);
            else{
                if (queryKeys[1].toLowerCase() !== 'status'){
                    return res.status(400).json({
                        message: 'Bad query, please enter team name or tournament name'
                    })
                }
                result = await matchService.matchesQuery(query.team, undefined, query.status);
            }
        }
        else if (queryParam === 'tournament'){
            if (queryKeys.length === 1)
                result = await matchService.matchesQuery(undefined, query.tournament);
            else{
                if (queryKeys[1].toLowerCase() !== 'status'){
                    return res.status(400).json({
                        message: 'Bad query, please enter team name or tournament name'
                    })
                }
                result = await matchService.matchesQuery(undefined, query.tournament, query.status);
            }
        }
        else{
            return res.status(400).json({
                message: 'Bad query, please enter `team` or `tournament` as parameter name'
            })
        }
        res.json(result);
    }
    catch (err){
        console.error(err, 'Error during get the query');
        return res.status(500).json({
            message: err
        });
    }
});


module.exports = server;