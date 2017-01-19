import {teams} from "./teamInfo.js";
import * as geometry from "./geometry.js";

let lineStyle = {
    thickness: 5,
    alpha: 1
};

let hexStyle = {
    colour: 0xFF33ff
};

export function hexagonSettingsGui(gui){
    gui.add(lineStyle, 'thickness', 0,20);
    gui.add(lineStyle, 'alpha', 0, 1);
    gui.addColor(hexStyle, 'colour');
}

export class Hexagon extends Phaser.Sprite{
    constructor(game, x, y, sideLength, gridCords, sides, inputDownCallback){
        super(game, x, y);
        this.data.sideLength = sideLength;
        this.data.gridCords = gridCords;
        this.data.sidesData = sides;
        this.inputEnabled = true;
        //this isn't pixle perfect, so use in conjuction with polygon hit test?
        //assuming box for this testi is too big, not too small
        this.events.onInputDown.add(inputDownCallback);

        this.data.body = new Phaser.Graphics(game, 0, 0);
        this.addChild(this.data.body);

        this.data.sides = new Phaser.Graphics(game, 0, 0);
        this.addChild(this.data.sides);
        this.data.text = new Phaser.Text(game, -10, -10, this.data.gridCords.x + "," + this.data.gridCords.y);
        //look at adding this to a group/image class with the graphics object
        this.addChild(this.data.text);
    }

    sidesAsString(){
        let sides = [];
        for(let side of this.data.sidesData){
            sides.push(side.number);
        }
        return sides.join(":");
    }

    refreshPositon(x, y, sideLength){
        this.data.sideLength = sideLength;
        this.x = x;
        this.y = y;
    }

    rotate(amount){
        amount = amount % 6;
        //for anti-clockwise
        if(amount < 0){
            amount = 6-amount;
        }
        for(let i=0;i<amount;i++){
            this.data.sidesData.unshift(this.data.sidesData.pop());
        }
    }

    update(){
        this.drawSides();
        this.drawHexagon();
    }

    drawSides(){
        this.data.sides.clear();
        let hexPoints = geometry.relativeScaledHexPoints(this.data.sideLength);
        for(let [sideNumber,side] of this.data.sidesData.entries()){
            this.data.sides.lineStyle(lineStyle.thickness, side.colour, lineStyle.alpha);
            let start = hexPoints[sideNumber];
            this.data.sides.moveTo(start.x, start.y);
            let end = hexPoints[(sideNumber+1)%6];
            this.data.sides.lineTo(end.x, end.y);
        }
    }

    drawHexagon(){
        this.data.body.clear();
        this.data.body.beginFill(hexStyle.colour);
        this.data.body.drawPolygon(geometry.relativeScaledHexPoints(this.data.sideLength));
        this.data.body.endFill();
        this.data.text.font = "arial";
        this.data.text.fontSize = 8;
    }
}
