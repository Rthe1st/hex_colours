import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";
import * as teamInfo from "../teamInfo.js";
import * as gridNavigation from "../gridNavigation.js";
import * as score from '../score.js';

let settings = {
    mode: 'home'
};

export function boardModelSettingsGui(gui){
    gui.add(settings, 'mode', ['home', 'normal']);
}

export class Board{
    //passing in x is even more reason to make this a phaser object
    constructor(dataString, mode, gui){
        this.hexagons = this.parseDataString(dataString);
        this.createCombinedLines(this.hexArray);
        //settings.mode instead of this.mode is a horible hack
        settings.mode = mode;
    }

    getHex(x, y){
        if(this.hexagons.get(x) !== undefined){
            return this.hexagons.get(x).get(y);
        }else{
            return undefined;
        }
    }

    get gridWidth(){
        if(this.hexagons.size === 0){
            return 0;
        }else{
            return Math.max(...this.hexagons.keys());
        }
    }

    get gridHeight(){
        let currentMax = 0;
        for(let row of this.hexagons.values()){
            currentMax = Math.max(currentMax, ...row.keys());
        }
        return currentMax;
    }

    selectSection(singleSide){
        let connectionSet = score.getConnectionSet(singleSide, singleSide.team, this);
        this.selected = connectionSet;
    }

    teamHighlight(team){
        if(settings.mode == "home"){
            this.selected = score.allTeamHomeMode(this, team);
        }else{
            this.selected = score.allTeamScore(this, team);
        }
    }

    getCombinedSide(combinedSideCord){
        //any combinedSide has 2 valid cords, one for each (x,y,side) that make it up
        //really we want a Map class with custom equality operator from combinedSideCord
        let otherCord = gridNavigation.getAdjacentHexagonCord(combinedSideCord);
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
        for(const hexRow of this.hexagons.values()){
            hexArray = hexArray.concat(Array.from(hexRow.values()));
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
        for(let x of Array.from(this.hexagons.keys()).sort()){
            while(rows.length < x){
                rows.push("E");
            }
            let row = [];
            for(let y of Array.from(this.hexagons.get(x).keys()).sort()){
                while(row.length < y){
                    row.push("E");
                }
                row.push(this.getHex(x,y).sidesAsString());
            }
            rows.push(row.join("h"));
        }
        return rows.join("r");
    }

    hexagonExists(x,y){
        return this.getHex(x, y) === undefined;
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
         let newCord;
         if(direction === -2){
            newCord = {
                 x: combinedSideCord.x,
                 y: combinedSideCord.y,
                 side: (combinedSideCord.side - 1 + 6)%6 //+6 to stop negaatives
             };
         }else if(direction === +2){
             newCord = {
                 x: combinedSideCord.x,
                 y: combinedSideCord.y,
                 side: (combinedSideCord.side + 1)%6
             };
         }else if(direction === -1){
             newCord = gridNavigation.getAdjacentHexagonCord(combinedSideCord);
             newCord.side = (newCord.side + 1)%6;
         }else if(direction === +1){
              newCord = gridNavigation.getAdjacentHexagonCord(combinedSideCord);
              newCord.side = (newCord.side - 1 + 6)%6; //+6 to stop negaatives
          }else{
              throw new Error("invalid direction supplied " + direction);
          }

          return this.getCombinedSide(newCord);
    }

    //could this be simplified if we stuck an extra boarder of "non-move" hexagons round the edge?
    //to make side calcs simplifer
    createCombinedLines(hexagons){
        this.combinedSides = new Map();
        for(let centerHexagon of hexagons){
            for(let side of centerHexagon.sides){
                //so we don't create every combine twice)
                if(this.getCombinedSide(side) === undefined){
                    if(this.combinedSides.get(side.x) === undefined){
                        this.combinedSides.set(side.x, new Map());
                    }
                    let row = this.combinedSides.get(side.x);
                    if(row.get(side.y) === undefined){
                        row.set(side.y, new Map());
                    }
                    let rowColumn = row.get(side.y);
                    rowColumn.set(side.side, new CombinedSide(side, this));
                }
            }
        }
    }

    //is this better defined as hexagon class method?
    hexagonInput(clickedHexagon){
        teamInfo.makeMove();
        clickedHexagon.data.model.rotate(1);
        if(teamInfo.endOfRound()){
            for(let team of teamInfo.teams){
                if(settings.mode == "home"){
                    team.score += score.allTeamHomeMode(this, team).score;
                }else{
                    team.score += score.allTeamScore(this, team).score;
                }
            }
        }
    }

    parseDataString(string){
        let hexagons = new Map();
        for(let [x, rowData] of string.split("r").entries()){
            let row = new Map();
            for(let [y, hexagonData] of rowData.split("h").entries()){
                if(hexagonData != "E"){
                    let hexagon = new Hexagon(hexagonData, {x: x, y: y}, this);
                    row.set(y, hexagon);
                }
            }
            hexagons.set(x, row);
        }
        return hexagons;
    }

}
