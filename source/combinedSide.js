import {colours, teams} from "./lazyDesign.js";
import * as geometry from "./geometry.js";

let lineStyle = {
    thickness: 5,
    alpha: 1
};

export function combinedSideSettingsGui(gui){
    gui.add(lineStyle, 'thickness', 0,20);
    gui.add(lineStyle, 'alpha', 0, 1);
}

export class CombinedSide{
    constructor(game, hexagonInfos, length){
        if(hexagonInfos.length !== 1 && hexagonInfos.length !== 2){
            console.log("combined side expects to combine 1 or 2 hexagons, not: " . hexagonInfos.length);
        }
        this.length = length;
        this.hexagonInfos = hexagonInfos;
        this.graphics = game.add.graphics(this.worldCords.x,this.worldCords.y);
    }

    destroy(){
        this.graphics.destroy();
    }

    refreshPosition(){
        this.graphics.x = this.worldCords.x;
        this.graphics.y = this.worldCords.y;
    }

    get worldCords(){
        //all calulates are done relative to first hexagon
        return this.hexagonInfos[0].hexagon.worldCords;
    }

    draw(){
        this.graphics.clear();
        let colour = teams[this.hexagonInfos[0].hexagon.sides[this.hexagonInfos[0].side]].colour;
        if(this.hexagonInfos.length === 2){
            let secondColour = teams[this.hexagonInfos[1].hexagon.sides[this.hexagonInfos[1].side]].colour;
            colour = this.colourCombinations(colour, secondColour);
        }
        this.graphics.lineStyle(lineStyle.thickness, colour, lineStyle.alpha);
        let hexPoints = geometry.relativeScaledHexPoints(this.length);
        let start = hexPoints[this.hexagonInfos[0].side];
        this.graphics.moveTo(start.x, start.y);
        let end = hexPoints[(this.hexagonInfos[0].side+1)%6];
        //keep this as possible alternative, cause it looked cool
        //probably be better if this was done on the hexagon sides and combine sides ignore in that mode
        //let end = hexPoints[this.hexagonInfos[1].side];
        this.graphics.lineTo(end.x, end.y);
    }

    colourCombinations(colour1, colour2){
        let coloursToCombine = [colour1, colour2];
        if(colour1 === colour2){
            return colour1;
        }else if(coloursToCombine.includes(colours.get("red")) && coloursToCombine.includes(colours.get("yellow"))){
            return colours.get("orange");
        }else if(coloursToCombine.includes(colours.get("red")) && coloursToCombine.includes(colours.get("blue"))){
            return colours.get("purple");
        }else if(coloursToCombine.includes(colours.get("yellow")) && coloursToCombine.includes(colours.get("blue"))){
            return colours.get("green");
        }else{
            console.log("error, not colour combination availible");
            console.log(colour1);
            console.log(colour2);
        }
    }
}
