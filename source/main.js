//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

import dat from "dat-gui";

import Board from "./board.js";

function calculateSideLength(width, height, gridWidth, gridHeight){
    if(width < height){
        return width/((gridWidth+1)*1.5);
    }else{
        return height/((gridHeight+1)*2*Math.sin(Math.PI/3));
    }
}

window.onload = function() {

    this.intTest = 5;
    this.boolTest = true;

    var gui = new dat.GUI();
    gui.add(this, 'intTest', -5, 5);
    gui.add(this, 'boolTest');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let gridWidth = 5;
	let gridHeight = 3;
    let spaceFactor = 0.6;

	let game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.CANVAS, "phaser_parent", {preload: onPreload, create: onCreate, update: update, render: render});

    let board;

	function onPreload() {}

	function onCreate() {
	    game.stage.backgroundColor = "#000000";//consider grey because less contrast
        let sideLength = calculateSideLength(width, height, gridWidth, gridHeight);
        board = new Board(game, gridWidth, gridHeight, sideLength, spaceFactor);
	}

    function update(){
        //todo: have combinedSides listen for rotation of their hexagons
        //then we only have to update those effected by the rotation
        for(let row of board.hexagons){
            for(let hexagon of row){
                if(hexagon.dirty){
                    hexagon.drawSides();
                    //for "across hex" mode
                    //hexagon.drawSides();
                    hexagon.dirty = false;
                }
            }
        }
        for(let combinedSide of board.combinedSides){
            //comment out for "across hex"
            combinedSide.draw();
        }
    }

    function render(){}
};
