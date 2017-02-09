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
        this.combinedSides = this.createCombinedLines(this.hexagons);
        //settings.mode instead of this.mode is a horible hack
        settings.mode = mode;
    }

    getHex(x, y){
        if(!this.hexagonExists(x,y)){
            return undefined;
        }else{
            return this.hexagons[x][y];
        }
    }

    get gridWidth(){
        if(this.hexagons.length === 0){
            return 0;
        }else{
            return this.hexagons[0].length;
        }
    }

    get gridHeight(){
        return this.hexagons.length;
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
                    let hexagon2Coordinates = gridNavigation.getAdjacentHexagonCord({x: x, y: y, side: sideNumber});
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
        let hexagons = [];
        for(let [x, rowData] of string.split("r").entries()){
            let row = [];
            for(let [y, hexagonData] of rowData.split("h").entries()){
                let hexagon = new Hexagon(hexagonData, {x: x, y: y}, this);
                row.push(hexagon);
            }
            hexagons.push(row);
        }
        return hexagons;
    }

}
