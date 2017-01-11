import {colours, teams} from "./lazyDesign.js";

export default class CombinedSide{
    constructor(game, hexagonInfos){
        if(hexagonInfos.length !== 1 && hexagonInfos.length !== 2){
            console.log("combined side expects to combine 1 or 2 hexagons, not: " . hexagonInfos.length);
        }
        this.hexagonInfos = hexagonInfos;
        this.graphics = game.add.graphics(hexagonInfos[0].hexagon.worldCords.x,hexagonInfos[0].hexagon.worldCords.y);
    }

    //this parameter is pretty gross
    draw(hexPoints){
        this.graphics.clear();
        let colour1 = teams[this.hexagonInfos[0].hexagon.sides[this.hexagonInfos[0].side]].colour;
        if(this.hexagonInfos.length === 1){
           this.graphics.lineStyle(10, colour1, 100);
       }else{
            let colour2 = teams[this.hexagonInfos[1].hexagon.sides[this.hexagonInfos[1].side]].colour;
            this.graphics.lineStyle(10, this.colourCombinations(colour1, colour2));
        }
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
