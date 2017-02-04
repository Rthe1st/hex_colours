import * as gridNavigation from "./gridNavigation.js";
import * as teamInfo from "./teamInfo.js";

let boardSettings = {
    spaceFactor: 0.6
};

export function scoreSettingsGui(gui, game){
    gui.add(boardSettings, 'spaceFactor', 0, 2);
}

class ConnectionSet{
    constructor(combinedSides){
        this.combinedSides = combinedSides;
    }

    get score(){
        let perSideBonus = 1;
        let score = 0;
        //let count = 0;
        for(let combinedSide of this.combinedSides){
            score += combinedSide.score;
            //count += 1;
            //score += perSideBonus * count;
        }
        return score;
    }
}

export function allTeamScore(board, team){
    let connectionSets = [];
    let allSearchedSides = new Set();
    for(let hex of board.hexArray){
        for(let side of hex.sides){
            if(!allSearchedSides.has(side)){
                let newConnectionSet = getConnectionSet(side, team, board);
                connectionSets.push(newConnectionSet);
                allSearchedSides = new Set([...allSearchedSides, ...newConnectionSet.combinedSides]);
            }
        }
    }
    return new ConnectionSet(allSearchedSides);
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
    let connection = new Set();
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
    existingNodes.add(currentCombinedSide);
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
