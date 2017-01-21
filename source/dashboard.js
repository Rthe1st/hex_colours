import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";

export class Dashboard{
    //depending on what thee controls look like
    //might be better to make this with normal html/css
    constructor(game, x, y, width){
        this.width = width;
        this.height = game.height;
        this.image = game.add.sprite(x, y);
        this.moveCounter = new Phaser.Graphics(game, this.width/2, this.height/2);
        this.image.addChild(this.moveCounter);
    }

    destroy(){
        this.image.destroy();
    }

    draw(team){
        this.moveCounter.clear();
        this.moveCounter.beginFill(team.colour);
        let radius = Math.min(this.width, this.height)/2;
        let center = {x: 0, y: 0};
        if(team.movesLeft == team.moveLimit){
            //arc draws in discreat segments, so leaves a gap for full circles
            this.moveCounter.drawCircle(center.x, center.y, radius*2);
        }else{
            let percentOfCircle = team.movesLeft/team.moveLimit;
            let endAngleRadians = -Math.PI*2*percentOfCircle;
            let topOffset = -Math.PI/2;
            this.moveCounter.arc(center.x, center.y, radius, topOffset, topOffset+endAngleRadians, true, 128);
        }
        this.moveCounter.endFill();
    }
}
