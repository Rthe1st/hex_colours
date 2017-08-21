import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";
import * as teamInfo from "../teamInfo.js";
import * as gridNavigation from "../gridNavigation.js";
import * as score from '../score.js';
import {Character} from "./Character.js";

let settings = {
    mode: 'home',
    mapEdit: false
};

export function boardModelSettingsGui(gui){
    let boardFolder = gui.addFolder('board');
    boardFolder.add(settings, 'mode', ['home', 'normal']);
    boardFolder.add(settings, 'mapEdit');
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

    destroyHex(x, y){
        this.hexagons.get(x).delete(y);
        for(let side=0; side<6; side++){
            let combinedSide = this.getCombinedSide({x: x, y: y, side: side});
            let alternativeCords = combinedSide.alternativeCords;
            if(!this.hexagonExists(x, y) && !this.hexagonExists(alternativeCords.x, alternativeCords.y)){
                this.combinedSides.get(combinedSideCord.x).get(combinedSideCord.y).delete(combinedSideCord.side);
            }
        }
    }

    destroyCombinedSide(combinedSideCord){
        this.combinedSides.get(combinedSideCord.x).get(combinedSideCord.y).delete(combinedSideCord.side);
    }

    selectSection(singleSide){
        let connectionSet = score.getConnectionSet(singleSide, singleSide.team, this);
        this.selected = connectionSet;
    }

    currentStateScore(team){
        if(settings.mode == "home"){
            return score.allTeamHomeMode(this, team).score;
        }else{
            return score.allTeamScore(this, team).score;
        }
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

    get characterArray(){
        let characterArray = [];
        for(const characterRow of this.characters.values()){
            for(const characterHex of characterRow.values()){
                characterArray = characterArray.concat(Array.from(characterHex.values()));
            }
        }
        return characterArray;
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
        let hexagons = [];
        for(let x of Array.from(this.hexagons.keys()).sort()){
            for(let y of Array.from(this.hexagons.get(x).keys()).sort()){
                hexagons.push("(" + x + "," + y + ")" + this.getHex(x,y).sidesAsString());
            }
        }
        let characters = [];
        for(let x of Array.from(this.characters.keys()).sort()){
            for(let y of Array.from(this.characters.get(x).keys()).sort()){
                for(let side of Array.from(this.characters.get(x).get(y).keys()).sort()){
                    let character = this.characters.get(x).get(y).get(side);
                    characters.push([character.x, character.y, character.side, character.team.number].join(","));
                }
            }
        }
        return hexagons.join("|") + "-" + characters.join(":");
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
    hexagonInput(clickedHexagon, pointer){
        if(settings.mapEdit){
            this.destroyHex(clickedHexagon.data.model.x, clickedHexagon.data.model.y);
            //clickedHexagon.game.world.remove(clickedHexagon);
            clickedHexagon.kill();
            //clickedHexagon.destroy();
        }else{
            teamInfo.makeMove();
            let rotationAmt
            if(clickedHexagon.data.model.rotation === "right"){
                rotationAmt = 1;
            }else if(clickedHexagon.data.model.rotation === "left"){
                rotationAmt = -1;
            }else if(clickedHexagon.data.model.rotation ==="both"){
                //using ctrlKey instead has a bug in phaser 2.6.2 https://github.com/photonstorm/phaser/issues/2167
                if(pointer.leftButton.altKey){
                    rotationAmt = -1;
                }else{
                    rotationAmt = 1;
                }
            }
            clickedHexagon.data.model.rotate(rotationAmt);
            if(teamInfo.endOfRound()){
                for(let team of teamInfo.teams){
                    if(settings.mode == "home"){
                        team.score += score.allTeamHomeMode(this, team).score;
                    }else{
                        team.score += score.allTeamScore(this, team).score;
                    }
                }
            }
            this.checkWinCondition();
        }
    }

    checkWinCondition(){
        let teamCords = new Map();
        for(let character of this.characterArray){
            if(!teamCords.has(character.team)){
                teamCords.set(character.team, character.cords);
            }else{
                let alreadySeenCords = teamCords.get(character.team);
                if(!this.getCombinedSide(alreadySeenCords).equals(character.cords)){
                    return false;
                }
            }
        }
        alert("you won!");
        return true;
    }

    characterInput(clickedCharacter, pointer){
        if(settings.mapEdit){
            //this.characters.get(x).delete(y);
            //this.destroyHex(clickedHexagon.data.model.x, clickedHexagon.data.model.y);
            clickedCharacter.kill();
        }
    }

    parseGridCords(cordData){
        let withoutBrackets = cordData.substring(1,cordData.length-1);
        let [x,y] = withoutBrackets.split(",");
        return {x: parseInt(x), y: parseInt(y)};
    }

    parseDataString(dataString){
        let [hexagonsData, characterData] = dataString.split("-");
        let hexagons = new Map();
        for(let hexagonData of hexagonsData.split("|")){
            if(hexagonData == "E"){
                continue;
            }
            let [cordData, sideData, ...rest] = hexagonData.split(")");
            let cords = this.parseGridCords(cordData + ")");
            if(hexagons.get(cords.x) === undefined){
                hexagons.set(cords.x, new Map());
            }
            hexagons.get(cords.x).set(cords.y, new Hexagon(sideData, cords, this));
        }
        this.hexagons = hexagons;
        this.characters = this.parseCharacters(characterData);
        return hexagons;
    }

    parseCharacters(characterData){
        let characters = new Map();
        if(characterData === ""){
            return characters;
        }
        for(let characterCord of characterData.split(":")){
            let [x, y, side, team] = characterCord.split(",").map(Number);
            if(characters.get(x) === undefined){
                characters.set(x, new Map());
            }
            let characterColumn = characters.get(x);
            if(characterColumn.get(y) === undefined){
                characterColumn.set(y, new Map());
            }
            let characterHex = characterColumn.get(y);
            let character = new Character(this, {x: x, y: y, side: side}, teamInfo.teams[team]);
            characterHex.set(side, character);
        }
        return characters;
    }

}
