import {teams} from "../teamInfo.js";
import * as geometry from "../geometry.js";
import {SingleSide} from "./SingleSide.js";

let lineStyle = {
    thickness: 5,
    alpha: 1
};

let hexStyle = {
    colour: 0xFF33ff
};

export function hexagonSettingsGui(gui){
    let folder = gui.addFolder('hexagon graphics');
    folder.add(lineStyle, 'thickness', 0,20);
    folder.add(lineStyle, 'alpha', 0, 1);
    folder.addColor(hexStyle, 'colour');
}

export class Hexagon extends Phaser.Sprite{
    /*
    Hexmodel is an interface that supplies info on how to render
    It's API is:
        property: gridCords -> returns {x, y} object
        propoertyL sides -> returns [] of team numbers, starting from top side, going clockwise
    */
    constructor(game, x, y, boardView, inputDownCallback, model){
        super(game, x, y);
        this.data.model = model;
        this.data.boardView = boardView;
        this.inputEnabled = true;
        //this isn't pixle perfect, so use in conjuction with polygon hit test?
        //assuming box for this testi is too big, not too small
        this.events.onInputDown.add(inputDownCallback, this.data.boardView.data.model);

        this.data.body = new Phaser.Graphics(game, 0, 0);
        this.addChild(this.data.body);

        this.data.sides = [];

        for(let sideModel of this.data.model.sides){
            let sideView = new SingleSide(game, 0, 0, boardView, sideModel);
            this.addChild(sideView);
            this.data.sides.push(sideView);
        }
        this.data.text = new Phaser.Text(game, -10, -10, this.data.model.gridCords.x + "," + this.data.model.gridCords.y);
        this.data.text.font = "arial";
        this.data.text.fontSize = 8;
        //look at adding this to a group/image class with the graphics object
        this.addChild(this.data.text);
        this.chooseRotationIcon(game);
    }

    /*destroy(){
        let boardModel = this.data.boardView.data.model;
        let hexModel = this.data.model;
        //super.destroy();
        boardModel.hexagons.get(hexModel.x).delete(hexModel.y);
    }*/

    chooseRotationIcon(game){
        let rotation_icon;
        if(this.data.model.rotation == 'left'){
            rotation_icon = 'left_rotate';
        }else if(this.data.model.rotation == 'right'){
            rotation_icon = 'right_rotate';
        }else if(this.data.model.rotation == 'both'){
            return;
        }else{
            console.log("model has invlaid roation setting");
            return;
        }
        let rotation_sprite = new Phaser.Sprite(game, 0, 0, rotation_icon);//changing x and y by absoulutes is horrible, stop that
        rotation_sprite.scale.setTo(0.5, 0.5);
        this.addChild(rotation_sprite);
    }

    refreshPositon(){
        let worldCords = this.data.boardView.calculateWorldCords(this.data.model.gridCords);
        this.x = worldCords.x;
        this.y = worldCords.y;
    }

    update(){
        this.refreshPositon();
        //this.drawSides();
        this.drawHexagon();
        for(let sideView of this.data.sides){
            sideView.update();
        }
    }

    drawSides(){
        this.data.sides.clear();
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength);
        for(let [sideNumber,team] of this.data.model.sides.entries()){
            this.data.sides.lineStyle(lineStyle.thickness, team.colour, lineStyle.alpha);
            let start = hexPoints[sideNumber];
            this.data.sides.moveTo(start.x, start.y);
            let end = hexPoints[(sideNumber+1)%6];
            this.data.sides.lineTo(end.x, end.y);
        }
    }

    drawHexagon(){
        this.data.body.clear();
        if(this.data.model.canRotate){
            this.data.body.beginFill(hexStyle.colour);
        }else{
            this.data.body.beginFill(hexStyle.colour, 0.25);
        }

        this.data.body.drawPolygon(geometry.relativeScaledHexPoints(this.data.boardView.innerSideLength));
        this.data.body.endFill();
        if(this.data.model.isHome){
            this.data.body.beginFill('0x0066ff');
            this.data.body.drawCircle(0,0, 20);
            this.data.body.endFill();
        }
    }
}
