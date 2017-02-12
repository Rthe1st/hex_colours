import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";
import {Dashboard} from "./dashboard.js";
import * as teamInfo from "../teamInfo.js";

let boardSettings = {
    spaceFactor: 0.6,
    sideLength: 10
};

export function boardSettingsGui(gui, game){
    let boardView = gui.addFolder('board view');
    boardView.add(boardSettings, 'spaceFactor', 0, 2);
}

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

export class Board extends Phaser.Sprite{
    //passing in x is even more reason to make this a phaser object
    constructor(game, x, y, model, gui, sideLength){
        super(game, x, y);
        this.data.model = model;
        this.data.dashboard = new Dashboard(game, 0, 0, 200, teamInfo, this.data.model);
        this.addChild(this.data.dashboard);
        if(sideLength === undefined){
            sideLength = this.defaultSideLength;
        }
        this.data.sideLength = sideLength;
        this.data.gui = gui;
        this.data.sideLengthGui = gui.add(this.data, 'sideLength', sideLength*0.5, sideLength*2);
        this.hexagons = [];
        this.data.gameBoardGroup = new Phaser.Group(game, this);
        this.data.gameBoardGroup.x = this.data.dashboard.data.width;
        //should put hex veiws in their own group
        for(const hexModel of model.hexArray){
            let worldCords = this.calculateWorldCords(hexModel.gridCords);
            let hexagon = new Hexagon(game, worldCords.x, worldCords.y, this, model.hexagonInput, hexModel);
            this.data.gameBoardGroup.addChild(hexagon);
            this.hexagons.push(hexagon);
        }
        this.combinedSides = [];
        for(let combModel of model.combinedSidesArray){
            let worldCords = this.calculateWorldCords(combModel.cords);
            let combinedSide = new CombinedSide(game, worldCords.x, worldCords.y, this, combModel);
            this.data.gameBoardGroup.addChild(combinedSide);
            this.combinedSides.push(combinedSide);
        }
    }

    destroy(destroyChildren, destroyTexture){
        this.data.gui.remove(this.data.sideLengthGui);
        super.destroy(destroyChildren, destroyTexture);
    }

    get defaultSideLength(){
        return calculateSideLength(this.game.width-this.data.dashboard.width, this.game.height, this.data.model.gridWidth, this.data.model.gridHeight);
    }

    get innerSideLength(){
        return boardSettings.spaceFactor*this.data.sideLength;
    }

    get outerSideLength(){
        return this.data.sideLength;
    }

    update(){
        for(let hexagon of this.hexagons){
            hexagon.update();
        }
        for(let combinedSide of this.combinedSides){
            combinedSide.update();
        }
        this.data.dashboard.update();
    }

    updateSideLength(sideLength){
        if(sideLength === undefined){
            sideLength = this.defaultSideLength;
        }
        this.data.sideLength = sideLength;
    }

    calculateWorldCords(gridCords){
        let spacingSideLength = this.data.sideLength;
        let ySpacing = 2*Math.sin(Math.PI/3)*spacingSideLength;
        let xSpacing = spacingSideLength*1.5;
        //plus ones so we don't get cut off by edge of map
        let position =  {
            x: (xSpacing*gridCords.x)+spacingSideLength,
            y: (ySpacing*gridCords.y)+(2*Math.sin(Math.PI/3)*spacingSideLength)
        };
        let isOddColumn = gridCords.x%2==1;
        if(isOddColumn){
            position.y -= ySpacing/2;
        }
        return position;
    }
}
