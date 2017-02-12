import * as gridNavigation from '../gridNavigation.js';

let scoring = {
    singleColor: 1,
    doubleColor: 2
};

export function combinedSideGameSettingsGui(gui){
    let folder = gui.addFolder('combined side game settings');
    folder.add(scoring, 'singleColor', 0,50).step(1);
    folder.add(scoring, 'doubleColor', 0, 50).step(1);
}

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

    onInputOver(combinedSideView, pointer){
        //this.board.selectSection(this);
    }

    get selected(){
        if(this.board.selected !== undefined){
            return this.board.selected.combinedSidesScores.has(this);
        }else{
            return 0;
        }
    }

    get score(){
        if(!this.selected){
            throw new Error("don't ask a combined side for it's score when not highlighted, only for use by side view");
        }else{
            return this.board.selected.sideScore(this);
        }
    }

    equals(combinedSideCord){
         function cordEquality(cord1, cord2){
             return cord1.x === cord2.x && cord1.y === cord2.y && cord1.side === cord2.side;
         }
         return cordEquality(combinedSideCord, this.cords) || cordEquality(combinedSideCord, this.alternativeCords);
    }

    get alternativeCords(){
        return gridNavigation.getAdjacentHexagonCord(this);
    }

    get cords(){
        return {x: this.x, y: this.y, side: this.side};
    }

    get hexSideTeams(){
        let teamInfo = [];
        for(let cords of [this.cords, this.alternativeCords]){
            let hex = this.board.getHex(cords.x, cords.y);
            if(hex !== undefined){
                teamInfo.push(hex.side(cords.side).team);
            }
        }
        return teamInfo;
    }

}
