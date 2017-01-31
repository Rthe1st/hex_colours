//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

import dat from "dat-gui";
import {hexagonSettingsGui} from "./views/hexagon.js";
import {combinedSideSettingsGui} from "./views/combinedSide.js";
import {boardSettingsGui, Board as BoardView} from "./views/board.js";
import {Board as BoardModel} from "./models/board.js";
import * as teamInfo from "./teamInfo.js";
import * as sideGeneration from "./sideGeneration.js";
import * as dashboard from "./views/dashboard.js";

//this doesnt work properly
function calculateSideLength(width, height, gridWidth, gridHeight){
    let boardWidth = (1.5*gridWidth)+1;
    let boardHeight = (2*Math.sin(Math.PI/3)*gridHeight)+(1.5*Math.sin(Math.PI/3));
    if(boardWidth > boardHeight){
        return width/(1.5*gridWidth+1);
    }else{
        return height/((2*Math.sin(Math.PI/3)*gridHeight)+(1.5*Math.sin(Math.PI/3)));
    }
}

function defaultSideLength(){
    return calculateSideLength(globalParams.width-globalParams.dashBoardWidth, globalParams.height, globalParams.gridWidth, globalParams.gridHeight);
}

function createBoard(game, dataString){
    if(dataString === undefined){
        let generationFunction = sideGeneration.mappingForDatGui.get(globalParams.sideGeneration);
        dataString = generationFunction(teamInfo.teams, globalParams.gridWidth, globalParams.gridHeight);
    }
    let boardModel = new BoardModel(dataString);
    globalParams.dataString = boardModel.dataString;
    globalParams.sideGeneration = "dataString";
    let boardView = new BoardView(game, globalParams.dashBoardWidth, 0, defaultSideLength(), boardModel, game.settingsGui);
    game.add.existing(boardView);
    game.boardView = boardView;
}

function createDashboard(game){
    let dashboardInstance = new dashboard.Dashboard(game, 100, 0, globalParams.dashBoardWidth, teamInfo);
    game.add.existing(dashboardInstance);
    game.dashboardView = dashboardInstance;
}

let globalParams = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridWidth: 2,
    gridHeight: 2,
    sideGeneration: "random",//be nice to store function directly here but doesn't play nice with dat-gui,
    dashBoardWidth: window.innerWidth/10,
};

function globalSettingsGui(settingsGui, game){
    settingsGui.addColor(game.stage, 'backgroundColor');
    settingsGui.add(globalParams, 'width', 0, window.innerWidth).onFinishChange(function(newWidth){
        game.scale.setGameSize(newWidth, game.height);
        game.boardView.updateSideLength(defaultSideLength());
    });
    settingsGui.add(globalParams, 'height', 0, window.innerHeight).onFinishChange(function(newHeight){
        game.scale.setGameSize(game.width, newHeight);
        game.boardView.updateSideLength(defaultSideLength());
    });
    settingsGui.add(globalParams, 'gridWidth', 0).step(1);
    settingsGui.add(globalParams, 'gridHeight', 0).step(1);
    settingsGui.add(globalParams, 'sideGeneration', ["random", "even", "dataString"]).listen().onFinishChange(function(genMethod){
        game.boardView.destroy();
        createBoard(game);
    });
    //this cant point to board.dataString because dat-gui doesn't work with getters/setters
    settingsGui.add(globalParams, 'dataString').listen().onFinishChange(function(newDataString){
        game.boardView.destroy();
        createBoard(game, newDataString);
    });
    settingsGui.add(globalParams, 'dashBoardWidth', 0, window.innerWidth).onFinishChange(function(newWidth){
        game.boardView.x = newWidth;
        game.dashboardView.destroy();
        createDashboard(game);
    });
}

function onCreate(game) {
    game.stage.backgroundColor = "#000000";//consider grey because less contrast
    let settingsGui = new dat.GUI();
    game.settingsGui = settingsGui;
    createBoard(game);
    createDashboard(game);
    globalSettingsGui(settingsGui, game);
    boardSettingsGui(settingsGui, game);
    hexagonSettingsGui(settingsGui);
    combinedSideSettingsGui(settingsGui);
    teamInfo.teamInfoSettingsGui(settingsGui);
}
function update(game){}
window.onload = function() {
	let game = new Phaser.Game(globalParams.width, globalParams.height, Phaser.CANVAS, "phaser_parent", {create: onCreate, update: update});
};
