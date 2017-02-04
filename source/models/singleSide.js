export class SingleSide{
    constructor(team, hex, board){
        this.team = team;
        this.hex = hex;
        this.board = board;
    }

    onInputOver(combinedSideView, pointer){
        this.board.selectSection(this);
        this.selected = true;
    }

    onInputOut(combinedSideView, pointer){
        this.selected = false;
    }

    get x(){
        return this.hex.gridCords.x;
    }

    get y(){
        return this.hex.gridCords.y;
    }

    get side(){
        return this.hex.sideNumber(this);
    }

    get cords(){
        return {x: this.x, y: this.y, side: this.side};
    }

    get asString(){
        return this.team.number;
    }
}
