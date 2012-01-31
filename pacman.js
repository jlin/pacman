// Pac-Man
// Thanks to Jamey Pittman for "The Pac-Man Dossier"

//
// =========== TILE MAP ============
//

// number of tiles
var tileCols = 28;
var tileRows = 36;

// ascii map tiles
// used as the initial state for all the levels
var tiles = (
"____________________________" +
"____________________________" +
"____________________________" +
"||||||||||||||||||||||||||||" +
"|............||............|" +
"|.||||.|||||.||.|||||.||||.|" +
"|o|__|.|___|.||.|___|.|__|o|" +
"|.||||.|||||.||.|||||.||||.|" +
"|..........................|" +
"|.||||.||.||||||||.||.||||.|" +
"|.||||.||.||||||||.||.||||.|" +
"|......||....||....||......|" +
"||||||.||||| || |||||.||||||" +
"_____|.||||| || |||||.|_____" +
"_____|.||          ||.|_____" +
"_____|.|| |||--||| ||.|_____" +
"||||||.|| |______| ||.||||||" +
"      .   |______|   .      " +
"||||||.|| |______| ||.||||||" +
"_____|.|| |||||||| ||.|_____" +
"_____|.||          ||.|_____" +
"_____|.|| |||||||| ||.|_____" +
"||||||.|| |||||||| ||.||||||" +
"|............||............|" +
"|.||||.|||||.||.|||||.||||.|" +
"|.||||.|||||.||.|||||.||||.|" +
"|o..||.......  .......||..o|" +
"|||.||.||.||||||||.||.||.|||" +
"|||.||.||.||||||||.||.||.|||" +
"|......||....||....||......|" +
"|.||||||||||.||.||||||||||.|" +
"|.||||||||||.||.||||||||||.|" +
"|..........................|" +
"||||||||||||||||||||||||||||" +
"____________________________" +
"____________________________");

// tile size
var tileSize = 8;

// size of the tile map
var widthPixels = tileCols*tileSize;
var heightPixels = tileRows*tileSize;

// current tile state
// a copy of the initial state, with edits to represent the eaten dots
var currentTiles;

// reset the dot count and 
// use a fresh copy the initial tile state
var resetTiles = function() {
    game.dotCount = 0;
    currentTiles = tiles.split("");
    drawBackground();
};


var getTile = function(x,y) {
    if (x>=0 && x<tileCols && y>=0 && y<tileRows) 
        return currentTiles[x+y*tileCols];
    if (isOffscreenTunnelTile(x,y))
        return ' ';
};

//
// =============== TILE LOCATIONS ===================
//

// the center pixel of a tile
var midTile = {x:3, y:4};

// row for the displayed message
var messageRow = 22;

// determines if a given tile character is a walkable floor
var isFloorTile = function(t) {
    return t==' ' || t=='.' || t=='o';
};

// define which tiles are inside the tunnel
var isTunnelTile = function(x,y) {
    return (y == 17 && (x <= 5 || x >= tileCols-1-5));
};

// represent the offscreen tiles for the tunnel
// which extends two tiles past the end of the map on both sides
var isOffscreenTunnelTile = function(x,y) {
    return (y == 17 && (x<0 || x>tileCols-1));
};

// tunnel portal locations
tunnelLeftEndPixel = -2*tileSize;
tunnelRightEndPixel = (tileCols+2)*tileSize-1;

// ghosts cannot go up at these tiles
var ghostCannotGoUpAtTile = function(x,y) {
    return (x == 12 || x == 15) && (y == 14 || y == 26);
}

// locations of the ghost door and home boundaries
// ghosts are steered inside the home using these locations
var ghostDoorTile = {x:13, y:14};
var ghostDoorPixel = {x:(ghostDoorTile.x+1)*tileSize-1, y:ghostDoorTile.y*tileSize + midTile.y};
var ghostHomeLeftPixel = ghostDoorPixel.x - 2*tileSize;
var ghostHomeRightPixel = ghostDoorPixel.x + 2*tileSize;
var ghostHomeTopPixel = 17*tileSize;
var ghostHomeBottomPixel = 18*tileSize;

// location of the fruit
var fruitTile = {x:13, y:20};
var fruitPixel = {x:tileSize*(1+fruitTile.x)-1, y:tileSize*fruitTile.y + midTile.y};

// parse energizer locations from map
var numEnergizers = 0;
var energizers = [];
(function() {
    var x,y;
    var i=0;
    for (y=0; y<tileRows; y++)
    for (x=0; x<tileCols; x++)
        if (tiles[i++] == 'o') {
            numEnergizers++;
            energizers.push({'x':x,'y':y});
        }
})();


//
// ========== MAIN DRAWING ============
//

// floor colors to use when flashing after finishing a level
var normalFloorColor = "#555";
var brightFloorColor = "#999";
var pelletColor = "#888";
var energizerColor = "#FFF";

// current floor color
var floorColor = normalFloorColor;

// draw background
var drawBackground = function() {
    bgCtx.fillStyle = "#333";
    bgCtx.fillRect(0,0,widthPixels, heightPixels);

    var x,y;
    var i;
    var t;

    // we draw same-colored tiles together
    // to help performance

    // draw pellet tiles
    bgCtx.fillStyle = pelletColor;
    i=0;
    for (y=0; y<tileRows; y++)
    for (x=0; x<tileCols; x++) {
        t = currentTiles[i++];
        if (t == '.')
            drawFloor(bgCtx,x,y,0);
    }

    // draw floor tiles
    bgCtx.fillStyle = floorColor;
    i=0;
    for (y=0; y<tileRows; y++)
    for (x=0; x<tileCols; x++) {
        t = currentTiles[i++];
        if (t == ' ' || t == 'o')
            drawFloor(bgCtx,x,y,0);
    }
};

// erase pellet from background
var erasePellet = function(x,y) {
    bgCtx.fillStyle = floorColor;
    drawFloor(bgCtx,x,y,0);
};

// blit background canvas to screen
var blitBackground = function() {
    ctx.scale(1/scale,1/scale);
    ctx.drawImage(bgCanvas,0,0);
    ctx.scale(scale,scale);
};

// draw floor tile
var drawFloor = function(context,x,y,pad) {
    context.fillRect(x*tileSize+pad,y*tileSize+pad,tileSize-2*pad,tileSize-2*pad);
};

// draw energizers
var drawEnergizers = function() {
    ctx.fillStyle = energizerColor;
    var e;
    for (i=0; i<numEnergizers; i++) {
        e = energizers[i];
        if (currentTiles[e.x+e.y*tileCols] == 'o')
            drawFloor(ctx,e.x,e.y,-1);
    }
};

// draw message
var drawMessage = function(text, color) {
    ctx.font = "bold " + 2*tileSize + "px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(text, tileCols*tileSize/2, messageRow*tileSize);
};

// draw points after eating ghost
var drawEatenPoints = function() {
    var text = pacman.eatPoints;
    ctx.font = 1.5*tileSize + "px sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = "#0FF";
    ctx.fillText(text, pacman.pixel.x, pacman.pixel.y);
};

// draw extra lives indicator
var drawExtraLives = function() {
    var i;
    for (i=0; i<game.extraLives; i++)
        drawActor((2*i+3)*tileSize, (tileRows-2)*tileSize+midTile.y,"rgba(255,255,0,0.6)",actorSize);
};

// draw current level indicator
var drawLevelIcons = function() {
    var i;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    var w = 2;
    var h = actorSize;
    for (i=0; i<game.level; i++)
        ctx.fillRect((tileCols-2)*tileSize - i*2*w, (tileRows-2)*tileSize+midTile.y-h/2, w, h);
};

// draw current and high scores
var drawScore = function() {
    ctx.font = 1.5*tileSize + "px sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = "#FFF";
    ctx.fillText(game.score, tileSize, tileSize*2);

    ctx.font = "bold " + 1.5*tileSize + "px sans-serif";
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.fillText("high score", tileSize*tileCols/2, 3);
    ctx.fillText(game.highScore, tileSize*tileCols/2, tileSize*2);
};


// draw fruit or fruit score
var drawFruit = function() {
    var w;
    if (counter.fruitFramesLeft > 0) {
        ctx.fillStyle = "rgba(0,255,0,0.5)";
        w = tileSize+2;
        ctx.fillRect(fruitPixel.x-w/2, fruitPixel.y-w/2, w, w);
    }
    else if (counter.fruitScoreFramesLeft > 0) {
        ctx.font = 1.5*tileSize + "px sans-serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "#FFF";
        ctx.fillText(getFruitPoints(), fruitPixel.x, fruitPixel.y);
    }
};

// draw actor just as a block
var drawActor = function(px,py,color,size) {
    ctx.fillStyle = color;
    ctx.fillRect(px-size/2, py-size/2, size, size);
};

// actor size
var actorSize = (tileSize-1)*2;

// draw ghost differently to reflect modes
var drawGhost = function(g) {
    if (g.mode == GHOST_EATEN)
        return;
    var color = g.color;
    if (g.scared)
        color = pacman.energizedFlash ? "#FFF" : "#00F";
    else if (g.mode == GHOST_GOING_HOME)
        color = "rgba(255,255,255,0.2)";
    drawActor(g.pixel.x, g.pixel.y, color, actorSize);
};

// draw pacman
var drawPacman = function() {
    drawActor(pacman.pixel.x, pacman.pixel.y, pacman.color, actorSize);
};

// draw a line of sight from the ghost to its active target tile 
// (for debugging and visualization)
var drawGhostSight = function(g) {
    if (!g.scared && g.mode == GHOST_OUTSIDE && game.state == playState) {
        ctx.strokeStyle = g.color;
        ctx.beginPath();
        ctx.moveTo(g.pixel.x, g.pixel.y);
        ctx.lineTo(g.targetTile.x*tileSize+midTile.x, g.targetTile.y*tileSize+midTile.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = g.color;
        drawFloor(ctx,g.targetTile.x, g.targetTile.y, 1);
    }
};

// draw all the actors with correct z-ordering
var drawActors = function() {
    var i;

    // draw such that pacman appears on top
    if (pacman.energized) {
        for (i=0; i<4; i++)
            drawGhost(actors[i]);
        if (playState.skippedFramesLeft == 0)
            drawPacman();
        else
            drawEatenPoints();
    }
    // draw such that pacman appears on bottom
    else {
        drawPacman();
        for (i=3; i>=0; i--) 
            drawGhost(actors[i]);
    }
};

//
// ============ TILE DIRECTION ============
// 

// We use both enums and vectors to represent actor direction
// because they are both convenient in different cases.

// direction enums (in clockwise order)
var DIR_UP = 0;
var DIR_RIGHT = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 3;

// get direction enum from a direction vector
var getEnumFromDir = function(dir) {
    if (dir.x==-1) return DIR_LEFT;
    if (dir.x==1) return DIR_RIGHT;
    if (dir.y==-1) return DIR_UP;
    if (dir.y==1) return DIR_DOWN;
};

// set direction vector from a direction enum
var setDirFromEnum = function(dir,dirEnum) {
    if (dirEnum == DIR_UP)         { dir.x = 0; dir.y =-1; }
    else if (dirEnum == DIR_RIGHT)  { dir.x =1; dir.y = 0; }
    else if (dirEnum == DIR_DOWN)  { dir.x = 0; dir.y = 1; }
    else if (dirEnum == DIR_LEFT) { dir.x = -1; dir.y = 0; }
};

// get a list of the four surrounding tiles
var getSurroundingTiles = function(tile) {
    return [
        getTile(tile.x, tile.y-1), // DIR_UP
        getTile(tile.x+1, tile.y), // DIR_RIGHT
        getTile(tile.x, tile.y+1), // DIR_DOWN
        getTile(tile.x-1, tile.y)  // DIR_LEFT
    ];
};

// get a tile next to the given tile
var getNextTile = function(tile, dir) {
    return getTile(tile.x+dir.x, tile.y+dir.y);
};

//
// ============ ACTOR SPEEDS ============
//

// Actor speed is controlled by a list of 16 values.
// Each value is the number of steps to take in a specific frame.
// Once the end of the list is reached, we cycle to the beginning.
// This method allows us to represent different speeds in a low-resolution space.

// speed control table (from Jamey Pittman)
var stepSizes = (
                     // LEVEL 1
"1111111111111111" + // pac-man (normal)
"0111111111111111" + // ghosts (normal)
"1111211111112111" + // pac-man (fright)
"0110110101101101" + // ghosts (fright)
"0101010101010101" + // ghosts (tunnel)
"1111111111111111" + // elroy 1
"1111111121111111" + // elroy 2

                     // LEVELS 2-4
"1111211111112111" + // pac-man (normal)
"1111111121111111" + // ghosts (normal)
"1111211112111121" + // pac-man (fright)
"0110110110110111" + // ghosts (fright)
"0110101011010101" + // ghosts (tunnel)
"1111211111112111" + // elroy 1
"1111211112111121" + // elroy 2

                     // LEVELS 5-20
"1121112111211121" + // pac-man (normal)
"1111211112111121" + // ghosts (normal)
"1121112111211121" + // pac-man (fright) (N/A for levels 17, 19 & 20)
"0111011101110111" + // ghosts (fright)  (N/A for levels 17, 19 & 20)
"0110110101101101" + // ghosts (tunnel)
"1121112111211121" + // elroy 1
"1121121121121121" + // elroy 2

                     // LEVELS 21+
"1111211111112111" + // pac-man (normal)
"1111211112111121" + // ghosts (normal)
"0000000000000000" + // pac-man (fright) N/A
"0000000000000000" + // ghosts (fright)  N/A
"0110110101101101" + // ghosts (tunnel)
"1121112111211121" + // elroy 1
"1121121121121121"); // elroy 2

// used as "pattern" parameter in getStepSizeFromTable()
var STEP_PACMAN = 0;
var STEP_GHOST = 1;
var STEP_PACMAN_FRIGHT = 2;
var STEP_GHOST_FRIGHT = 3;
var STEP_GHOST_TUNNEL = 4;
var STEP_ELROY1 = 5;
var STEP_ELROY2 = 6;

// getter function to extract a step size from the table
var getStepSizeFromTable = function(level, pattern, frame) {
    var entry;
    if (level < 1) return;
    else if (level==1)                  entry = 0;
    else if (level >= 2 && level <= 4)  entry = 1;
    else if (level >= 5 && level <= 20) entry = 2;
    else if (level >= 21)               entry = 3;
    return stepSizes[entry*7*16 + pattern*16 + frame%16];
};

//
// ============= COMMON ACTOR ==============
//

// The actor class defines common data functions for the ghosts and pacman
// It provides everything for updating position and direction.

// Actor constructor
var Actor = function() {

    // initial position and direction
    this.startPixel = {};  // x,y pixel starting position (0<=x<tileCols*tileSize, 0<=y<tileRows*tileSize)
    this.startDirEnum = 0; // starting direction enumeration (0<=x,y<=4)

    // current position
    this.targetTile = {x:0,y:0}; // x,y current target tile (0<=x<tileCols, 0<=y<tileRows)
    this.tile = {};        // x,y tile position (0<=x<tileCols, 0<=y<tileRows)
    this.pixel = {};       // x,y pixel position (0<=x<tileCols*tileSize, 0<=y<tileRows*tileSize)
    this.tilePixel = {};   // x,y pixel in tile (0<=x,y<tileSize)
    this.distToMid = {};   // x,y pixel distance from center of tile

    // current direction
    this.dir = {};         // x,y direction (-1<=x,y<=1)
    this.dirEnum = 0;      // direction enumeration (0<=x,y<=4)

    // current frame count
    this.frame = 0;        // frame count
};

// reset to initial position and direction
Actor.prototype.reset = function() {
    this.setDir(this.startDirEnum);
    this.setPos(this.startPixel.x, this.startPixel.y);
};

// sets the position and updates its dependent variables
Actor.prototype.setPos = function(px,py) {
    this.pixel.x = px;
    this.pixel.y = py;
    this.commitPos();
};

// updates the position's dependent variables
Actor.prototype.commitPos = function() {

    // Handle Tunneling
    // Teleport position to opposite side of map if past tunnel tiles.
    // (there are two invisible tiles on each side of the tunnel)
    if (isOffscreenTunnelTile(this.tile.x, this.tile.y))
        if (this.pixel.x < tunnelLeftEndPixel)
            this.pixel.x = tunnelRightEndPixel;
        else if (this.pixel.x > tunnelRightEndPixel)
            this.pixel.x = tunnelLeftEndPixel;

    this.tile.x = Math.floor(this.pixel.x / tileSize);
    this.tile.y = Math.floor(this.pixel.y / tileSize);
    this.tilePixel.x = this.pixel.x % tileSize;
    this.tilePixel.y = this.pixel.y % tileSize;
    this.distToMid.x = midTile.x - this.tilePixel.x;
    this.distToMid.y = midTile.y - this.tilePixel.y;
};

// sets the direction and updates its dependent variables
Actor.prototype.setDir = function(dirEnum) {
    setDirFromEnum(this.dir, dirEnum);
    this.dirEnum = dirEnum;
};

// updates the actor state
Actor.prototype.update = function() {
    // get number of steps to advance in this frame
    var steps = this.getNumSteps(this.frame);
    var i;
    for (i=0; i<steps; i++) {
        this.step();
        this.steer();
    }
    this.frame++;
};

// retrieve four surrounding tiles and indicate whether they are open
Actor.prototype.getOpenSurroundTiles = function() {

    // get open passages
    var surroundTiles = getSurroundingTiles(this.tile);
    var openTiles = {};
    var numOpenTiles = 0;
    var oppDirEnum = (this.dirEnum+2)%4; // current opposite direction enum
    var i;
    for (i=0; i<4; i++)
        if (openTiles[i] = isFloorTile(surroundTiles[i]))
            numOpenTiles++;

    // By design, no mazes should have dead ends,
    // but allow player to turn around if and only if it's necessary.
    // Only close the passage behind the player if there are other openings.
    if (numOpenTiles > 1) {
        openTiles[oppDirEnum] = false;
    }
    // somehow we got stuck
    else if (numOpenTiles == 0) {
        this.dir.x = 0;
        this.dir.y = 0;
        this.dirEnum = -1;
        console.log(this.name,'got stuck');
        return;
    }

    return openTiles;
};

Actor.prototype.getTurnClosestToTarget = function(openTiles) {

    var dx,dy,dist;                      // variables used for euclidean distance
    var minDist = Infinity;              // variable used for finding minimum distance path
    var dir = {};
    var dirEnum = 0;
    var i;
    for (i=0; i<4; i++) {
        if (openTiles[i]) {
            setDirFromEnum(dir,i);
            dx = dir.x + this.tile.x - this.targetTile.x;
            dy = dir.y + this.tile.y - this.targetTile.y;
            dist = dx*dx+dy*dy;
            if (dist < minDist) {
                minDist = dist;
                dirEnum = i;
            }
        }
    }
    return dirEnum;
};

//
// ==================== GHOST ACTOR =======================
//

// modes representing the ghosts' current command
var ghostCommand;
var GHOST_CMD_CHASE = 0;
var GHOST_CMD_SCATTER = 1;

// modes representing the ghost's current state
var GHOST_OUTSIDE = 0;
var GHOST_EATEN = 1;
var GHOST_GOING_HOME = 2;
var GHOST_PACING_HOME = 3;
var GHOST_LEAVING_HOME = 4;

// Ghost constructor
var Ghost = function() {

    // inherit data from Actor
    Actor.apply(this);

    // tiles
    this.cornerTile = {};        // x,y corner tile to patrol (0<=x<tileCols, 0<=y<tileRows)

    // signals (received to indicate changes to be made in the update() function)
    this.sigReverse = false;   // reverse signal
    this.sigLeaveHome = false; // leave home signal

    // modes
    this.mode = 0;        // GHOST_OUTSIDE, GHOST_EATEN, ...
    this.scared = false;  // currently scared
};

// inherit functions from Actor class
Ghost.prototype.__proto__ = Actor.prototype;

// reset the state of the ghost on new level or level restart
Ghost.prototype.reset = function() {

    // signals
    this.sigReverse = false;
    this.sigLeaveHome = false;

    // modes
    this.mode = (this == blinky) ? GHOST_OUTSIDE : GHOST_PACING_HOME;
    this.scared = false;

    // call Actor's reset function to reset position and direction
    Actor.prototype.reset.apply(this);
};

// gets the number of steps to move in this frame
Ghost.prototype.getNumSteps = function(frame) {

    var pattern = STEP_GHOST;

    if (this.mode == GHOST_GOING_HOME) 
        return 2;
    else if (this.mode == GHOST_LEAVING_HOME || this.mode == GHOST_PACING_HOME || isTunnelTile(this.tile.x, this.tile.y))
        pattern = STEP_GHOST_TUNNEL;
    else if (this.scared)
        pattern = STEP_GHOST_FRIGHT;
    else if (this.elroy == 1)
        pattern = STEP_ELROY1;
    else if (this.elroy == 2)
        pattern = STEP_ELROY2;

    return getStepSizeFromTable(game.level, pattern, frame);
};

// determines if this ghost is inside the ghost home
// (anywhere in the home past the door tile)
Ghost.prototype.isInsideHome = function() {
    return (this.pixel.x >= ghostHomeLeftPixel && this.pixel.x <= ghostHomeRightPixel &&
        this.tile.y > ghostDoorTile.y && this.pixel.y <= ghostHomeBottomPixel);
};

// signal ghost to reverse direction after leaving current tile
Ghost.prototype.reverse = function() {
    this.sigReverse = true;
};

// signal ghost to go home
// It is useful to have this because as soon as the ghost gets eaten,
// we have to freeze all the actors for 3 seconds, except for the
// ones who are already traveling to the ghost home to be revived.
// We use this signal to change mode to GHOST_GOING_HOME, which will be
// set after the update() function is called so that we are still frozen
// for 3 seconds before traveling home uninterrupted.
Ghost.prototype.goHome = function() {
    this.mode = GHOST_EATEN;
};

// Following the pattern that state changes be made via signaling (e.g. reversing, going home)
// the ghost is commanded to leave home similarly.
// (not sure if this is correct yet)
Ghost.prototype.leaveHome = function() {
    this.sigLeaveHome = true;
};

// function called when pacman eats an energizer
Ghost.prototype.onEnergized = function() {
    // only reverse if we are in an active targetting mode
    if (this.mode == GHOST_OUTSIDE)
        this.reverse();

    // don't scare me again on the way to home
    if (this.mode != GHOST_GOING_HOME)
        this.scared = true;
};

// function called when this ghost gets eaten
Ghost.prototype.onEaten = function() {
    this.goHome();       // go home
    this.scared = false; // turn off scared
};


// move forward one step
Ghost.prototype.step = function() {
    this.setPos(this.pixel.x+this.dir.x, this.pixel.y+this.dir.y);
};

// determine direction
Ghost.prototype.steer = function() {

    // Normally, only consider a turn if we're at the middle of a tile.
    // This can change later in the function to handle special ghost door case.
    var considerTurning = (this.distToMid.x == 0 && this.distToMid.y == 0);

    // The following if-else chain takes care of the special home mode movement cases

    // going home to be revived
    if (this.mode == GHOST_GOING_HOME) {
        // at the doormat
        if (this.tile.x == ghostDoorTile.x && this.tile.y == ghostDoorTile.y) {
            // walk to the door, or go through if already there
            this.setDir(this.pixel.x == ghostDoorPixel.x ? DIR_DOWN : DIR_RIGHT);
            return;
        }

        // inside
        if (this.isInsideHome()) {
            if (this.pixel.y == ghostHomeBottomPixel) {
                // revive if reached its seat
                if (this.pixel.x == this.startPixel.x) {
                    this.setDir(DIR_UP);
                    this.mode = (this == blinky) ? GHOST_LEAVING_HOME : GHOST_PACING_HOME;
                }
                // sidestep to its seat
                else {
                    this.setDir(this.startPixel.x < this.pixel.x ? DIR_LEFT : DIR_RIGHT);
                }
            }
            // keep walking down
            return;
        }

        // still outside, so keep looking for the door by proceeding to the rest of this function
    }
    // pacing home
    else if (this.mode == GHOST_PACING_HOME) {
        // head for the door
        if (this.sigLeaveHome) {
            this.sigLeaveHome = false;
            this.mode = GHOST_LEAVING_HOME;
            if (this == clyde) 
                counter.elroyWaitForClyde = false;
            if (this.pixel.x == ghostDoorPixel.x)
                this.setDir(DIR_UP);
            else
                this.setDir(this.pixel.x < ghostDoorPixel.x ? DIR_RIGHT : DIR_LEFT);
        }
        // pace back and forth
        else {
            if (this.pixel.y == ghostHomeTopPixel)
                this.setDir(DIR_DOWN);
            else if (this.pixel.y == ghostHomeBottomPixel)
                this.setDir(DIR_UP);
        }
        return;
    }
    // leaving home
    else if (this.mode == GHOST_LEAVING_HOME) {
        if (this.pixel.x == ghostDoorPixel.x) {
            // reached door
            if (this.pixel.y == ghostDoorPixel.y) {
                this.mode = GHOST_OUTSIDE;
                this.setDir(DIR_LEFT); // always turn left at door?
            }
            // keep walking up to the door
            else {
                this.setDir(DIR_UP);
            }
        }
        return;
    }

    var i;                               // loop counter

    var dirEnum;                         // final direction to update to
    var oppDirEnum = (this.dirEnum+2)%4; // current opposite direction enum
    var openTiles;                       // list of four booleans indicating which surrounding tiles are open

    // reverse direction if commanded
    if (this.sigReverse && this.mode == GHOST_OUTSIDE) {

        // reverse direction only if we've reached a new tile
        if ((this.dirEnum == DIR_UP && this.tilePixel.y == tileSize-1) ||
            (this.dirEnum == DIR_DOWN && this.tilePixel.y == 0) ||
            (this.dirEnum == DIR_LEFT && this.tilePixel.x == tileSize-1) ||
            (this.dirEnum == DIR_RIGHT && this.tilePixel.x == 0)) {
                this.sigReverse = false;
                this.setDir(oppDirEnum);
                return;
        }
    }

    // exit if not considering turning
    if (!considerTurning)
        return;

    openTiles = this.getOpenSurroundTiles();

    // random turn if scared
    if (this.scared) {
        dirEnum = Math.floor(Math.random()*5);
        while (!openTiles[dirEnum])
            dirEnum = (dirEnum+1)%4;
    }
    else {
        // target ghost door
        if (this.mode == GHOST_GOING_HOME) {
            this.targetTile.x = ghostDoorTile.x;
            this.targetTile.y = ghostDoorTile.y;
        }
        // target corner when patrolling
        else if (!this.elroy && ghostCommand == GHOST_CMD_SCATTER) {
            this.targetTile.x = this.cornerTile.x;
            this.targetTile.y = this.cornerTile.y;
        }
        // use custom function for each ghost when in attack mode
        else // mode == GHOST_CMD_CHASE
            this.setTarget();

        // not allowed to go up at these points
        if (ghostCannotGoUpAtTile(this.tile.x, this.tile.y)) 
            openTiles[DIR_UP] = false;

        // choose direction that minimizes distance to target
        dirEnum = this.getTurnClosestToTarget(openTiles);
    }

    // commit the direction
    this.setDir(dirEnum);
};

// update this frame
Ghost.prototype.update = function() {

    var newMode;

    // react to signal to go home
    if (this.mode == GHOST_EATEN) {
        this.mode = GHOST_GOING_HOME;
    }
    
    // call super function to update position and direction
    Actor.prototype.update.apply(this);
};

//
// ============== PLAYER ACTOR ==============
//

// This is the player actor for Pac-Man, or potentially Ms. Pac-Man.

// Player constructor
var Player = function() {

    // inherit data from Actor
    Actor.apply(this);

    // energized state
    this.energized = false;        // indicates energized state
    this.energizedFlash = false;   // whether ghosts are currently flashing
    this.energizedCount = 0;       // how long in frames we have been energized

    this.eatPauseFramesLeft = 0;   // current # of frames left to pause after eating

    // next direction to be taken when possible (set by joystick)
    this.nextDir = {};             // x,y direction
    this.nextDirEnum = 0;          // direction enumeration

    // determines if this player should be AI controlled
    this.ai = false;
};

// inherit functions from Actor
Player.prototype.__proto__ = Actor.prototype;

// reset the state of the player on new level or level restart
Player.prototype.reset = function() {

    this.energized = false;
    this.energizedCount = 0;

    this.eatPauseFramesLeft = 0;

    this.setNextDir(DIR_LEFT);

    // call Actor's reset function to reset to initial position and direction
    Actor.prototype.reset.apply(this);
};

// sets the next direction and updates its dependent variables
Player.prototype.setNextDir = function(nextDirEnum) {
    setDirFromEnum(this.nextDir, nextDirEnum);
    this.nextDirEnum = nextDirEnum;
};

// gets the number of steps to move in this frame
Player.prototype.getNumSteps = function() {
    var pattern = this.energized ? STEP_PACMAN_FRIGHT : STEP_PACMAN;
    return getStepSizeFromTable(game.level, pattern, this.frame);
};

// move forward one step
Player.prototype.step = function() {

    // identify the axes of motion
    var a = (this.dir.x != 0) ? 'x' : 'y'; // axis of motion
    var b = (this.dir.x != 0) ? 'y' : 'x'; // axis perpendicular to motion

    // Don't proceed past the middle of a tile if facing a wall
    var stop = this.distToMid[a] == 0 && !isFloorTile(getNextTile(this.tile, this.dir));
    if (!stop)
        this.pixel[a] += this.dir[a];

    // Drift toward the center of the track (a.k.a. cornering)
    this.pixel[b] += sign(this.distToMid[b]);

    this.commitPos();
};

// determine direction
Player.prototype.steer = function() {

    // if AI-controlled, only turn at mid-tile
    if (this.ai) {
        if (this.distToMid.x != 0 || this.distToMid.y != 0)
            return;

        // make turn that is closest to target
        var openTiles = this.getOpenSurroundTiles();
        this.setTarget();
        this.setNextDir(this.getTurnClosestToTarget(openTiles));
    }

    // head in the desired direction if possible
    if (isFloorTile(getNextTile(this.tile, this.nextDir)))
        this.setDir(this.nextDirEnum);
};

// update this frame
Player.prototype.update = function() {

    // skip frames
    if (this.eatPauseFramesLeft > 0) {
        this.eatPauseFramesLeft--;
        return;
    }

    // handle energized timing
    var i;
    var energizedFramesLeft;
    if (this.energized) {
        if (this.energizedCount == getEnergizedTimeLimit()) {
            this.energized = false;
            this.energizedFlash = false;
            this.energizedCount = 0;
            for (i=0; i<4; i++)
                actors[i].scared = false;
        }
        else {
            this.energizedCount++;

            // flash ghost at the end of frightened mode
            energizedFramesLeft = getEnergizedTimeLimit() - this.energizedCount;
            if (energizedFramesLeft <= ghostFlashInterval*(getScaredGhostFlashes()*2 - 1) && 
                energizedFramesLeft % ghostFlashInterval == 0)
                this.energizedFlash = !this.energizedFlash;
        }
    }


    // call super function to update position and direction
    Actor.prototype.update.apply(this);

    // eat something
    var t = getTile(this.tile.x, this.tile.y);
    if (t == '.' || t == 'o') {
        counter.addDot();
        game.addScore((t=='.') ? 10 : 50);
        currentTiles[this.tile.x+this.tile.y*tileCols] = ' ';
        if (t == '.')
            erasePellet(this.tile.x, this.tile.y);
        if (++game.dotCount == game.maxDots)
            return;
        if (t == 'o') {
            this.eatPoints = 100;
            this.energized = true;
            this.energizedFlash = false;
            this.energizedCount = 0;
            this.eatPauseFramesLeft = 3;
            for (i=0; i<4; i++) 
                actors[i].onEnergized();
        }
        else
            this.eatPauseFramesLeft = 1;
    }
};

//
// ================ ACTOR DEFINITIONS ==============
// 

// create blinky
var blinky = new Ghost();
blinky.name = "blinky";
blinky.color = "#FF0000";
blinky.startDirEnum = DIR_LEFT;
blinky.startPixel.x = 14*tileSize-1;
blinky.startPixel.y = 14*tileSize+midTile.y;
blinky.cornerTile.x = tileCols-1-2;
blinky.cornerTile.y = 0;

// create pinky
var pinky = new Ghost();
pinky.name = "pinky";
pinky.color = "#FFB8FF";
pinky.startDirEnum = DIR_DOWN;
pinky.startPixel.x = 14*tileSize-1;
pinky.startPixel.y = 17*tileSize+midTile.y;
pinky.cornerTile.x = 2;
pinky.cornerTile.y = 0;

// create inky
var inky = new Ghost();
inky.name = "inky";
inky.color = "#00FFFF";
inky.startDirEnum = DIR_UP;
inky.startPixel.x = 12*tileSize-1;
inky.startPixel.y = 17*tileSize + midTile.y;
inky.cornerTile.x = tileCols-1;
inky.cornerTile.y = tileRows - 2;

// create clyde
var clyde = new Ghost();
clyde.name = "clyde";
clyde.color = "#FFB851";
clyde.startDirEnum = DIR_UP;
clyde.startPixel.x = 16*tileSize-1;
clyde.startPixel.y = 17*tileSize + midTile.y;
clyde.cornerTile.x = 0;
clyde.cornerTile.y = tileRows-2;

// create pacman
var pacman = new Player();
pacman.color = "#FFFF00";
pacman.startDirEnum = DIR_LEFT;
pacman.startPixel.x = tileSize*tileCols/2;
pacman.startPixel.y = 26*tileSize + midTile.y;

// order at which they appear in original arcade memory
// (suggests drawing/update order)
var actors = [blinky, pinky, inky, clyde, pacman];

//
// =================== TARGETTING ================
//

blinky.setTarget = function() {
    // directly target pacman
    this.targetTile.x = pacman.tile.x;
    this.targetTile.y = pacman.tile.y;
};
pinky.setTarget = function() {
    // target four tiles ahead of pacman
    this.targetTile.x = pacman.tile.x + 4*pacman.dir.x;
    this.targetTile.y = pacman.tile.y + 4*pacman.dir.y;
    if (pacman.dirEnum == DIR_UP)
        this.targetTile.x -= 4; // arcade overflow bug
};
inky.setTarget = function() {
    // target twice the distance from blinky to two tiles ahead of pacman
    var px = pacman.tile.x + 2*pacman.dir.x;
    var py = pacman.tile.y + 2*pacman.dir.y;
    if (pacman.dirEnum == DIR_UP)
        px -= 2; // arcade overflow bug
    this.targetTile.x = blinky.tile.x + 2*(px - blinky.tile.x);
    this.targetTile.y = blinky.tile.y + 2*(py - blinky.tile.y);
};
clyde.setTarget = function() {
    // target pacman if >=8 tiles away, otherwise go home
    var dx = pacman.tile.x - this.tile.x;
    var dy = pacman.tile.y - this.tile.y;
    var dist = dx*dx+dy*dy;
    if (dist >= 64) {
        this.targetTile.x = pacman.tile.x;
        this.targetTile.y = pacman.tile.y;
    }
    else {
        this.targetTile.x = this.cornerTile.x;
        this.targetTile.y = this.cornerTile.y;
    }
};
pacman.setTarget = function() {
    if (blinky.mode == GHOST_GOING_HOME || blinky.scared) {
        this.targetTile.x = pinky.tile.x;
        this.targetTile.y = pinky.tile.y;
    }
    else {
        this.targetTile.x = pinky.tile.x + 2*(pacman.tile.x-pinky.tile.x);
        this.targetTile.y = pinky.tile.y + 2*(pacman.tile.y-pinky.tile.y);
    }
};

//
// ================ COUNTERS =================
//

// counters:
// 1. release ghosts from home
// 2. change ghost modes chase/scatter
// 3. set elroy modes
// 4. fruit timer


// time table for when a ghost should be in a targetting mode
// There are 3 tables for level 1, level 2-4, and level 5+.
// Each element represents a targetting mode that the ghost
// should be in that given time.
var ghostCommandTimes = [{},{},{}];

// creates the ghost target mode time table
var initGhostCommandTimes = function() {
    var t;
    // level 1
    ghostCommandTimes[0][t=7*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[0][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[0][t+=7*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[0][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[0][t+=5*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[0][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[0][t+=5*60] = GHOST_CMD_CHASE;
    // level 2-4
    ghostCommandTimes[1][t=7*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[1][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[1][t+=7*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[1][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[1][t+=5*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[1][t+=1033*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[1][t+=1] = GHOST_CMD_CHASE;
    // level 5+
    ghostCommandTimes[2][t=7*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[2][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[2][t+=7*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[2][t+=20*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[2][t+=5*60] = GHOST_CMD_CHASE;
    ghostCommandTimes[2][t+=1037*60] = GHOST_CMD_SCATTER;
    ghostCommandTimes[2][t+=1] = GHOST_CMD_CHASE;
};

// retrieves a target mode if there is one to be triggered at the given frame (time)
var getNewGhostCommand = function(t) {
    var i;
    if (game.level == 1)
        i = 0;
    else if (game.level >= 2 && game.level <= 4)
        i = 1;
    else
        i = 2;
    return ghostCommandTimes[i][t];
};

// time limits for how long pacman should be energized for each level.
// also the number of times a scared ghost should flash before returning to normal.
var energizedTimeLimits =  [6,5,4,3,2,5,2,2,1,5,2,1,1,3,1,1,0,1];
var scaredGhostFlashes = [5,5,5,5,5,5,5,5,3,5,5,3,3,5,3,3,0,3];

// "The ghosts change colors every 14 game cycles when they start "flashing" near the end of frightened mode."
// -Jamey Pittman
var ghostFlashInterval = 14; 

var getEnergizedTimeLimit = function() {
    var i = game.level;
    return (i > 18) ? 0 : 60*energizedTimeLimits[i-1];
};
var getScaredGhostFlashes = function() {
    var i = game.level;
    return (i > 18) ? 0 : scaredGhostFlashes[i-1];
};

var elroy1DotsLeft = [20,30,40,40,40,50,50,50,60,60,60,70,70,70,100,100,100,100,120,120,120];
var elroy2DotsLeft = [10,15,20,20,20,25,25,25,30,30,30,40,40,40, 50, 50, 50, 50, 60, 60, 60];

var getElroy1DotsLeft = function() {
    var i = game.level;
    if (i>21) i = 21;
    return elroy1DotsLeft[i-1];
};

var getElroy2DotsLeft = function() {
    var i = game.level;
    if (i>21) i = 21;
    return elroy2DotsLeft[i-1];
};

var fruitPoints = [100,300,500,500,700,700,1000,1000,2000,2000,3000,3000,5000]
var getFruitPoints = function() {
    var i = game.level;
    if (i > 13) i = 13;
    return fruitPoints[i-1];
};

// two separate counter modes for releasing the ghosts from home
var MODE_COUNTER_PERSONAL = 0;
var MODE_COUNTER_GLOBAL = 1;

// dot limits used in personal mode
// (these are moved from the ACTOR DEFINITIONS section for easy reference)
pinky.getDotLimit = function() {
    return 0;
};
inky.getDotLimit = function() {
    return (game.level==1) ? 30 : 0;
};
clyde.getDotLimit = function() {
    if (game.level == 1) return 60;
    else if (game.level == 2) return 50;
    else return 0;
};

// create counter object
var counter = {};

// when new level starts
counter.onNewLevel = function() {
    this.mode = MODE_COUNTER_PERSONAL;
    this.framesSinceLastDot = 0;
    ghostCommand = GHOST_CMD_SCATTER;
    this.targetCount = 0;
    pinky.dotCount = 0;
    inky.dotCount = 0;
    clyde.dotCount = 0;
    this.fruitFramesLeft = 0;
    this.fruitScoreFramesLeft = 0;
    this.elroyWaitForClyde = false;
};

// when player dies and level restarts
counter.onRestartLevel = function() {
    ghostCommand = GHOST_CMD_SCATTER;
    this.targetCount = 0;
    this.mode = MODE_COUNTER_GLOBAL;
    this.dotCount = 0;
    this.framesSinceLastDot = 0;
    this.fruitFramesLeft = 0;
    this.fruitScoreFramesLeft = 0;
    this.elroyWaitForClyde = true;
};

// this is how long it will take to release a ghost after pacman stops eating
var getFramesSinceLastDotLimit = function() {
    return (game.level < 5) ? 4*60 : 3*60;
};

// handle the event of an eaten dot
counter.addDot = function() {
    // reset time since last dot
    this.framesSinceLastDot = 0;

    // add dot to the appropriate counter
    var i,g;
    if (this.mode == MODE_COUNTER_PERSONAL) {
        for (i=1;i<4;i++) {
            g = actors[i];
            if (g.mode == GHOST_PACING_HOME) {
                g.dotCount++;
                break;
            }
        }
    }
    else {
        this.dotCount++;
    }

    // show fruit
    if (game.dotCount == 70 || game.dotCount == 170) {
        this.fruitScoreFramesLeft = 0;
        this.fruitFramesLeft = 60*10;
    }
};

// update counter
counter.update = function() {

    var i;

    // use personal dot counter
    if (this.mode == MODE_COUNTER_PERSONAL) {
        for (i=1;i<4;i++) {
            var g = actors[i];
            if (g.mode == GHOST_PACING_HOME) {
                if (g.dotCount >= g.getDotLimit()) {
                    g.leaveHome();
                }
                break;
            }
        }
    }
    // use global dot counter
    else if (this.mode == MODE_COUNTER_GLOBAL) {
        if (this.dotCount == 7 && pinky.mode == GHOST_PACING_HOME)
            pinky.leaveHome();
        else if (this.dotCount == 17 && inky.mode == GHOST_PACING_HOME)
            inky.leaveHome();
        else if (this.dotCount == 32 && clyde.mode == GHOST_PACING_HOME) {
            this.dotCount = 0;
            this.mode = MODE_COUNTER_PERSONAL;
            clyde.leaveHome();
        }
    }

    // also use time since last dot was eaten
    if (this.framesSinceLastDot > getFramesSinceLastDotLimit()) {
        this.framesSinceLastDot = 0;
        for (i=1;i<4;i++) {
            var g = actors[i];
            if (g.mode == GHOST_PACING_HOME) {
                g.leaveHome();
                break;
            }
        }
    }
    else
        this.framesSinceLastDot++;

    // change ghost target modes
    var newCmd;
    if (!pacman.energized) {
        newCmd = getNewGhostCommand(this.targetCount);
        if (newCmd != undefined) {
            ghostCommand = newCmd;
            for (i=0; i<4; i++)
                actors[i].reverse();
        }
        this.targetCount++;
    }

    // set elroy modes
    var dotsLeft = game.maxDots - game.dotCount;
    if (this.elroyWaitForClyde)
        blinky.elroy = 0;
    else {
        if (dotsLeft <= getElroy2DotsLeft())
            blinky.elroy = 2;
        else if (dotsLeft <= getElroy1DotsLeft())
            blinky.elroy = 1;
        else
            blinky.elroy = 0;
    }

    // update fruit
    if (this.fruitFramesLeft > 0) {
        this.fruitFramesLeft--;
    }
    else if (this.fruitScoreFramesLeft > 0) {
        this.fruitScoreFramesLeft--;
    }
};

//
// ================ GAME STATES ===================
//

var game = {};
game.maxDots = 244; // number of dots per level
game.highScore = 0;
game.init = function(s) {
    this.extraLives = 3;
    this.level = 1;
    this.score = 0;
    this.switchState(firstState);
};
game.switchState = function(s) {
    s.init();
    this.state = s;
};
game.addScore = function(p) {
    this.score += p;
    if (this.score > this.highScore)
        this.highScore = this.score;
    if (this.score == 10000)
        this.extraLives++;
};

//
// ================ start states =================
//

var firstState = {};
firstState.init = function() {
    this.frames = 0;
    resetTiles();
};
firstState.draw = function() {
    blitBackground();
    drawEnergizers();
    drawExtraLives();
    drawLevelIcons();
    drawScore();
    drawMessage("ready","#FF0");
};
firstState.update = function() {
    if (this.frames == 2*60) {
        game.extraLives--;
        game.switchState(startState);
    }
    else 
        this.frames++;
};

// common start state when the all players return to their places
var commonStartState = {};
commonStartState.init = function() {
    var i;
    for (i=0; i<5; i++)
        actors[i].reset();
    this.frame = 0;
};
commonStartState.draw = function() {
    blitBackground();
    drawEnergizers();
    drawActors();
    drawExtraLives();
    drawLevelIcons();
    drawScore();
    drawMessage("ready","#FF0");
};
commonStartState.update = function() {
    if (this.frame == 2*60)
        game.switchState(playState);
    this.frame++;
};

// start state for new level
var startState = { __proto__:commonStartState };
startState.init = function() {
    counter.onNewLevel();
    commonStartState.init.apply(this);
};

// start state for restarting level
var restartState = { __proto__:commonStartState };
restartState.init = function() {
    game.extraLives--;
    counter.onRestartLevel();
    commonStartState.init.apply(this);
};

//
// ================== play state ======================
//
var playState = {};
playState.init = function() {
    this.skippedFramesLeft = 0;
};
playState.draw = function() {
    blitBackground();
    drawEnergizers();
    drawFruit();
    drawActors();
    drawExtraLives();
    drawLevelIcons();
    drawScore();
};
playState.update = function() {

    var i;

    // skip this frame if needed,
    // but update ghosts running home
    if (this.skippedFramesLeft > 0) {
        for (i=0; i<4; i++)
            if (actors[i].mode == GHOST_GOING_HOME)
                actors[i].update();
        this.skippedFramesLeft--;
        return;
    }

    // update counter
    counter.update();

    // update actors
    for (i = 0; i<5; i++)
        actors[i].update();

    // test pacman collision with each ghost
    var g; // temporary ghost variable
    for (i = 0; i<4; i++) {
        g = actors[i];
        if (g.tile.x == pacman.tile.x && g.tile.y == pacman.tile.y) {
            if (g.mode == GHOST_OUTSIDE) {
                // somebody is going to die
                if (!g.scared) {
                    game.switchState(deadState);
                }
                else if (pacman.energized) {
                    pacman.eatPoints *= 2;
                    game.addScore(pacman.eatPoints);
                    g.onEaten();
                    this.skippedFramesLeft = 1*60;
                }
                break;
            }
        }
    }

    // test collision with fruit
    if (counter.fruitFramesLeft > 0 && pacman.pixel.y == fruitPixel.y && Math.abs(pacman.pixel.x - fruitPixel.x) <= midTile.x) {
        counter.fruitFramesLeft = 0;
        counter.fruitScoreFramesLeft = 3*60;
        game.addScore(getFruitPoints());
    }

    // finish level if all dots have been eaten
    if (game.dotCount == game.maxDots) {
        game.switchState(finishState);
    }
};

//
// ============== scripted states ===================
//

// a script state is special state that takes a dictionary
// of functions whose keys contain the time at which they
// are to begin execution.
// The functions are called by draw() and they are passed
// the current frame number starting at 0.
var scriptState = {};
scriptState.init = function() {
    this.frames = 0;
    this.scriptFunc = this.script[0];
    this.scriptFuncFrame = 0;
};
scriptState.draw = function() {
    blitBackground();
    drawEnergizers();
    drawExtraLives();
    drawLevelIcons();
    drawScore();
    this.scriptFunc(this.frames - this.scriptFuncFrame);
};
scriptState.update = function() {
    if (this.script[this.frames] != undefined) {
        this.firstFrame = true;
        this.scriptFunc = this.script[this.frames];
        this.scriptFuncFrame = this.frames;
    }
    this.frames++;
};

// freeze for a moment, then shrink and explode
var deadState = { __proto__: scriptState };
deadState.script = {
    0 : function(t) { drawActors(); },
    60 : function(t) { drawPacman(); },
    120 : function(t) { drawActor(pacman.pixel.x, pacman.pixel.y, pacman.color, actorSize*(60-t)/60); },
    180 : function(t) { var p = t/15; drawActor(pacman.pixel.x, pacman.pixel.y, "rgba(255,255,0,"+(1-p)+ ")", actorSize*p); },
    240 : function(t) { this.leave(); } 
};
deadState.leave = function() {
    game.switchState( game.extraLives == 0 ? overState : restartState);
};

// freeze for a moment then flash the tiles four times
var finishState = { __proto__: scriptState };
finishState.flashFloor = function(t) {
    if (this.firstFrame) {
        this.firstFrame = false;
        floorColor = (floorColor == brightFloorColor) ? normalFloorColor : brightFloorColor;
        drawBackground();
    }
    drawPacman();
};
finishState.leave = function() {
    game.level++;
    game.switchState(startState);
    resetTiles();
};
finishState.script = {
    0 : drawActors,
    60: drawPacman,
    120: finishState.flashFloor,
    135: finishState.flashFloor,
    150: finishState.flashFloor,
    165: finishState.flashFloor,
    180: finishState.flashFloor,
    195: finishState.flashFloor,
    210: finishState.flashFloor,
    225: finishState.flashFloor,
    255: finishState.leave,
};

// display game over
var overState = {};
overState.init = function() {
    // restart game when canvas is clicked
    canvas.onmousedown = function() {
        game.init();
        canvas.onmousedown = undefined;
    };
};
overState.draw = function() {
    blitBackground();
    drawEnergizers();
    drawExtraLives();
    drawLevelIcons();
    drawScore();
    drawMessage("game over", "#F00");
};
overState.update = function() {};

//
// =============== USER INPUT ==================
//

var initInput = function() {
    // make "focusable" to isolate keypresses when canvas is clicked
    canvas.tabIndex = 0;

    // activate input focus
    canvas.onmousedown = function(e) {
        this.focus();
    };

    // handle key press event
    canvas.onkeydown = function(e) {
        var key = (e||window.event).keyCode;
        switch (key) {
            case 65: case 37: pacman.setNextDir(DIR_LEFT); break; // left
            case 87: case 38: pacman.setNextDir(DIR_UP); break; // up
            case 68: case 39: pacman.setNextDir(DIR_RIGHT); break; // right
            case 83: case 40: pacman.setNextDir(DIR_DOWN); break;// down
            default: return;
        }
        e.preventDefault();
    };
};

//
// =============== HTML ELEMENT CREATION ==============
//

var canvas, ctx;
var bgCanvas, bgCtx;
var scale = 1.5; // scale of the canvas

var createCanvas = function() {

    canvas = document.createElement("canvas");
    canvas.width = widthPixels*scale;
    canvas.height = heightPixels*scale;
    ctx = canvas.getContext("2d");
    ctx.scale(scale,scale);

    bgCanvas = document.createElement("canvas");
    bgCanvas.width = widthPixels*scale;
    bgCanvas.height = heightPixels*scale;
    bgCtx = bgCanvas.getContext("2d");
    bgCtx.scale(scale,scale);

    var table = createTable();

    var pacmanDiv = document.getElementById('pacman');
    pacmanDiv.appendChild(canvas);
};

//
// input controls
//

var createControls = function() {

    var form = document.createElement('form');

    var aiCheckbox = document.createElement('input');
    aiCheckbox.type = 'checkbox';
    aiCheckbox.id = 'aiCheckbox';
    aiCheckbox.onchange = function() { pacman.ai = aiCheckbox.checked; };

    var label = document.createElement('label');
    label.htmlFor = 'aiCheckbox';
    label.appendChild(document.createTextNode('attract mode'));

    form.appendChild(aiCheckbox);
    form.appendChild(label);

    var pacmanDiv = document.getElementById('pacman');
    pacmanDiv.appendChild(form);
};

//
// debug tables
// 
var numWatches = 0;
var Watch = function(name, update) {
    this.name = name;
    this.update = update;
    this.index = numWatches++;
};

var watches = [
    //new Watch('dots eaten', function(){return game.dotCount}),
    //new Watch('energizer', function(){return pacman.energizedCount + "/" + getEnergizedTimeLimit();}),
    //new Watch('fruit', function(){return counter.fruitFramesLeft;}),
    //new Watch('elroy', function(){return blinky.elroy;}),
    //new Watch('last ghost command', function(){return ghostCommand;}),
    //new Watch('no eat timer', function(){return counter.framesSinceLastDot + "/" + getFramesSinceLastDotLimit();}),
    //new Watch('global dot', function(){return counter.dotCount;}),
    //new Watch('inky dot', function(){return inky.dotCount + "/" + inky.getDotLimit()}),
    //new Watch('clyde dot', function(){return clyde.dotCount + "/" + clyde.getDotLimit()}),
];

var createTable = function() {
    table = document.createElement("table");
    var i,w;
    var tableStr = "";
    for (i=0; i<numWatches; i++) {
        w = watches[i];
        tableStr += '<tr><td align="right"><span style="font-weight:bold;">' + w.name + '</span></td><td><span id="watch' + i + '"></span></td></tr>';
    }
    table.innerHTML = tableStr;
    return table;
};

var updateTable = function() {
    var i,w;
    for (i=0; i<numWatches; i++) {
        w = watches[i];
        document.getElementById('watch'+i).innerHTML = w.update();
    }
};

/*
game:
    - level
    - lives
    - kills
    - deaths
    - dots
    - score
    - high score
pacman:
    - energizer frames
    - global dot count
    - frames since last eat
    - fruit 
ghosts:
    - last command
ghost:
    - personal dot count
    - position
    - direction
    - speed
    - scared
    - mode
    - target
    - elroy

controls:
    - invincible
    - show targets
    - turn on AI
    - pause
    - slowdown
    - restart
*/

//
// =========== MAIN SETUP ==========
//

var framePeriod = 1000/60;
var nextFrameTime;

var tick = function() {
    // call update for every frame period that has elapsed
    while ((new Date).getTime() > nextFrameTime) {
        game.state.update();
        nextFrameTime += framePeriod;
    }
    // draw after updates are caught up
    game.state.draw();
};

// return sign of a number
var sign = function(x) {
    if (x<0) return -1;
    if (x>0) return 1;
    return 0;
};

window.onload = function() {

    // add HTML elements to pacman div
    createCanvas();
    createControls();

    // init various things
    initInput();
    initGhostCommandTimes();

    // display maze
    resetTiles();
    blitBackground();
    drawEnergizers();
    drawMessage("start", "#FFF");

    // begin game when canvas is clicked
    canvas.onmousedown = function() {
        game.init();
        startTime = (new Date).getTime();
        nextFrameTime = (new Date).getTime();
        setInterval(tick, framePeriod);
        canvas.onmousedown = undefined;
    };
};
