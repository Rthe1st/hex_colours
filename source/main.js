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
    let corner_vertical = Math.sin(Math.PI/3)*sideLength;
    let corner_horizontal = Math.cos(Math.PI/3)*sideLength;
    let hexagonWidth = 2*sideLength;
    let hexagonHeight = 2*corner_vertical;
    let polygon = new Phaser.Polygon(
        new Phaser.Point(sideLength, 0),
        new Phaser.Point(+corner_horizontal, +corner_vertical),
        new Phaser.Point(-corner_horizontal, +corner_vertical),
        new Phaser.Point(-sideLength, 0),
        new Phaser.Point(-corner_horizontal, -corner_vertical),
        new Phaser.Point(+corner_horizontal, -corner_vertical)
    );
    return {polygon: polygon, width: hexagonWidth, height: hexagonHeight};
}

function asign_sides(){
    let sides = new Map();
    for(let sideNumber = 0; sideNumber < 6; sideNumber++){
        //for non-random sides
        sides.set(sideNumber, sideNumber%teams.length);
        //for random sides
        //sides.set(sideNumber, Math.floor(Math.random()*teams.length));
    }
    return sides;
}

function buildGraphic(game, hexagonX, hexagonY, sides, polygon, sideLength, x, y){
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

function drawLines(game, hexagons){
    for(let x = 0; x < hexagons.length; x++){
        for(let y = 0; y < hexagons[x].length; y++){
            let centerHexagon = hexagons[x][y];
            let corner_vertical = Math.sin(Math.PI/3)*centerHexagon.sideLength;
            let corner_horizontal = Math.cos(Math.PI/3)*centerHexagon.sideLength;
            let lineGraphics = game.add.graphics(centerHexagon.graphic.x,centerHexagon.graphic.y);
            let sideObjects = [
                {
                    start: {x: -corner_horizontal, y: -corner_vertical},
                    end: {x: +corner_horizontal, y: -corner_vertical},
                    secondHex: {x: 0,  y: -1},
                    secondSide: 3
                },
                {
                    start: {x: +corner_horizontal,  y: -corner_vertical},
                    end: {x: centerHexagon.sideLength, y: 0},
                    secondHex: {x: +1, y: x%2},
                    secondSide: 4
                },
                {
                    start: {x: centerHexagon.sideLength, y: 0},
                    end: {x: +corner_horizontal, y: +corner_vertical},
                    secondHex: {x: +1, y: 1- x%2},
                    secondSide: 5
                },
                {
                    start: {x: +corner_horizontal, y: +corner_vertical},
                    end: {x: -corner_horizontal, y: +corner_vertical},
                    secondHex: {x: +0, y: +1},
                    secondSide: 0
                },
                {
                    start: {x: -corner_horizontal,  y: +corner_vertical},
                    end: {x: -centerHexagon.sideLength, y: 0},
                    secondHex: {x: -1, y: 1- x%2},
                    secondSide: 1
                },
                {
                    start: {x: -centerHexagon.sideLength, y: 0},
                    end: {x: -corner_horizontal, y: -corner_vertical},
                    secondHex: {x: -1, y: x%2},
                    secondSide: 2
                }
            ];
            let teamColors = [colours.get("red"), colours.get("yellow"), colours.get("blue")];
            for(let sideNumber = 0; sideNumber < 6; sideNumber++){
                let sideObject = sideObjects[sideNumber];
                let hexagon2Coordinates = {"x": x + sideObject.secondHex.x, "y": y + sideObject.secondHex.y};
                let colour1 = teams[centerHexagon.sides.get(sideNumber)].colour;
                if(hexagon2Coordinates.x < 0 || hexagon2Coordinates.x >= hexagons.length ||
                   hexagon2Coordinates.y < 0 || hexagon2Coordinates.y >= hexagons[x].length){
                   lineGraphics.lineStyle(2, colour1, 100);
               }else if(sideNumber < 3){
                    let hexagon2 = hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y];
                    let colour2 = teams[hexagon2.sides.get(sideObject.secondSide)].colour;
                    lineGraphics.lineStyle(2, colourCombinations(colour1, colour2), 100);
                }else{
                    continue;
                }
                lineGraphics.moveTo(sideObject.start.x, sideObject.start.y);
                lineGraphics.lineTo(sideObject.end.x, sideObject.end.y);
            }
        }
    }
}

window.onload = function() {

	let game = new Phaser.Game(640, 480, Phaser.CANVAS, "phaser_parent", {preload: onPreload, create: onCreate});

	let gridSizeX = 10;
	let gridSizeY = 12;

	function onPreload() {}

	function onCreate() {
	    game.stage.backgroundColor = "#ffffff";
        let hexagons = [];
	    for(let x = 0; x < gridSizeX; x++){
            let current_row = [];
            hexagons.push(current_row);
			for(let y = 0; y < gridSizeY; y++){
                let sideLength = 20;
                let {polygon, width: hexagonWidth, height: hexagonHeight} = build_hexagon_polygon(sideLength);
                //plus ones so we don't get cut off by edge of map
                let hexagonX = sideLength*(x+1)*1.5;
                let hexagonY = hexagonHeight*(y+1);
                if(x%2==1){
                    hexagonY -= hexagonHeight/2;
                }
                let sides = asign_sides();
                let hexagon = {
                    sideLength: sideLength,
                    graphic: buildGraphic(game, hexagonX, hexagonY, sides, polygon, sideLength, x, y),
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
