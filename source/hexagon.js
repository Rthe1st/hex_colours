import {teams} from "./lazyDesign.js";
import * as geometry from "./geometry.js";

export default class Hexagon{
    constructor(outerSideLength, gridCords, innerSideLength, game) {
        this.outerSideLength = outerSideLength;
        this.innerSideLength = innerSideLength;
        this.gridCords = gridCords;
        this.game = game;
        this.polygon = new Phaser.Polygon(geometry.relativeScaledHexPoints(this.innerSideLength));
        this.sides = this.assignSides(teams);
        this.image = game.add.image(this.worldCords.x, this.worldCords.y);
        this.image.inputEnabled = true;
        let hexagon = this;
        //this isn't pixle perfect, so use in conjuction with polygon hit test?
        //assuming box for this testi is too big, not too small
        this.image.events.onInputDown.add(function(s){
            console.log('clicked');
            hexagon.rotate(1);
            hexagon.dirty = true;
        });
        //check Graphics.generateTexture for performance tip
        this.graphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.graphics);
        this.sideGraphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.sideGraphics);
        this.drawHexagon();
    }

    refreshPosition(){
        this.image.moveTo(this.worldCords.x,this.worldCords.y);
    }

    get worldCords(){
        let ySpacing = 2*Math.sin(Math.PI/3)*this.outerSideLength;
        let xSpacing = this.outerSideLength*1.5;
        //plus ones so we don't get cut off by edge of map
        let position =  {
            x: xSpacing*(this.gridCords.x+1),
            y: ySpacing*(this.gridCords.y+1)
        };
        let isOddColumn = this.gridCords.x%2==1;
        if(isOddColumn){
            position.y -= ySpacing/2;
        }
        return position;
    }

    assignSides(teams){
        let sides = [];
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            //for non-random sides
            //sides.push(sideNumber%teams.length);
            //for random sides
            sides.push(Math.floor(Math.random()*teams.length));
        }
        return sides;
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
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            let colour = teams[this.sides[sideNumber]].colour;
            this.sideGraphics.lineStyle(5, colour, 100);
            let hexPoints = geometry.relativeScaledHexPoints(this.innerSideLength);
            let start = hexPoints[sideNumber];
            this.sideGraphics.moveTo(start.x, start.y);
            let end = hexPoints[(sideNumber+1)%6];
            //for "across hex" mode
            //let end = hexPoints[(sideNumber+3)%6];
            this.sideGraphics.lineTo(end.x, end.y);
        }
    }

    drawHexagon(){
        this.graphics.clear();
        this.graphics.beginFill(0xFF33ff);
        this.graphics.drawPolygon(this.polygon.points);
        this.graphics.endFill();
        //look at adding this to a group/image class with the graphics object
        var hexagonText = this.game.add.text(this.worldCords.x-10, this.worldCords.y-10, this.gridCords.x + "," + this.gridCords.y);
        hexagonText.font = "arial";
        hexagonText.fontSize = 8;
    }
}
