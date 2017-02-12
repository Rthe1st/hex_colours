import {teams} from "../teamInfo.js";
import {SingleSide} from "./SingleSide.js";

export class Hexagon{
    constructor(dataString, gridCords, board){
        this.sides = [];
        if(dataString[0] == "!"){
            this.isHome = true;
            this.team = teams[dataString[1]];
            for(let sideCount = 0; sideCount < 6; sideCount++){
                this.sides.push(new SingleSide(this.team, this, board));
            }
        }else{
            for(let side of dataString.split(":")){
                let team = teams[side];
                this.sides.push(new SingleSide(team, this, board));
            }
        }
        if(this.sides.length != 6){
            throw new Error("incorrect number of sides: " + sides.length);
        }
        this.combinedSides = new Map();
        this.gridCords = gridCords;
    }

    get x(){
        return this.gridCords.x;
    }

    get y(){
        return this.gridCords.y;
    }

    sideNumber(side){
        for(let [sideNumber, potentialMatch] of this.sides.entries()){
            if(side === potentialMatch){
                return sideNumber;
            }
        }
        return undefined;
    }

    side(number){
        return this.sides[number];
    }

    sidesAsString(){
        if(this.isHome){
            return "!" + this.team.number;
        }else{
            let sides = [];
            for(let side of this.sides){
                sides.push(side.asString);
            }
            return sides.join(":");
        }
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
