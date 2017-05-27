import {teams} from "../teamInfo.js";
import {SingleSide} from "./SingleSide.js";

export class Hexagon{
    constructor(sideInfo, gridCords, board){
        this.sides = [];
        this.gridCords = gridCords;
        if(sideInfo[0] == "!"){
            this.isHome = true;
            this.team = teams[sideInfo[1]];
            for(let sideCount = 0; sideCount < 6; sideCount++){
                this.sides.push(new SingleSide(this.team, this, board));
            }
        }else{
            for(let side of sideInfo.split(":")){
                let team = teams[side];
                this.sides.push(new SingleSide(team, this, board));
            }
        }
        if(this.sides.length != 6){
            throw new Error("incorrect number of sides: " + sides.length);
        }
        this.combinedSides = new Map();
        this.listeners = new Set();
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
        let rotationAllowed = false;
        for(let listener of this.listeners){
            rotationAllowed |= listener.rotate(this.gridCords, amount);
        }
        if(rotationAllowed){
            for(let i=0;i<amount;i++){
                this.sides.unshift(this.sides.pop());
            }
        }
    }

    addListener(listener){
        this.listeners.add(listener);
    }

    removeListener(listener){
        this.listeners.delete(listener);
    }

    get canRotate(){
        for(let listener of this.listeners){
            if(this.side(listener.side).team === listener.team && this.x == listener.x && this.y == listener.y){
                return true;
            }else if(this.side((listener.side + 3)%6).team === listener.team){
                return true;
            }
        }
        return false;
    }
}
