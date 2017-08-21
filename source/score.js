import * as gridNavigation from "./gridNavigation.js";
import * as teamInfo from "./teamInfo.js";

let scoreSettings = {
    perSideIncrease: 1
};

export function scoreSettingsGui(gui){
    let scoreFolder = gui.addFolder('scoring');
    scoreFolder.add(scoreSettings, 'perSideIncrease', 0, 20).step(1);
}

class ConnectionSet{
    constructor(combinedSidesScores){
        this.combinedSidesScores = combinedSidesScores;
    }

    sideScore(combinedSide){
        return this.combinedSidesScores.get(combinedSide) * scoreSettings.perSideIncrease;
    }

    get score(){
        let score = 0;
        for(let setPosition of this.combinedSidesScores.values()){
            score += setPosition * scoreSettings.perSideIncrease;
        }
        return score;
    }
}

class ConnectionSetGroup{
    constructor(connectionSets){
        this.connectionSets = connectionSets;
    }

    //this only works if all connection sets are mutaly exclusive
    get combinedSidesScores(){
        let all = new Map();
        for(let connectionSet of this.connectionSets){
            for(let [combinedSide, score] of connectionSet.combinedSidesScores.entries()){
                all.set(combinedSide, score);
            }
        }
        return all;
    }

    sideScore(combinedSide){
        for(let connectionSet of this.connectionSets){
            if(connectionSet.combinedSidesScores.has(combinedSide)){
                return connectionSet.sideScore(combinedSide) * scoreSettings.perSideIncrease;
            }
        }
    }

    get score(){
        let totalScore = 0;
        for(let connectionSet of this.connectionSets){
            totalScore += connectionSet.score;
        }
        return totalScore;
    }
}

export function allTeamHomeMode(board, team){
    let connectionSets = [];
    let allSearchedSides = new Set();
    for(let hex of board.hexArray){
        if(hex.isHome && hex.team === team){
            //all sides of a home belong to the same team
            let startingCombinedSide = board.getCombinedSide(hex.side(0));
            if(!allSearchedSides.has(startingCombinedSide)){
                let newConnectionSet = getConnectionSet(startingCombinedSide, team, board);
                connectionSets.push(newConnectionSet);
                allSearchedSides = new Set([...allSearchedSides, ...newConnectionSet.combinedSidesScores.keys()]);
            }
        }
    }
    return new ConnectionSetGroup(connectionSets);
}

export function allTeamScore(board, team){
    let connectionSets = [];
    let allSearchedSides = new Set();
    for(let hex of board.hexArray){
        for(let side of hex.sides){
            let startingCombinedSide = board.getCombinedSide(side);
            if(!allSearchedSides.has(startingCombinedSide)){
                let newConnectionSet = getConnectionSet(startingCombinedSide, team, board);
                connectionSets.push(newConnectionSet);
                allSearchedSides = new Set([...allSearchedSides, ...newConnectionSet.combinedSidesScores.keys()]);
            }
        }
    }
    return new ConnectionSetGroup(connectionSets);
}

function alreadyUsed(connects, combinedSide, board){
    for(let cord of [combinedSide, board.getCombinedSide(combinedSide.alternativeCords)]){
        for(let connect of connects){
            if(connect.get(combinedSide) !== undefined){
                return true;
            }
        }
    }
    return false;
}

export function getConnectionSet(startCord, team, board){
    let startCombinedSide = board.getCombinedSide(startCord);
    let connection = new Map();
    for(let nextTeam of startCombinedSide.hexSideTeams){
        if(team === nextTeam){
            growConnect(board, startCombinedSide, connection, nextTeam);
            break;
        }
    }
    return new ConnectionSet(connection);
}

//warning: existing nodes is shittily update in function, not reutrned
function growConnect(board, currentCombinedSide, existingNodes, team){
    existingNodes.set(currentCombinedSide, existingNodes.size);
    for(let direction of [-2,-1,1,2]){
        let nextCombined = board.moveToAdjacentCombinedSide(currentCombinedSide, direction);
        if(nextCombined !== undefined && !existingNodes.has(nextCombined)){
            for(let nextTeam of nextCombined.hexSideTeams){
                if(team === nextTeam){
                    growConnect(board, nextCombined, existingNodes, team);
                    break;
                }
            }
        }
    }
}
