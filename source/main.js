//import Phaser from "Phaser";
//hack cause https://github.com/photonstorm/phaser/issues/2424
window.PIXI = require( 'phaser/build/custom/pixi' );
window.p2 = require( 'phaser/build/custom/p2' );
window.Phaser = require( 'phaser/build/custom/phaser-split' );

window.onload = function() {
	
	var game = new Phaser.Game(640, 480, Phaser.CANVAS, "phaser_parent", {preload: onPreload, create: onCreate});                

	var hexagonWidth = 80;
	var hexagonHeight = 70;
	var gridSizeX = 10;
	var gridSizeY = 12;
	var columns = [Math.ceil(gridSizeY/2),Math.floor(gridSizeY/2)];
     var moveIndex;
     var sectorWidth = hexagonWidth/4*3;
     var sectorHeight = hexagonHeight;
     var gradient = (hexagonWidth/4)/(hexagonHeight/2);
     var marker;
     var hexagonGroup;
     var hexagonArray = [];
     
	function onPreload() {
		game.load.image("hexagon", "hexagon.png");
		game.load.image("marker", "marker.png");
	}

	function onCreate() {
		hexagonGroup = game.add.group();
		game.stage.backgroundColor = "#ffffff"
	     for(var x = 1; x < gridSizeX; x++){
			for(var y = 1; y < gridSizeY; y++){
				var sideLength = 20;
				var corner_vertical = Math.sin(Math.PI/3)*sideLength;
				var corner_horizontal = Math.cos(Math.PI/3)*sideLength;
				var hexagonWidth = 2*sideLength;
				var hexagonHeight = 2*corner_vertical;
				var hexagonX = sideLength*x*1.5;
				var hexagonY = hexagonHeight*y;
				if(x%2==1){
					hexagonY -= hexagonHeight/2;
				}
				var poly = new Phaser.Polygon(
					new Phaser.Point(sideLength, 0),
					new Phaser.Point(+corner_horizontal, +corner_vertical),
					new Phaser.Point(-corner_horizontal, +corner_vertical),
					new Phaser.Point(-sideLength, 0),
					new Phaser.Point(-corner_horizontal, -corner_vertical),
					new Phaser.Point(+corner_horizontal, -corner_vertical)
				);
				var graphics = game.add.graphics(hexagonX, hexagonY);
				graphics.beginFill(0xFF33ff);
				graphics.drawPolygon(poly.points);
				graphics.endFill();
				//draw 6 of these round each side of the hexagon
				//create associated line objects (for rotation)
				//randomise them
				var line1 = new Phaser.Line(-sideLength, 0, sideLength, 0);
				var lineGraphics = game.add.graphics(hexagonX, hexagonY);
				lineGraphics.lineStyle(2, 0x000000, 100); 
				lineGraphics.moveTo(-sideLength, 0);
				lineGraphics.lineTo(sideLength, 0);
			}
		}
		/*hexagonGroup.y = (game.height-hexagonHeight*Math.ceil(gridSizeY/2))/2;
          if(gridSizeY%2==0){
               hexagonGroup.y-=hexagonHeight/4;
          }
		hexagonGroup.x = (game.width-Math.ceil(gridSizeX/2)*hexagonWidth-Math.floor(gridSizeX/2)*hexagonWidth/2)/2;
          if(gridSizeX%2==0){
               hexagonGroup.x-=hexagonWidth/8;
          }*/
	}
}