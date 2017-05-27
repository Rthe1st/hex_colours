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

export class Character extends Phaser.Sprite{

    constructor(game, boardView, model, inputDownCallback){
        super(game, 0, 0);
        this.data.boardView = boardView;
        this.data.model = model;
        let worldCords = boardView.calculateWorldCords(this.data.model.cords);
        this.x = worldCords.x;
        this.y = worldCords.y;
        this.interpolation = 0;
        this.data.graphics = new Phaser.Graphics(game, 0, 0);
        this.addChild(this.data.graphics);
        this.data.oldSide = this.data.model.cords.side;
        this.events.onInputDown.add(inputDownCallback, this.data.boardView.data.model);
    }

    interpolationAmount(midPoint){
        if(this.data.oldSide != this.data.model.cords.side){
            this.animate = true;
            this.data.oldSide = this.data.model.cords.side;
        }else if(!this.animate){
            return midPoint;
        }
        this.maxInterpolation = 50;
        if(this.interpolation >= this.maxInterpolation){
            this.interpolation = 0;
            this.animate = false;
        }else if(this.animate === true){
            this.interpolation++;
        }
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
        let start;
        let end;
        if(this.data.model.lastRotation == 5){//1 less then max is same as -1
            start = hexPoints[(this.data.model.cords.side+2)%6];
            end = hexPoints[(this.data.model.cords.side+1)%6];
        }else{
            start = hexPoints[(this.data.model.cords.side+5)%6];
            end = hexPoints[(this.data.model.cords.side+6)%6];
        }
        let midPoint2 = {x: (start.x + end.x)/2, y: (start.y + end.y)/2};
        let interpolationPercent = (this.interpolation/this.maxInterpolation);
        let intX = (midPoint.x - midPoint2.x)*interpolationPercent;
        return {
            x: midPoint2.x + (midPoint.x - midPoint2.x)*(interpolationPercent),
            y: midPoint2.y + (midPoint.y - midPoint2.y)*(interpolationPercent)
        };
    }

    refreshPosition(){
        let worldCords = this.data.boardView.calculateWorldCords(this.data.model.cords);
        this.x = worldCords.x;
        this.y = worldCords.y;
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
        let start = hexPoints[this.data.model.cords.side];
        let end = hexPoints[(this.data.model.cords.side + 1)%6];
        let midPoint = {x: (start.x + end.x)/2, y: (start.y + end.y)/2};
        //let interpolationAmount = this.interpolationAmount();
        //midPoint.x += this.interpolationAmount.x;
        //midPoint.y += this.interpolationAmount.y;
        let withInterpolation = this.interpolationAmount(midPoint);
        this.data.graphics.x = withInterpolation.x;
        this.data.graphics.y = withInterpolation.y;
        //this.data.graphics.x = midPoint.x;
        //this.data.graphics.y = midPoint.y;
    }

    update(){
        this.refreshPosition();
        this.data.graphics.clear();
        //now drawing
        //cause this doesnt change, we should cache bro
        this.data.graphics.lineStyle(2, '#ffffff');
        this.data.graphics.beginFill(this.data.model.team.colour, 0.5);
        //this and alpha are temp hacks to show overlaping characters of different colours
        let teamScale = 1 + 0.5*this.data.model.team.number;
        this.data.graphics.drawCircle(0, 0, this.data.boardView.outerSideLength*teamScale/10);
        this.data.graphics.endFill();
        this.data.graphics.lineStyle(5, 0x00000);
        //always point inwards because inner hex always has a matching side
        /*this.data.graphics.moveTo(0, this.data.boardView.outerSideLength/10);
        this.data.graphics.lineTo(0, this.data.boardView.outerSideLength/10 + 20);
        if(this.data.model.oppositeSideMatches()){
            this.data.graphics.moveTo(0, - this.data.boardView.outerSideLength/10);
            this.data.graphics.lineTo(0, - this.data.boardView.outerSideLength/10 - 20);
        }*/
    }
}
