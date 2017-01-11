import {teams} from "./lazyDesign.js";

export default class Hexagon{
    constructor(sideLength, gridCords, spaceFactor, game) {
        this.sideLength = sideLength;
        this.gridCords = gridCords;
        this.game = game;
        let {polygon} = this.buildHexagonPolygon(this.sideLength*spaceFactor);
        this.polygon = polygon;
        let hexagonHeight = 2*Math.sin(Math.PI/3)*sideLength;
        //plus ones so we don't get cut off by edge of map
        this.worldCords = {
            x: sideLength*(gridCords.x+1)*1.5,
            y: hexagonHeight*(gridCords.y+1)
        };
        if(this.gridCords.x%2==1){
            this.worldCords.y -= hexagonHeight/2;
        }
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
        this.buildGraphic();
        this.sideGraphics = new Phaser.Graphics(game, 0, 0);
        this.image.addChild(this.sideGraphics);
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

    buildHexagonPolygon(sideLength){
        let corner_vertical = Math.sin(Math.PI/3)*sideLength;
        let corner_horizontal = Math.cos(Math.PI/3)*sideLength;
        let polygon = new Phaser.Polygon(
            new Phaser.Point(-corner_horizontal, -corner_vertical),
            new Phaser.Point(+corner_horizontal, -corner_vertical),
            new Phaser.Point(sideLength, 0),
            new Phaser.Point(+corner_horizontal, +corner_vertical),
            new Phaser.Point(-corner_horizontal, +corner_vertical),
            new Phaser.Point(-sideLength, 0)
        );
        return {polygon: polygon, height: 2*Math.sin(Math.PI/3)*sideLength};
    }

    drawHexagonSides(hexPoints){
        this.sideGraphics.clear();
        for(let sideNumber = 0; sideNumber < 6; sideNumber++){
            let colour = teams[this.sides[sideNumber]].colour;
            this.sideGraphics.lineStyle(5, colour, 100);
            let start = hexPoints[sideNumber];
            this.sideGraphics.moveTo(start.x, start.y);
            let end = hexPoints[(sideNumber+1)%6];
            //for "across hex" mode
            //let end = hexPoints[(sideNumber+3)%6];
            this.sideGraphics.lineTo(end.x, end.y);
        }
    }

    buildGraphic(){
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
