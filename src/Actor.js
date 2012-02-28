//////////////////////////////////////////////////////////////////////////////////////
// The actor class defines common data functions for the ghosts and pacman
// It provides everything for updating position and direction.

// "Ghost" and "Player" inherit from this "Actor"

// Actor constructor
var Actor = function() {

    this.dir = {};          // facing direction vector
    this.pixel = {};        // pixel position
    this.tile = {};         // tile position
    this.tilePixel = {};    // pixel location inside tile
    this.distToMid = {};    // pixel distance to mid-tile

    this.targetTile = {};   // tile position used for targeting

    this.frames = 0;        // frame count
    this.steps = 0;         // step count
};

// reset to initial position and direction
Actor.prototype.reset = function() {
    this.setDir(this.startDirEnum);
    this.setPos(this.startPixel.x, this.startPixel.y);
    this.frames = 0;
    this.steps = 0;
    this.targetting = false;
};

// sets the position and updates its dependent variables
Actor.prototype.setPos = function(px,py) {
    this.pixel.x = px;
    this.pixel.y = py;
    this.commitPos();
};

// updates the position's dependent variables
Actor.prototype.commitPos = function() {

    // use map-specific tunnel teleport
    tileMap.teleport(this);

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

// used as "pattern" parameter in getStepSizeFromTable()
var STEP_PACMAN = 0;
var STEP_GHOST = 1;
var STEP_PACMAN_FRIGHT = 2;
var STEP_GHOST_FRIGHT = 3;
var STEP_GHOST_TUNNEL = 4;
var STEP_ELROY1 = 5;
var STEP_ELROY2 = 6;

// getter function to extract a step size from speed control table
Actor.prototype.getStepSizeFromTable = (function(){

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

    return function(level, pattern) {
        var entry;
        if (level < 1) return;
        else if (level==1)                  entry = 0;
        else if (level >= 2 && level <= 4)  entry = 1;
        else if (level >= 5 && level <= 20) entry = 2;
        else if (level >= 21)               entry = 3;
        return stepSizes[entry*7*16 + pattern*16 + this.frames%16];
    };
})();

// updates the actor state
Actor.prototype.update = function(j) {

    // get number of steps to advance in this frame
    var numSteps = this.getNumSteps();
    if (j >= numSteps) 
        return;

    // request to advance one step, and increment count if step taken
    this.steps += this.step();

    // update head direction
    this.steer();
};

// retrieve four surrounding tiles and indicate whether they are open
getOpenSurroundTiles = function(tile,dirEnum) {

    // get open passages
    var openTiles = tileMap.getOpenTiles(tile).slice();
    var numOpenTiles = 0;
    var i;
    for (i=0; i<4; i++)
        if (openTiles[i])
            numOpenTiles++;

    // By design, no mazes should have dead ends,
    // but allow player to turn around if and only if it's necessary.
    // Only close the passage behind the player if there are other openings.
    var oppDirEnum = (dirEnum+2)%4; // current opposite direction enum
    if (numOpenTiles > 1)
        openTiles[oppDirEnum] = false;

    return openTiles;
};

// return the direction of the open, surrounding tile closest to our target
getTurnClosestToTarget = function(tile,targetTile,openTiles) {

    var dx,dy,dist;                      // variables used for euclidean distance
    var minDist = Infinity;              // variable used for finding minimum distance path
    var dir = {};
    var dirEnum = 0;
    var i;
    for (i=0; i<4; i++) {
        if (openTiles[i]) {
            setDirFromEnum(dir,i);
            dx = dir.x + tile.x - targetTile.x;
            dy = dir.y + tile.y - targetTile.y;
            dist = dx*dx+dy*dy;
            if (dist < minDist) {
                minDist = dist;
                dirEnum = i;
            }
        }
    }
    return dirEnum;
};

// draw a predicted path for the actor if it continues pursuing current target
Actor.prototype.drawPath = function(ctx) {
    if (!this.targetting) return;
    ctx.strokeStyle = this.pathColor;
    var i,j;

    // current state of the predicted path
    var tile = { x: this.tile.x, y: this.tile.y};
    var target = this.targetTile;
    var dir = { x: this.dir.x, y: this.dir.y };
    var dirEnum = this.dirEnum;
    var openTiles;

    // set initial path to center of current tile
    ctx.beginPath();
    ctx.moveTo(
            tile.x*tileSize+midTile.x+this.pathCenter.x,
            tile.y*tileSize+midTile.y+this.pathCenter.y);

    // maximum number of tiles to travel
    var numTiles = 40;

    // distance from center of the tile of current tile
    // (negative distance means we have not yet reached center)
    var dist = 0;
    if (dirEnum == DIR_UP)         dist = midTile.y - this.tilePixel.y;
    else if (dirEnum == DIR_DOWN)  dist = this.tilePixel.y - midTile.y;
    else if (dirEnum == DIR_LEFT)  dist = midTile.x - this.tilePixel.x;
    else if (dirEnum == DIR_RIGHT) dist = this.tilePixel.x - midTile.x;

    // if we are past the center of the tile, then we already know which direction to head for the next tile
    // so increment to next tile and draw a line to it
    if (dist >= 0) {
        tile.x += dir.x;
        tile.y += dir.y;
        ctx.lineTo(
                tile.x*tileSize+midTile.x+this.pathCenter.x,
                tile.y*tileSize+midTile.y+this.pathCenter.y);
    }

    for (i=0; i<numTiles ;i++) {

        // predict the next direction to turn at current tile
        openTiles = getOpenSurroundTiles(tile, dirEnum);
        if (this != pacman && tileMap.constrainGhostTurns)
            tileMap.constrainGhostTurns(tile, openTiles);
        dirEnum = getTurnClosestToTarget(tile, target, openTiles);
        setDirFromEnum(dir,dirEnum);

        // if the next tile is our target
        // move to target tile and draw a line to its center and exit function
        if (tile.x+dir.x == target.x && tile.y+dir.y == target.y) {
            tile.x += dir.x;
            tile.y += dir.y;
            ctx.lineTo(
                    tile.x*tileSize+midTile.x+this.pathCenter.x,
                    tile.y*tileSize+midTile.y+this.pathCenter.y);
            ctx.stroke();
            return;
        }

        // exit loop without drawing the next tile if we meet our travel limit
        if (i == numTiles-1)
            break;

        // move to next tile and draw a line to its center if we have more tiles to go
        tile.x += dir.x;
        tile.y += dir.y;
        ctx.lineTo(
                tile.x*tileSize+midTile.x+this.pathCenter.x,
                tile.y*tileSize+midTile.y+this.pathCenter.y);
    }

    // Here we know that we never reached the target tile.
    // So we finish drawing the path from the center of the previous tile to the
    // the center of the next tile plus the offset from the center of the initial tile.
    // This basically creates a smooth moving path that doesn't snap to the center of the tile.

    if (dist < 0) {
        // move to last tile, so we can jump back using the negative direction
        // (remember, we jump ahead one tile if dist>=0, so we jump ahead here to compensate)
        tile.x += dir.x;
        tile.y += dir.y;
    }

    // draw last path line by adding offset from the center of the initial tile
    ctx.lineTo(
            tile.x*tileSize+midTile.x+this.pathCenter.x+dist*dir.x,
            tile.y*tileSize+midTile.y+this.pathCenter.y+dist*dir.y);

    ctx.stroke();
};
