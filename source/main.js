//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

let colours = new Map([
    ["red", 0xff0000],
    ["yellow", 0xebff00],
    ["blue", 0x0000ff],
    ["orange", 0xffb000],
    ["purple", 0xaf00ff],
    ["green", 0x00ff00],
]);

let teams = [
    {
        number: 0,
        colour: colours.get("red")
    },
    {
        number: 1,
        colour: colours.get("yellow")
    },
    {
        number: 2,
        colour: colours.get("blue")
    }
];

function build_hexagon_polygon(sideLength){
    let graphicSideLength = sideLength*0.6;
    let corner_vertical = Math.sin(Math.PI/3)*graphicSideLength;
    let corner_horizontal = Math.cos(Math.PI/3)*graphicSideLength;
    let polygon = new Phaser.Polygon(
        new Phaser.Point(graphicSideLength, 0),
        new Phaser.Point(+corner_horizontal, +corner_vertical),
        new Phaser.Point(-corner_horizontal, +corner_vertical),
        new Phaser.Point(-graphicSideLength, 0),
        new Phaser.Point(-corner_horizontal, -corner_vertical),
        new Phaser.Point(+corner_horizontal, -corner_vertical)
    );
    return {polygon: polygon, height: 2*Math.sin(Math.PI/3)*sideLength};
}

function asign_sides(){
    let sides = [];
    for(let sideNumber = 0; sideNumber < 6; sideNumber++){
        //for non-random sides
        //sides.push(sideNumber%teams.length);
        //for random sides
        sides.push(Math.floor(Math.random()*teams.length));
    }
    return sides;
}

function buildGraphic(game, hexagonX, hexagonY, polygon, x, y){
    let graphics = game.add.graphics(hexagonX, hexagonY);
    graphics.beginFill(0xFF33ff);
    graphics.drawPolygon(polygon.points);
    graphics.endFill();
    var hexagonText = game.add.text(hexagonX-10,hexagonY-10,x+","+y);
    hexagonText.font = "arial";
    hexagonText.fontSize = 8;
    return graphics;
}

function colourCombinations(colour1, colour2){
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

function getSideObjects(x, y, sideLength){
    let corner_vertical = Math.sin(Math.PI/3)*sideLength;
    let corner_horizontal = Math.cos(Math.PI/3)*sideLength;
    let points = [
        {x: -corner_horizontal, y: -corner_vertical},
        {x: +corner_horizontal, y: -corner_vertical},
        {x: sideLength, y: 0},
        {x: +corner_horizontal, y: +corner_vertical},
        {x: -corner_horizontal, y: +corner_vertical},
        {x: -sideLength, y: 0},
    ];
    let sideObjects = [];
    for(let i=0; i<points.length;i++){
        let sideObject = {};
        sideObject.start = points[i];
        sideObject.end = points[(i+1)%points.length];
        sideObject.secondSide = (i + 3)%points.length;
        let secondHexX = [0, 1, 1, 0, -1, -1];
        let secondHexY = [-1, -x%2, 1 - x%2, 1, 1-x%2, -x%2];
        sideObject.secondHex = {x: secondHexX[i], y: secondHexY[i]};
        sideObjects.push(sideObject);
    }
    return sideObjects;
}

function drawLines(game, hexagons){
    let lineGraphics = [];
    for(let x = 0; x < hexagons.length; x++){
        for(let y = 0; y < hexagons[x].length; y++){
            let centerHexagon = hexagons[x][y];
            lineGraphics.push(drawCenterLines(game, centerHexagon, x, y, lineGraphics));
            let lineGraphic = game.add.graphics(centerHexagon.graphic.x,centerHexagon.graphic.y);
            let sideObjects = getSideObjects(x, y, centerHexagon.sideLength);
            for(let sideNumber = 0; sideNumber < 6; sideNumber++){
                let sideObject = sideObjects[sideNumber];
                let hexagon2Coordinates = {"x": x + sideObject.secondHex.x, "y": y + sideObject.secondHex.y};
                let colour1 = teams[centerHexagon.sides[sideNumber]].colour;
                let hexagon2Exists = !(hexagon2Coordinates.x < 0 || hexagon2Coordinates.x >= hexagons.length || hexagon2Coordinates.y < 0 || hexagon2Coordinates.y >= hexagons[x].length);
                if(!hexagon2Exists){
                   lineGraphic.lineStyle(2, colour1, 100);
               }else if(sideNumber < 3){
                    let hexagon2 = hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y];
                    let colour2 = teams[hexagon2.sides[sideObject.secondSide]].colour;
                    lineGraphic.lineStyle(2, colourCombinations(colour1, colour2), 100);
                }else{
                    continue;
                }
                lineGraphic.moveTo(sideObject.start.x, sideObject.start.y);
                lineGraphic.lineTo(sideObject.end.x, sideObject.end.y);
            }
            lineGraphics.push(lineGraphic);
        }
    }
    return lineGraphics;
}

function drawCenterLines(game, centerHexagon, x, y){
    let lineGraphic = game.add.graphics(centerHexagon.graphic.x,centerHexagon.graphic.y);
    let sideObjects = getSideObjects(x, y, centerHexagon.sideLength * 0.6);
    for(let sideNumber = 0; sideNumber < 6; sideNumber++){
        let sideObject = sideObjects[sideNumber];
        let colour = teams[centerHexagon.sides[sideNumber]].colour;
        lineGraphic.lineStyle(2, colour, 100);
        lineGraphic.moveTo(sideObject.start.x, sideObject.start.y);
        lineGraphic.lineTo(sideObject.end.x, sideObject.end.y);
    }
    return lineGraphic;
}

function rotateHexagon(hexagon, amount){
    amount = amount % 6;
    //for anti-clockwise
    if(amount < 0){
        amount = 6-amount;
    }
    for(let i=0;i<amount;i++){
        hexagon.sides.push(hexagon.sides.pop());
    }
}

window.onload = function() {

	let game = new Phaser.Game(640, 480, Phaser.CANVAS, "phaser_parent", {preload: onPreload, create: onCreate});

	let gridSizeX = 10;
	let gridSizeY = 12;
    let lineGraphics = [];
    let hexagons = [];

	function onPreload() {}

	function onCreate() {
	    game.stage.backgroundColor = "#ffffff";
	    for(let x = 0; x < gridSizeX; x++){
            let current_row = [];
            hexagons.push(current_row);
			for(let y = 0; y < gridSizeY; y++){
                let sideLength = 20;
                let {polygon, height: hexagonHeight} = build_hexagon_polygon(sideLength);
                //plus ones so we don't get cut off by edge of map
                let hexagonX = sideLength*(x+1)*1.5;
                let hexagonY = hexagonHeight*(y+1);
                if(x%2==1){
                    hexagonY -= hexagonHeight/2;
                }
                let sides = asign_sides();
                let hexagon = {
                    sideLength: sideLength,
                    graphic: buildGraphic(game, hexagonX, hexagonY, polygon, x, y),
                    polygon: polygon,
                    x: x,
                    y: y,
                    sides: sides
                };
                current_row.push(hexagon);
			}
		}
        drawLines(game, hexagons);
	}
};
