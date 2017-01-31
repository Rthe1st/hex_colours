import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";
import {teams} from "../teamInfo.js";

export class Dashboard extends Phaser.Sprite{
    //depending on what thee controls look like
    //might be better to make this with normal html/css
    constructor(game, x, y, width, model){
        super(game, x, y);
        this.data.model = model;
        this.data.width = width;
        this.data.height = game.height;
        this.moveCounter = new Phaser.Graphics(game, 0, this.data.height/2);
        this.addChild(this.moveCounter);
    }

    update(){
        this.moveCounter.clear();
        const currentTeam = this.data.model.currentTeam;
        this.moveCounter.beginFill(currentTeam.colour);
        let radius = Math.min(this.data.width, this.data.height)/2;
        let center = {x: 0, y: 0};
        if(currentTeam.movesLeft == currentTeam.moveLimit){
            //arc draws in discreat segments, so leaves a gap for full circles
            this.moveCounter.drawCircle(center.x, center.y, radius*2);
        }else{
            let percentOfCircle = currentTeam.movesLeft/currentTeam.moveLimit;
            let endAngleRadians = -Math.PI*2*percentOfCircle;
            let topOffset = -Math.PI/2;
            this.moveCounter.arc(center.x, center.y, radius, topOffset, topOffset+endAngleRadians, true, 128);
        }
        this.moveCounter.endFill();
    }
}
