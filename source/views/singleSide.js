import * as geometry from "../geometry.js";

let lineStyle = {
    thickness: 5,
    alpha: 1
};

export function singleSideSettingsGui(gui){
    let folder = gui.addFolder('single side graphics');
    folder.add(lineStyle, 'thickness', 0,20);
    folder.add(lineStyle, 'alpha', 0, 1);
}

export class SingleSide extends Phaser.Sprite{

    constructor(game, x, y, boardView, model){
        super(game, x, y);
        this.data.boardView = boardView;
        this.data.model = model;
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength);
        let start = hexPoints[this.data.model.cords.side];
        this.data.graphics = new Phaser.Graphics(game, start.x, start.y);
        this.addChild(this.data.graphics);
        this.data.graphics.inputEnabled = true;
        this.data.graphics.events.onInputOver.add(this.data.model.onInputOver, this.data.model);
        this.data.graphics.events.onInputOut.add(this.data.model.onInputOut, this.data.model);
    }

    refreshPosition(){
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength);
        let start = hexPoints[this.data.model.cords.side];
        this.data.graphics.x = start.x;
        this.data.graphics.y = start.y;
    }

    update(){
        this.refreshPosition();
        let externalTangentAngle = 60;
        this.data.graphics.angle = externalTangentAngle*this.data.model.cords.side;
        this.data.graphics.clear();
        //this rect used fro hit box only
        this.data.graphics.beginFill(0, 0);
        this.data.graphics.drawRect(0, 0, this.data.boardView.innerSideLength,lineStyle.thickness * 2);
        this.data.graphics.endFill();
        //now drawing
        this.data.graphics.lineStyle(lineStyle.thickness, this.data.model.team.colour, lineStyle.alpha);
        this.data.graphics.moveTo(0, 0);
        this.data.graphics.lineTo(this.data.boardView.innerSideLength, 0);

        if(this.data.model.selected && false){
            //this is gonna be a real resource drain
            //should instead render to texture (6 different ones), then reapply
            let steps = 10;
            let maxThickness = lineStyle.thickness * 5;
            let thicknessStep = (maxThickness - lineStyle.thickness)/steps;
            let alpha = 1/steps;//these naturaly stack, so scaling with step is not needed
            for(let step = 0; step < steps; step++){
                this.data.graphics.lineStyle(lineStyle.thickness + (thicknessStep*step), 0xffffff, alpha);
                this.data.graphics.moveTo(0, 0);
                this.data.graphics.lineTo(this.data.boardView.innerSideLength, 0);
            }
        }
    }
}
