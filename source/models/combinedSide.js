import * as gridNavigation from '../gridNavigation.js';

export class CombinedSide{
    constructor(cords, board){
        if(board.getHex(cords.x, cords.y) === undefined){
            throw new Error("combined side's default x,y must be a hex on the map");
        }
        this.x = cords.x;
        this.y = cords.y;
        this.side = cords.side;
        this.board = board;
    }

    equals(combinedSideCord){
         function cordEquality(cord1, cord2){
             return cord1.x === cord2.x && cord1.y === cord2.y && cord1.side === cord2.side;
         }
         return cordEquality(combinedSideCord, this.cords) || cordEquality(combinedSideCord, this.alternativeCords);
    }

    get alternativeCords(){
        let offset = gridNavigation.getAdjacentHexagonOffset(this.x, this.side);
        return {x: this.x + offset.x,
                y: this.y + offset.y,
                side: (this.side+3)%6
        };
    }

    get cords(){
        return {x: this.x, y: this.y, side: this.side};
    }

    get hexSideTeams(){
        let teamInfo = [];
        for(let cords of [this.cords, this.alternativeCords]){
            let hex = this.board.getHex(this.cords.x, this.cords.y);
            if(hex !== undefined){
                teamInfo.push(hex.side(cords.side));
            }
        }
        return teamInfo;
    }

}
