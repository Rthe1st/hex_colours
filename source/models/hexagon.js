import {teams} from "../teamInfo.js";

export class Hexagon{
    constructor(gridCords, sides){
        this.combinedSides = new Map();
        this.gridCords = gridCords;
        this.sides = sides;
    }

    getCombinedSide(side){
        return this.combinedSides.get(side);
    }

    setCombinedSide(side, combinedSide){
        this.combinedSides.set(side, combinedSide);
    }

    sidesAsString(){
        let sides = [];
        for(let side of this.sides){
            sides.push(side.number);
        }
        return sides.join(":");
    }

    rotate(amount){
        amount = amount % 6;
        //for anti-clockwise
        if(amount < 0){
            amount = 6-amount;
        }
        for(let i=0;i<amount;i++){
            this.sides.unshift(this.sides.pop());
        }
    }
}
