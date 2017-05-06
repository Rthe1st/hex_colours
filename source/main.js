//if we want to pack phaser in the build
//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
//window.PIXI = require( 'phaser/build/custom/pixi' );
//window.p2 = require( 'phaser/build/custom/p2' );
//window.Phaser = require( 'phaser/build/custom/phaser-split' );

import * as dat from "exdat";//browserify doesn't like dat.gui, plus I don't think the repos from the maintainer anyway
import {hexagonSettingsGui} from "./views/hexagon.js";
import {combinedSideSettingsGui} from "./views/combinedSide.js";
import {boardSettingsGui, Board as BoardView} from "./views/board.js";
import {Board as BoardModel, boardModelSettingsGui} from "./models/board.js";
import * as teamInfo from "./teamInfo.js";
import * as sideGeneration from "./sideGeneration.js";
import {singleSideSettingsGui} from "./views/SingleSide.js";
import {combinedSideGameSettingsGui} from "./models/combinedSide.js";
import {scoreSettingsGui} from "./score.js";

function createBoard(game, dataString){
    if(dataString === undefined){
        let generationFunction = sideGeneration.mappingForDatGui.get(globalParams.sideGeneration);
        dataString = generationFunction(teamInfo.teams, globalParams.gridWidth, globalParams.gridHeight);
    }
    let boardModel = new BoardModel(dataString, "normal", game.settingsGui);
    globalParams.dataString = boardModel.dataString;
    globalParams.sideGeneration = "dataString";
    let boardView = new BoardView(game, 0, 0, boardModel, game.settingsGui);
    game.add.existing(boardView);
    game.boardView = boardView;
}

let globalParams = {
    width: window.innerWidth,
    height: window.innerHeight,
    gridWidth: 5,
    gridHeight: 4,
    sideGeneration: "random",//be nice to store function directly here but doesn't play nice with dat-gui,
    dashBoardWidth: window.innerWidth/10,
    presetLevels: "(0,0)2:2:0:0:1:0|(0,1)0:0:0:2:2:0|(0,2)0:2:2:0:0:1|(0,3)0:0:1:2:0:1|(1,0)2:0:0:0:0:1|(1,1)2:1:2:1:0:2|(1,2)2:1:0:1:1:0|(1,3)0:2:0:0:2:0|(2,0)2:0:0:1:0:2|(2,1)1:0:0:1:2:0|(2,2)2:2:0:2:2:0|(2,3)1:2:0:2:0:2|(3,0)1:2:2:2:0:0|(3,1)1:2:1:0:0:1|(3,2)1:0:0:1:1:0|(3,3)2:0:1:2:0:1|(4,0)0:0:1:0:2:0|(4,1)0:0:1:1:1:0|(4,2)0:2:1:1:0:1|(4,3)0:0:2:0:1:2-0,3,4,0:0,1,1,0:3,0,5,0:2,0,2,0:2,2,5,0:4,1,1,0:1,3,3,0:0,2,3,0:3,2,5,0:3,3,1,0:3,1,3,0"
};

function globalSettingsGui(settingsGui, game){
    let graphicsFolder = settingsGui.addFolder('main graphics');
    graphicsFolder.addColor(game.stage, 'backgroundColor');
    graphicsFolder.add(globalParams, 'width', 0, window.innerWidth).onFinishChange(function(newWidth){
        game.scale.setGameSize(newWidth, game.height);
        game.boardView.updateSideLength();
    });
    graphicsFolder.add(globalParams, 'height', 0, window.innerHeight).onFinishChange(function(newHeight){
        game.scale.setGameSize(game.width, newHeight);
        game.boardView.updateSideLength();
    });
    let mapFolder = settingsGui.addFolder('map setup');
    mapFolder.add(globalParams, 'gridWidth', 0).step(1);
    mapFolder.add(globalParams, 'gridHeight', 0).step(1);
    mapFolder.add(globalParams, 'sideGeneration', ["random", "even", "evenRandom", "dataString"]).listen().onFinishChange(function(genMethod){
        game.boardView.destroy();
        createBoard(game);
    });
    let levels = {
        0: "(0,0)2:2:2:2:2:2|(0,1)2:2:2:2:2:2-0,0,3,0:0,1,3,0",
        1: "(0,0)2:2:0:0:1:0|(0,1)0:0:0:2:2:0|(0,2)0:2:2:0:0:1|(0,3)0:0:1:2:0:1|(1,0)2:0:0:0:0:1|(1,1)2:1:2:1:0:2|(1,2)2:1:0:1:1:0|(1,3)0:2:0:0:2:0|(2,0)2:0:0:1:0:2|(2,1)1:0:0:1:2:0|(2,2)2:2:0:2:2:0|(2,3)1:2:0:2:0:2|(3,0)1:2:2:2:0:0|(3,1)1:2:1:0:0:1|(3,2)1:0:0:1:1:0|(3,3)2:0:1:2:0:1|(4,0)0:0:1:0:2:0|(4,1)0:0:1:1:1:0|(4,2)0:2:1:1:0:1|(4,3)0:0:2:0:1:2-0,3,4,0"
    };
    mapFolder.add(globalParams, 'presetLevels', levels).listen().onFinishChange(function(newDataString){
        game.boardView.destroy();
        createBoard(game, newDataString);
    });
    //this cant point to board.dataString because dat-gui doesn't work with getters/setters
    mapFolder.add(globalParams, 'dataString').listen().onFinishChange(function(newDataString){
        game.boardView.destroy();
        createBoard(game, newDataString);
    });
}

function onCreate(game) {
    game.stage.backgroundColor = "#666666";//consider grey because less contrast
    let settingsGui = new dat.GUI();
    game.settingsGui = settingsGui;
    createBoard(game);
    combinedSideGameSettingsGui(settingsGui);
    globalSettingsGui(settingsGui, game);
    boardSettingsGui(settingsGui, game);
    hexagonSettingsGui(settingsGui);
    combinedSideSettingsGui(settingsGui);
    teamInfo.teamInfoSettingsGui(settingsGui);
    singleSideSettingsGui(settingsGui);
    scoreSettingsGui(settingsGui);
    boardModelSettingsGui(settingsGui);
}
function update(game){}
window.onload = function() {
	let game = new Phaser.Game(globalParams.width, globalParams.height, Phaser.CANVAS, "phaser_parent", {create: onCreate, update: update});
};
