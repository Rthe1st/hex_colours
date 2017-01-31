import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";

let boardSettings = {
    spaceFactor: 0.6
};

export function boardSettingsGui(gui, game){
    gui.add(boardSettings, 'spaceFactor', 0, 2);
}

export class Board extends Phaser.Sprite{
    //passing in x is even more reason to make this a phaser object
    constructor(game, x, y, sideLength, model, gui){
        super(game, x, y);
        this.data.sideLength = sideLength;
        this.hexagons = [];
        for(const hexModel of model.hexArray){
            let worldCords = this.calculateWorldCords(hexModel.gridCords);
            let hexagon = new Hexagon(game, worldCords.x, worldCords.y, this, model.hexagonInput, hexModel);
            this.addChild(hexagon);
            this.hexagons.push(hexagon);
        }
        this.combinedSides = [];
        for(let combModel of model.combinedSides){
            let worldCords = this.calculateWorldCords(combModel.cords);
            let combinedSide = new CombinedSide(game, worldCords.x, worldCords.y, this, combModel);
            this.addChild(combinedSide);
            this.combinedSides.push(combinedSide);
        }
        gui.add(this.data, 'sideLength', sideLength*0.5, sideLength*2);
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
    }

    updateSideLength(sideLength){
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
