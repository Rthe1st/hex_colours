import * as gridNavigation from "../gridNavigation.js";

export class Character{
    constructor(board, cords, team){
        this.cords = cords;
        this.board = board;
        this.team = team;
        board.getHex(cords.x, cords.y).addListener(this);
        let otherHex = gridNavigation.getAdjacentHexagonCord(this.cords);
        if(board.getHex(otherHex.x, otherHex.y) !== undefined){
            board.getHex(otherHex.x, otherHex.y).addListener(this);
        }
    }

    get x(){
        return this.cords.x;
    }

    get y(){
        return this.cords.y;
    }

    get side(){
        return this.cords.side;
    }

    rotate(gridCords, amount){
        this.lastRotation = amount;//hack for character animation
        let side;
        if(gridCords.x != this.x || gridCords.y != this.y){
            side = (this.side + 3)%6;
        }else{
            side = this.side;
        }
        let sideTeam = this.board.getHex(gridCords.x, gridCords.y).side(side).team;
        if(sideTeam !== this.team){
            return false;
        }
        if(gridCords.x != this.x || gridCords.y != this.y){
            this.board.getHex(this.x, this.y).removeListener(this);
            this.cords = {x: gridCords.x, y: gridCords.y, side: (this.cords.side + 3)%6};
        }else{
            let otherHexCord = gridNavigation.getAdjacentHexagonCord(this);
            let otherHex = this.board.getHex(otherHexCord.x, otherHexCord.y);
            if(otherHex !== undefined){
                otherHex.removeListener(this);
            }
        }
        this.cords.side = (this.cords.side + amount)%6;
        let otherHexCord = gridNavigation.getAdjacentHexagonCord(this);
        let otherHex = this.board.getHex(otherHexCord.x, otherHexCord.y);
        if(otherHex !== undefined){
            otherHex.addListener(this);
        }
        return true;
    }

    oppositeSideMatches(){
        let otherHexCord = gridNavigation.getAdjacentHexagonCord(this);
        let otherHex = this.board.getHex(otherHexCord.x, otherHexCord.y);
        if(otherHex !== undefined){
            let sideTeam = otherHex.side((this.side + 3)%6).team;
            if(sideTeam == this.team){
                return true;
            }
        }
        return false;
    }
}
