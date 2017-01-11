//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

import Hexagon from "./hexagon.js";
import CombinedSide from "./combinedSide.js";

function getSpaceHexPoints(sideLength){
    let corner_vertical = Math.sin(Math.PI/3)*sideLength;
    let corner_horizontal = Math.cos(Math.PI/3)*sideLength;
    return [
        {x: -corner_horizontal, y: -corner_vertical},
        {x: +corner_horizontal, y: -corner_vertical},
        {x: sideLength, y: 0},
        {x: +corner_horizontal, y: +corner_vertical},
        {x: -corner_horizontal, y: +corner_vertical},
        {x: -sideLength, y: 0}
    ];
}

function getAdjacentHexagonOffset(gridX, side){
    //even column: odd column:
    //*a*          aaa
    //aha          aha
    //aaa          *a*
    let diagonalYAbove = gridX%2;
    let diagonalYBelow = gridX%2-1;
    //assumes side 0 is top, increasing clockwise
    let adjacentHexOffset = [
        {x: 0, y: -1}, {x: 1, y: -gridX%2}, {x: 1, y: 1-gridX%2},
        {x: 0, y: 1}, {x: -1, y: 1-gridX%2}, {x: -1, y: -gridX%2}
    ];
    return adjacentHexOffset[side];
}

function createCombinedLines(game, hexagons){
    let combinedSides = [];
    for(let x = 0; x < hexagons.length; x++){
        for(let y = 0; y < hexagons[x].length; y++){
            let centerHexagon = hexagons[x][y];
            for(let sideNumber = 0; sideNumber < 6; sideNumber++){
                let hexInfo = [{
                    hexagon: centerHexagon,
                    side: sideNumber
                }];
                let adjacentHexOffset = getAdjacentHexagonOffset(x, sideNumber);
                let hexagon2Coordinates = {x: x + adjacentHexOffset.x, y: y + adjacentHexOffset.y};
                let hexagon2Exists = !(hexagon2Coordinates.x < 0 || hexagon2Coordinates.x >= hexagons.length || hexagon2Coordinates.y < 0 || hexagon2Coordinates.y >= hexagons[x].length);
                if(!hexagon2Exists){
                    combinedSides.push(new CombinedSide(game, hexInfo));
                }else if(sideNumber < 3){
                   //sides numbered above 3 are covered whn we iterate over the other hexagon (so we don't create every combine twice)
                   hexInfo.push({
                       hexagon: hexagons[hexagon2Coordinates.x][hexagon2Coordinates.y],
                       side: (sideNumber + 3) % 6
                   });
                   console.log("center hex");
                   console.log(centerHexagon.gridCords);
                   console.log("side: " + sideNumber);
                   console.log("hex2");
                   console.log(hexagon2Coordinates);
                   console.log("side: " + ((sideNumber + 3) % 6));
                    combinedSides.push(new CombinedSide(game, hexInfo));
                }else{
                    continue;
                }
            }
        }
    }
    return combinedSides;
}

function createGrid(game, gridSizeX, gridSizeY, sideLength, spaceFactor){
    let hexagons = [];
    for(let x = 0; x < gridSizeX; x++){
        let current_row = [];
        hexagons.push(current_row);
        for(let y = 0; y < gridSizeY; y++){
            let hexagon = new Hexagon(sideLength, {x: x, y: y}, spaceFactor, game);
            hexagon.drawHexagonSides(getSpaceHexPoints(sideLength*spaceFactor));
            //for "across hex" mode
            //hexagon.drawHexagonSides(getSpaceHexPoints(sideLength));
            current_row.push(hexagon);
        }
    }
    return hexagons;
}

window.onload = function() {

    let width = 1000;
    let height = 480;

	let game = new Phaser.Game(width, height, Phaser.CANVAS, "phaser_parent", {preload: onPreload, create: onCreate, update: update, render: render});

	let gridSizeX = 5;
	let gridSizeY = 3;
    let lineGraphics = [];
    let hexagons = [];
    let i=0;
    let sideLength;
    if(width < height){
        sideLength = width/((gridSizeX+1)*1.5);
    }else{
        sideLength = height/((gridSizeY+1)*2*Math.sin(Math.PI/3));
    }

    let spaceFactor = 0.6;
    let combinedSides = [];

	function onPreload() {}

	function onCreate() {
	    game.stage.backgroundColor = "#000000";//consider grey because less contrast
        hexagons = createGrid(game, gridSizeX, gridSizeY, sideLength, spaceFactor);
        combinedSides = createCombinedLines(game, hexagons);
	}

    function update(){
        i++;
        if(i%10===0){
            console.log("1 in 100 update");
            let hexagon = hexagons[Math.floor(Math.random()*gridSizeX)][Math.floor(Math.random()*gridSizeY)];
            //hexagon.rotate(1);
            //hexagon.drawHexagonSides(getSpaceHexPoints(sideLength));
            //todo: have combinedSides listen for rotation of their hexagons
            //then we can only update those effected by the rotation
            for(let row of hexagons){
                for(let hexagon of row){
                    if(hexagon.dirty){
                        hexagon.drawHexagonSides(getSpaceHexPoints(sideLength*spaceFactor));
                        //for "across hex" mode
                        //hexagon.drawHexagonSides(getSpaceHexPoints(sideLength));
                        hexagon.dirty = false;
                    }
                }
            }
            for(let combinedSide of combinedSides){
                //comment out for "across hex"
                combinedSide.draw(getSpaceHexPoints(sideLength));
            }
        }
    }

    function render(){}
};
