import {teams} from "../teamInfo.js";

export class Hexagon{
    constructor(gridCords, sides){
        this.combinedSides = new Map();
        this.gridCords = gridCords;
        if(sides.length != 6){
            throw new Error("incorrect number of sides: " + sides.length);
        }
        this.sides = sides;
    }

    side(number){
        return this.sides[number];
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
            let absoluteAmount = amount*-1;
            amount = 6-absoluteAmount;
        }
        for(let i=0;i<amount;i++){
            this.sides.unshift(this.sides.pop());
        }
    }
}
