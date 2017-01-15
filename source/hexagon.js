import {teams} from "./teamInfo.js";
import * as geometry from "./geometry.js";

let lineStyle = {
    thickness: 5,
    alpha: 1
};

let hexStyle = {
    colour: 0xFF33ff,
    spaceFactor: 0.6
};

export function hexagonSettingsGui(gui){
    gui.add(lineStyle, 'thickness', 0,20);
    gui.add(lineStyle, 'alpha', 0, 1);
    gui.addColor(hexStyle, 'colour');
    gui.add(hexStyle, 'spaceFactor', 0, 2);
}

export class Hexagon{
    constructor(outerSideLength, gridCords, game, sides) {
        this.outerSideLength = outerSideLength;
        this.gridCords = gridCords;
        this.game = game;
        this.sides = sides;
        this.image = game.add.sprite(this.worldCords.x, this.worldCords.y);
        this.image.inputEnabled = true;
        let hexagon = this;
        //this isn't pixle perfect, so use in conjuction with polygon hit test?
        //assuming box for this testi is too big, not too small
        this.image.events.onInputDown.add(function(s){
            console.log('clicked');
            hexagon.rotate(1);
        });
        //check Graphics.generateTexture for performance tip
        this.graphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.graphics);
        this.sideGraphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.sideGraphics);
        //look at adding this to a group/image class with the graphics object
        this.hexagonText = this.game.add.text(this.worldCords.x-10, this.worldCords.y-10, this.gridCords.x + "," + this.gridCords.y);
    }

    destroy(){
        this.image.destroy();
        this.hexagonText.destroy();
    }

    get innerSideLength(){
        return this.outerSideLength*hexStyle.spaceFactor;
    }

    refreshPosition(){
        this.image.x = this.worldCords.x;
        this.image.y = this.worldCords.y;
        this.drawHexagon();
        this.hexagonText.x = this.worldCords.x;
        this.hexagonText.y = this.worldCords.y;
    }

    get worldCords(){
        let ySpacing = 2*Math.sin(Math.PI/3)*this.outerSideLength;
        let xSpacing = this.outerSideLength*1.5;
        //plus ones so we don't get cut off by edge of map
        let position =  {
            x: (xSpacing*this.gridCords.x)+this.outerSideLength,
            y: (ySpacing*this.gridCords.y)+(2*Math.sin(Math.PI/3)*this.outerSideLength)
        };
        let isOddColumn = this.gridCords.x%2==1;
        if(isOddColumn){
            position.y -= ySpacing/2;
        }
        return position;
    }

    rotate(amount){
        amount = amount % 6;
        //for anti-clockwise
        if(amount < 0){
            amount = 6-amount;
        }
        for(let i=0;i<amount;i++){
            this.sides.unshift(this.sides.pop());
        }
    }

    drawSides(){
        this.sideGraphics.clear();
        let hexPoints = geometry.relativeScaledHexPoints(this.innerSideLength);
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            let colour = teams[this.sides[sideNumber]].colour;
            this.sideGraphics.lineStyle(lineStyle.thickness, colour, lineStyle.alpha);
            let start = hexPoints[sideNumber];
            this.sideGraphics.moveTo(start.x, start.y);
            let end = hexPoints[(sideNumber+1)%6];
            this.sideGraphics.lineTo(end.x, end.y);
        }
    }

    drawHexagon(){
        this.graphics.clear();
        this.graphics.beginFill(hexStyle.colour);
        this.graphics.drawPolygon(geometry.relativeScaledHexPoints(this.innerSideLength));
        this.graphics.endFill();
        this.hexagonText.font = "arial";
        this.hexagonText.fontSize = 8;
    }
}
