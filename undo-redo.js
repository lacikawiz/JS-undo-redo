/*
	JS-Undo-Redo

	Verion: 0.7
	Original Publish Date: 2015-02-06
	Latest: 2018-08-29

	Author: Laszlo Szenes
	License: MIT

	Implementing an undo-redo functionality to save and restore states based on data
	stored in an object, utilizing HTML5 Localstorage

	LS = abbreviation for Localstorage
*/

//paramaters:
// workObj: the object that will get saved/restored - given here once to avoid repetition
// delay: time in ms, between automatic save attempts, default is 30000 (30 sec). Minus value means don't do scheduled save
// stacksize: how many steps we can go back
function undoRedo(workObj,delay,stackSize){
	var stackSize=stackSize || 10;  //default is 10
	var delay=delay || 30000

	//these are the working copies of the stacks
	//these gets saves to localStorage at every change
	var stUndo=[];      //undo stack
	var stRedo=[];		//redo stack
	var lastSav;		//last saved state 

	var L=localStorage; //shorthand for localStorage

//adding a new value onto the stack
	function save(){
		var mod={l:1}; //to track which variable need syncing to LS
		var w=JSON.stringify(workObj);

		if(lastSav && JSON.stringify(lastSav)==w) return; //nothing changed, nothing to save

		if(lastSav) {
			stUndo.push(lastSav);
			if(stUndo.length>stackSize) stUndo.shift(); //removing the oldest one, if too many states have been saved
			mod.u=1
		};
		if(stRedo.length>0) {stRedo.length=0;mod.r=1};    //saving a new state invalidates the redo stack
		lastSav=JSON.parse(w); //object duplication 
		syncLS(mod);
	}

//do an restore to last saved state
	function undo(){
		save();  //make sure any last minute changes are saved
		if(stUndo.length>0) {
			stRedo.push(lastSav);
			lastSav=stUndo.pop();
			extend(workObj,lastSav);
			syncLS();  //sync all
		}
	}

//doing the redo
	function redo(){
		save(); //make sure any last minute changes are saved
		if(stRedo.length>0) {
			stUndo.push(lastSav);
			lastSav=stRedo.pop();
			extend(workObj,lastSav);
			syncLS();  //sync all
		}		
	}

	//clearing out the undo/redo stack
	function clear(){
		localStorage.clear();
		lastSav=false;
		stUndo.length=0;
		stRedo.length=0;
	}

//check if there was anything left behind from last session
//restore record if anything was saved previously
	if(L.lastSav) {
		lastSav=JSON.parse(L.lastSav);
		extend(workObj,lastSav);  //restoring the last saved state
		if(L.stUndo) stUndo=JSON.parse(L.stUndo);  //restoring undo stack
		if(L.stRedo) stRedo=JSON.parse(L.stRedo);  //restoring redo stack
	}


//=========helper functions
//special `extend` which deletes arrays elements in order to accomodate restoring decreasing arrays
	function extend (target, source) {
	  target = target || {};
	  if(target.length+"" != "undefined"){ //if it's an array
		while(target.length > source.length) {  //make the two array the same length
    		target.pop();
		}
	  }
	  for (var prop in source) {  //do a deep copy of the object recursively
	    if (typeof source[prop] === 'object') {
	      target[prop] = extend(target[prop], source[prop]);
	    } else {
	      target[prop] = source[prop];
	    }
	  }
	  return target;
	}	

	//syncing (saving) to LocalStorage
	function syncLS(what){
		what= what || {u:1,l:1,r:1};  //U=undo, L=lastSav, R=redo
		if(what.u) L.stUndo=JSON.stringify(stUndo);
		if(what.r) L.stRedo=JSON.stringify(stRedo);
		if(what.l) L.lastSav=JSON.stringify(lastSav);
	}

	if(delay>0)	setInterval(save,delay)   

	return {  //exposing the API functions
		save: save,
		undo: undo,
		redo: redo,
		clear: clear,
		hasUndo: function(){return stUndo.length>0},
		hasRedo: function(){return stRedo.length>0},
	}
}
