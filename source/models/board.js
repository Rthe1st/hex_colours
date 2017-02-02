import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";
import * as teamInfo from "../teamInfo.js";
import * as gridNavigation from "../gridNavigation.js";

export class Board{
    //passing in x is even more reason to make this a phaser object
    constructor(dataString){
        this.hexagons = parseDataString(dataString);
        this.combinedSides = this.createCombinedLines(this.hexagons);
        //score.score(this);
    }

    getHex(x, y){
        if(!this.hexagonExists(x,y)){
            return undefined;
        }else{
            return this.hexagons[x][y];
        }
    }

    getCombinedSide(combinedSideCord){
        //any combinedSide has 2 valid cords, one for each (x,y,side) that make it up
        //really we want a Map class with custom equality operator from combinedSideCord
        let otherCord = this.oppositeHexagon(combinedSideCord);
        for(let potentialCord of [combinedSideCord, otherCord]){
            let row = this.combinedSides.get(potentialCord.x);
            if(row !== undefined){
                let hex = row.get(potentialCord.y);
                if(hex !== undefined){
                    let combinedSide = hex.get(potentialCord.side);
                    if(combinedSide !== undefined){
                        return combinedSide;
                    }
                }
            }
        }
        return undefined;
    }

    get hexArray(){
        let hexArray = [];
        for(const hexRow of this.hexagons){
            hexArray = hexArray.concat(hexRow);
        }
        return hexArray;
    }

    get combinedSidesArray(){
        let array = [];
        for(const row of this.combinedSides.values()){
            for(const xy of row.values()){
                for(const combinedSide of xy.values()){
                    array.push(combinedSide);
                }
            }
        }
        return array;
    }

    get dataString(){
        let rows = [];
        for(let row of this.hexagons){
            let hexagons = [];
            for(let hexagon of row){
                hexagons.push(hexagon.sidesAsString());
            }
            rows.push(hexagons.join("h"));
        }
        return rows.join("r");
    }

    hexagonExists(x,y){
        if(x < 0){
            return false;
        }else if(x >= this.hexagons.length){
            return false;
        }else if(y < 0){
            return false;
        }else if(y >= this.hexagons[x].length){
            return false;
        }else{
            return true;
        }
    }

    moveToAdjacentCombinedSide(combinedSideCord, direction){
        /*returns co-ordinates of an adjacent combinedSide
        this works by looking at a combined side as having 4 neighbouring combinedSides
        these look like a bowtie:
         \-1             +1  /
          \                 /
           \               /
            ---------------
           /  [supplied     \
          /    hexagon       \
         / -2   side]      +2 \
         This example would be if side=0 was supplied.
         Direction denotes which spoke (-2,-1,+1,+2) you're asking about.
         the numbering is relative, so spokes -2 and +2 are always sides of the central hexagon
         even as side number changes.
         */

         //this is a confuesing api is your not aware of the internals
         //0-3 might be better?
         if(!([-1,-2,+1,+2].includes(direction))){
             console.log("invalid direction supplied");
             console.log(direction);
         }

        //each of these combined sides border a hex adjacent to the supplied one
        //we find that hex and the side it shares with the combined side
        let hexToHexSide;
        if(direction == -1 || direction == -2){
            //+6 in case its negative
            hexToHexSide = ((combinedSideCord.side-1+6)%6);
        }else if(direction == +1){
            hexToHexSide = (combinedSideCord.side)%6;
        }else if(direction == +2){
            hexToHexSide = (combinedSideCord.side+1)%6;
        }

        if(direction == -2 || direction == +2){
            let hexToCombSide = (hexToHexSide+3)%6;
        }else if(direction == -1 || direction == +1){
            let hexToCombSide = (hexToHexSide-1)%6;
        }

        let primaryOffset = gridNavigation.getAdjacentHexagonOffset(combinedSideCord.y, hexToHexSide);
        let newCombinedSideCord = {
            x: combinedSideCord.x+primaryOffset.x,
            y: combinedSideCord.y+primaryOffset.y,
            side: hexToCombSide
        };
        return getCombinedSide(combinedSideCord);
    }

    //could this be simplified if we stuck an extra boarder of "non-move" hexagons round the edge?
    //to make side calcs simplifer
    createCombinedLines(hexagons){
        let combinedSides = new Map();
        for(let x = 0; x < hexagons.length; x++){
            combinedSides.set(x, new Map());
            for(let y = 0; y < hexagons[x].length; y++){
                combinedSides.get(x).set(y, new Map());
                let centerHexagon = hexagons[x][y];
                for(let sideNumber = 0; sideNumber < 6; sideNumber++){
                    let hexInfo = [{
                        hexagon: centerHexagon,
                        side: sideNumber
                    }];
                    let adjacentHexOffset = gridNavigation.getAdjacentHexagonOffset(x, sideNumber);
                    let hexagon2Coordinates = {x: x + adjacentHexOffset.x, y: y + adjacentHexOffset.y};
                    let hexagon2Exists = this.hexagonExists(hexagon2Coordinates.x, hexagon2Coordinates.y);
                    //sides numbered above 3 are covered when we iterate over the other hexagon (so we don't create every combine twice)
                    if(!hexagon2Exists || sideNumber < 3){
                        if(hexagon2Exists){
                           hexInfo.push({
                               hexagon: hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y],
                               side: (sideNumber + 3) % 6
                           });
                        }
                        let combinedSide = new CombinedSide({x: x, y: y, side: sideNumber}, this);
                        combinedSides.get(x).get(y).set(sideNumber, combinedSide);
                    }
                }
            }
        }
        return combinedSides;
    }

    //is this better defined as hexagon class method?
    hexagonInput(clickedHexagon){
        teamInfo.makeMove();
        clickedHexagon.data.model.rotate(1);
    }

    oppositeHexagon(combinedSideCord){
        let oppositeOffset = gridNavigation.getAdjacentHexagonOffset(combinedSideCord.x, combinedSideCord.side);
        return getCombinedSide(combinedSideCord.x + oppositeOffset.x, combinedSideCord.y + oppositeOffset.y, (combinedSideCord.side+3)%6);
    }

}

function parseDataString(string){
    let hexagons = [];
    for(let [x, rowData] of string.split("r").entries()){
        let row = parseRowString(rowData, x);
        hexagons.push(row);
    }
    return hexagons;
}

function parseRowString(rowString, x){
    let current_row = [];
    for(let [y, hexagonData] of rowString.split("h").entries()){
        let hexagon = parseHexString(hexagonData, {x: x, y: y});
        current_row.push(hexagon);
    }
    return current_row;
}

function parseHexString(hexagonString, cords){
    let sides = [];
    for(let side of hexagonString.split(":")){
        sides.push(teamInfo.teams[side]);
    }
    if(sides.length !== 6){
        console.log("invalid map string hexagon");
        console.log(hexagonString);
    }
    return new Hexagon(cords, sides);
}
