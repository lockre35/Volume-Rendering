/**
	ComS 336 - Project - Main.js
	Logan Laughery
	12/8/14

	
	Description
		This file is part of a Three.js implementation of the marching cubes algorithm which can be 
		used to display .raw 3D files and a few geometrical functions.  The application can be 
		generalized into the following components:
			
			Local File Parser
				-Allows users to load .raw 3D files from client machines 
				-Calls a web worker which is used to parse the uploaded file
				-Loads each byte into an array which can be parsed an displayed
				-Each byte represents a coordinate and color value within the 3D image
			
			Server File Parser
				-Uses XMLHttpRequest to load a file found on the server
				-The server file is simply an array with data for a 3D image
				-This array is similiar to the type created by local file parser
				
			3D Object Renderer
				-Iterates over the output of the previous parsers and applies the marching cube
				 algorithm (more detail provided in readme)
				 
			Function Renderer
				-Allows user to select a function to be rendered using the marching cube algorithm
				-Computes the value at each point of a marching cube using the specified function
	
	
	References
		(Implementation of marching cubes algorithm)
		http://paulbourke.net/geometry/polygonise/
	
		(List of functions and their shapes)
		http://homepage.univie.ac.at/herwig.hauser/bildergalerie/gallery.html
		
		(Information on parsing .raw 3D files)
		http://www.3dleds.com/bitmap.html
	
		(Cleaning all objects from the scene)
		http://stackoverflow.com/questions/18357529/threejs-remove-object-from-scene
			
		(Simple implementation of marching cubes in Three.js)
		http://stemkoski.github.io/Three.js/Marching-Cubes.html
**/




//Global variables
var binaryFile = new Array();
var values = new Array();
var sliceSize = 51;
var xLength = 256;
var yLength = 256;
var zLength = 256;
var marchingCubeSize=4;
var isoValue = 45;
var renderFunction = true;
var shapeFunction = "Circle";
var serverFileName = "assets/"+"Skull.txt";
var first = true;
var zSpacing = 1;

//Variables updated by renderer function
var upperLimit = sliceSize;
var lowerLimit = 0;
var shift = 0;
var rendered = false;
var pauseAnimation = false;

////////////////////////////////////////////
//Declare general listeners for the user interface//
////////////////////////////////////////////

//Settings button listener
document.getElementById("settingsButton").onclick = function ()
{
	$("#xLength").val(xLength);
	$("#yLength").val(yLength);
	$("#zLength").val(zLength);
	$("#cubeSize").val(marchingCubeSize);
	$("#spinner").val(isoValue);
};

//Update values based on what was select in the settings dialog
function updateSettings()
{
	xLength=parseInt($("#xLength").val(), 10);
	yLength=parseInt($("#yLength").val(), 10);
	zLength=parseInt($("#zLength").val(), 10);
	marchingCubeSize=parseFloat($("#cubeSize").val());
	isoValue=parseInt($("#spinner").val(), 10);
};

//Handle camera controls
function handleKeyPress(event)
{
  var ch = getChar(event);
  if (cameraControl(camera, ch)) return;
}


///////////////////////////////////////
//Set up listeners to draw a function//
///////////////////////////////////////

//All functions come from the following page:
//http://homepage.univie.ac.at/herwig.hauser/bildergalerie/gallery.html

//If the function button is clicked
document.getElementById("functionOpen").onclick = function () {   
	var values = new Array();
	renderFunction = true;
	shapeFunction = $("#shapes").val();
	$("#objectBox").dialog("close");
};

//Function to generate a surface based on a function
function getFunctionValue(x,y,z)
{
	switch(shapeFunction)
	{
		case "Circle":
			result = x*x + y*y + z*z - 10000;
			break;
		case "Crazy":
			result = Math.sin(x*y+x*z+y*z) + Math.sin(x*y) + Math.sin(y*z) + Math.sin(x*z) - 1;
			break;
		case "Distel":
			result = x*x + y*y + z*z + 1000 * (x*x + y*y) * (x*x + z*z) * (y*y + z*z);
			break;
		case "Heart":
			result = (x*x + 9/4*y*y + z*z - 1)*(x*x + 9/4*y*y + z*z - 1)*(x*x + 9/4*y*y + z*z - 1) - x*x*z*z*z - 9/80*y*y*z*z*z;
	}
	return result;
} 
  
  
  
  
///////////////////////////////////////////////////////////////////
//Set up request and listeners to load a file found on the server//
///////////////////////////////////////////////////////////////////

//This section loads a text file from the server onto the client machine
//The text file contains a method which sets the variable value to an array
//that represents a specific object.  This array is the same array that is created
//if you load a local file into the application.

//Begin loading an object that is found on the server using XMLHttpRequest
document.getElementById("serverOpen").onclick = function ()
{
	var values = new Array();
	serverFileName = "assets/" + $("#serverFiles").val();
	$("#objectBox").dialog("close");
	$( "#progressbar" ).progressbar({
	  value: 0
	});
	$("#progressBox").dialog("open");
	loadServerObject();
};
 
 
//Set up XMLHttpRequest and events to obtain a javascript array from the server
var oReq = new XMLHttpRequest();
function transferFailed(evt) {
  alert("An error occurred while transferring the file.");
}
function transferCanceled(evt) {
  alert("The transfer has been canceled by the user.");
}
	
//Load the server object
function loadServerObject() 
{   
	//Add different listeners to the request
	oReq.addEventListener("progress", updateProgress, false);
	oReq.addEventListener("load", transferComplete, false);
	oReq.addEventListener("error", transferFailed, false);
	oReq.addEventListener("abort", transferCanceled, false);
	
	//Set up the request to get the .txt file that contains javascript code
	oReq.open("GET", serverFileName,true);
	
	//Obtain progress of the transfer and update the progess bar
	function updateProgress (oEvent) {
		var percentComplete = oEvent.loaded / 44462127;
		$( "#progressbar" ).progressbar({
			  value: percentComplete*100
			});
		console.log(percentComplete);
	}

	//Load the values once the tranfer is complete
	function transferComplete(evt) {
		eval(oReq.responseText);
		switch(serverFileName)
		{
			case "assets/Skull.txt":
				addSkull();
				break;
		}
		$("#progressBox").dialog("close");
		renderFunction = false;
	}
	
	//Send the request
	oReq.send();
};  






////////////////////////////////////////////////////////////////////////////////
//Set up web worker and listeners for loading a local file from client machine//
////////////////////////////////////////////////////////////////////////////////

//If the upload file button is pressed
document.getElementById("fileButton").onclick = function ()
{
	document.getElementById("browseOpen").click();
}

//Set up the webworker using the ParseWorker function
worker = new Worker('js/ParseWorker.js');
worker.addEventListener('message', receiveMessage);

//Get messages from the parser
function receiveMessage(e) {
    var data = e.data;
	switch (data.status){
		//If the file upload and parsing was successful
		case 'success':
			$( "#progressbar" ).progressbar({
			  value: 100
			});
			renderFunction = false;
			$("#progressBox").dialog("close");
			break;
		//If the webworker sent a progress message we update the progress bar
		case 'partial':
			console.log(data.percentage+"0% done");
			if((data.percentage*10)<100)
			{
				$( "#progressbar" ).progressbar({
				  value: data.percentage*10
				});
			}
			values = values.concat(data.output);
			break;
		//If an error was encountered
		case 'error':
			//Throw some sort of alert
			break;
		//If an unknown message was sent by the web worker 
		default:
			//unknown status
	}
}

//If a user selects to upload a local file
document.getElementById("browseOpen").onchange = function () {         
	values = new Array();
	var fr = new FileReader();
	fr.onloadend = function () {
		values = new Array();
		$("#objectBox").dialog("close");
		$( "#progressbar" ).progressbar({
		  value: 0
		});
		$("#progressBox").dialog("open");
		//Start the webworker
		worker.postMessage({'command': 'start', 'input':this.result});
	};
	fr.readAsBinaryString(this.files[0]);
};


//Button to render the scene and call the marching cube algorithm
document.getElementById("renderButton").onclick = function ()
{
	//Pause the current animation
	//Reset rendering values
	pauseAnimation = true;
	upperLimit = sliceSize;
	lowerLimit = 0;
	shift = 0;
	rendered = false;
	
	//If this is not the first time rendering then we need to remove all objects
	//currently associated with the scene
	if(!first)
	{
		clean();
		init2();
		pauseAnimation = false;
	}
	else
	{
		init();
		pauseAnimation = false;
		animate();
	}
}



//When the page is loaded
function start()
{
	window.onkeypress = handleKeyPress;
}


////////////////////////////////////////////////////////////////////////////////
///////////The rest of this file is dedicated to rendering the scene////////////
////////////////////////////////////////////////////////////////////////////////


//Variables needed to render the scene
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();




//Called when we decide to render the scene (when render button is pressed)	
//Scene setup was adopted from: http://stemkoski.github.io/Three.js/Marching-Cubes.html
function init() 
{
	//This is no longer the first time we are rendering
	first = false;

	//Basic actions to set up the scene and camera
	scene = new THREE.Scene();
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(-512,0,0);
	camera.lookAt(new THREE.Vector3(0,0,0));
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	
	//Basic events to manage window resizing
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

	//FPS section of the canvas
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	
	//Adds lights to the scene
	init2();
}




//Extracts the lights from the normal init function so we can add them after
//removing all objects from the scene
function init2()
{
	//Light 1
	var light = new THREE.PointLight(0xffffff);
	light.position.set(-512,0,0);
	scene.add(light);

	//Light 2
	var light2 = new THREE.PointLight(0xffffff);
	light2.position.set(512,0,0);
	scene.add(light2);
	
	//Axis
	scene.add( new THREE.AxisHelper(100) );
}




//Clean function that removes all objects from the canvas
function clean()
{
	if(!first)
	{
		//Use underscore.js to remove scene objects
		//Found here http://stackoverflow.com/questions/18357529/threejs-remove-object-from-scene
		var objsToRemove = _.rest(scene.children, 1);
		_.each(objsToRemove, function( object ) {
			  scene.remove(object);
		});
	}
}




//Animation
function animate() 
{
	if(!pauseAnimation)
	{
		requestAnimationFrame( animate );
		if(renderFunction)
		{
			//If we are rendering functions
			renderFunctions();
		}
		else
		{
			//If we are rendering a different object
			render();
		}
		//Update the stats
		update();
	}
}




//Update statistics and controls
//	-Adopted from: http://stemkoski.github.io/Three.js/Marching-Cubes.html
function update()
{
	//Update the FPS object
	stats.update();
}




//Function to render an object that is not a function
//	-We increment through slices on the z-axis of the object and draw each slice.
//	-This is not needed but allows us to view the object as it loads piece by piece.
//	-The slice value can be set to anything but is not exposed to user input.
function render() 
{
	//If we are still rendering slices
	if(upperLimit<zLength && !rendered)
	{
		//Add a slice to the scene
		scene.add(marchLayer(lowerLimit,upperLimit,shift,marchingCubeSize, xLength, yLength, zLength, isoValue));
		//Shift the slice to align with previous slice
		shift+=marchingCubeSize*zSpacing+(sliceSize%marchingCubeSize);
	}
	//If we have rendered the entire object
	else
	{
		rendered = true;
	}
	//Increment to the next slice
	lowerLimit+=sliceSize;
	upperLimit+=sliceSize;
	
	//Call the render function
	renderer.render( scene, camera );
}




//Marching Cubes Algorithm
//	-Adopted from: http://paulbourke.net/geometry/polygonise/
//	-Adopted from: http://stemkoski.github.io/Three.js/Marching-Cubes.html
//	-Marches through data stored in the values array
//	-Creates a single mesh based on these data points
function marchLayer(lowSliceLimit, upperSliceLimit, shift, marchCubeSize, xLength, yLength, zLength, isolevel)
{
	// Vertices may occur along edges of cube, when the values at the edge's endpoints
	//   straddle the isolevel value.
	// Actual position along edge weighted according to function values.
	var vlist = new Array(12);
	var geometry = new THREE.Geometry();
	var vertexIndex = 0;

	//Loop through the values of the current slice and increment by the specified marching cube size
	for (var z = lowSliceLimit; z < upperSliceLimit - marchCubeSize; z+=marchCubeSize)
	for (var y = 0; y < yLength - marchCubeSize; y+=marchCubeSize)
	for (var x = 0; x < xLength - marchCubeSize; x+=marchCubeSize)
	{
		//Get the points of the current cube
		var p    = x + xLength * y + xLength * yLength * z,
			px   = p   + marchCubeSize,
			py   = p   + xLength * marchCubeSize,
			pxy  = py  + marchCubeSize,
			pz   = p   + xLength * yLength * marchCubeSize,
			pxz  = px  + xLength * yLength * marchCubeSize,
			pyz  = py  + xLength * yLength * marchCubeSize,
			pxyz = pxy + xLength * yLength * marchCubeSize;
		
		//Locate the isovalues of these points
		var value0 = values[ p    ],
			value1 = values[ px   ],
			value2 = values[ py   ],
			value3 = values[ pxy  ],
			value4 = values[ pz   ],
			value5 = values[ pxz  ],
			value6 = values[ pyz  ],
			value7 = values[ pxyz ];
		
		//From: http://paulbourke.net/geometry/polygonise/
		//	-We form an index of a an entry in the edge table by
		//	 inserting a "1" when a point is less than the specifiec
		//	 surface value.
		var points = [];
		var cubeindex = 0;
		if ( value0 < isolevel ) cubeindex |= 1;
		if ( value1 < isolevel ) cubeindex |= 2;
		if ( value2 < isolevel ) cubeindex |= 8;
		if ( value3 < isolevel ) cubeindex |= 4;
		if ( value4 < isolevel ) cubeindex |= 16;
		if ( value5 < isolevel ) cubeindex |= 32;
		if ( value6 < isolevel ) cubeindex |= 128;
		if ( value7 < isolevel ) cubeindex |= 64;
		var bits = THREE.edgeTable[ cubeindex ];
		
		//If no points are less than the surface value
		if ( bits === 0 ) continue;
		
		
		//Create Three.js points only if we will need them to draw our triangles 
		//(Helps with performance)
		if(bits & 1 || bits & 8 || bits & 256)
			points[p] = new THREE.Vector3(x,y,z*zSpacing);
		if(bits & 1 || bits & 2 || bits & 512)
			points[px] = new THREE.Vector3(x+marchCubeSize,y,z*zSpacing);
		if(bits & 2 || bits & 4 || bits & 1024)
			points[pxy] = new THREE.Vector3(x+marchCubeSize,y+marchCubeSize,z*zSpacing);
		if(bits & 4 || bits & 8 || bits & 2048)
			points[py] = new THREE.Vector3(x,y+marchCubeSize,z*zSpacing);
		if(bits & 16 || bits & 128 || bits & 256)
			points[pz] = new THREE.Vector3(x,y,(z+marchCubeSize)*zSpacing);
		if(bits & 16 || bits & 32 || bits & 512)
			points[pxz] = new THREE.Vector3(x+marchCubeSize,y,(z+marchCubeSize)*zSpacing);
		if(bits & 64 || bits & 128 || bits & 2048)
			points[pyz] = new THREE.Vector3(x,y+marchCubeSize,(z+marchCubeSize)*zSpacing);
		if(bits & 32 || bits & 64 || bits & 1024)
			points[pxyz] = new THREE.Vector3(x+marchCubeSize,y+marchCubeSize,(z+marchCubeSize)*zSpacing);
		
		
		//Look at edges that cross the surface we are attempting to draw
		//and estimate the point where the surface is crossed by interpolating
		//using the specified isovalue(surface value) and the two points that form
		//the edge. We then push these interpolated points to an array of vertices
		//	-Adopted from:http://paulbourke.net/geometry/polygonise/
		var mu = 0.5; 
		// bottom of the cube
		if ( bits & 1 )
		{		
			mu = ( isolevel - value0 ) / ( value1 - value0 );
			vlist[0] = points[p].clone().lerp( points[px], mu );
		}
		if ( bits & 2 )
		{
			mu = ( isolevel - value1 ) / ( value3 - value1 );
			vlist[1] = points[px].clone().lerp( points[pxy], mu );
		}
		if ( bits & 4 )
		{
			mu = ( isolevel - value2 ) / ( value3 - value2 );
			vlist[2] = points[py].clone().lerp( points[pxy], mu );
		}
		if ( bits & 8 )
		{
			mu = ( isolevel - value0 ) / ( value2 - value0 );
			vlist[3] = points[p].clone().lerp( points[py], mu );
		}
		// top of the cube
		if ( bits & 16 )
		{
			mu = ( isolevel - value4 ) / ( value5 - value4 );
			vlist[4] = points[pz].clone().lerp( points[pxz], mu );
		}
		if ( bits & 32 )
		{
			mu = ( isolevel - value5 ) / ( value7 - value5 );
			vlist[5] = points[pxz].clone().lerp( points[pxyz], mu );
		}
		if ( bits & 64 )
		{
			mu = ( isolevel - value6 ) / ( value7 - value6 );
			vlist[6] = points[pyz].clone().lerp( points[pxyz], mu );
		}
		if ( bits & 128 )
		{
			mu = ( isolevel - value4 ) / ( value6 - value4 );
			vlist[7] = points[pz].clone().lerp( points[pyz], mu );
		}
		// vertical lines of the cube
		if ( bits & 256 )
		{
			mu = ( isolevel - value0 ) / ( value4 - value0 );
			vlist[8] = points[p].clone().lerp( points[pz], mu );
		}
		if ( bits & 512 )
		{
			mu = ( isolevel - value1 ) / ( value5 - value1 );
			vlist[9] = points[px].clone().lerp( points[pxz], mu );
		}
		if ( bits & 1024 )
		{
			mu = ( isolevel - value3 ) / ( value7 - value3 );
			vlist[10] = points[pxy].clone().lerp( points[pxyz], mu );
		}
		if ( bits & 2048 )
		{
			mu = ( isolevel - value2 ) / ( value6 - value2 );
			vlist[11] = points[py].clone().lerp( points[pyz], mu );
		}
		
		//Render the triangle
		//	-Taken from: http://stemkoski.github.io/Three.js/Marching-Cubes.html
		var i = 0;
		cubeindex <<= 4;  // multiply by 16... 
		// "Re-purpose cubeindex into an offset into triTable." 
		//  since each row really isn't a row.
		 
		// the while loop should run at most 5 times,
		//   since the 16th entry in each row is a -1.
		while ( THREE.triTable[ cubeindex + i ] != -1 ) 
		{
			var index1 = THREE.triTable[cubeindex + i];
			var index2 = THREE.triTable[cubeindex + i + 1];
			var index3 = THREE.triTable[cubeindex + i + 2];
			
			geometry.vertices.push( vlist[index1].clone() );
			geometry.vertices.push( vlist[index2].clone() );
			geometry.vertices.push( vlist[index3].clone() );
			var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);
			geometry.faces.push( face );
			geometry.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );
			vertexIndex += 3;
			i += 3;
		}
	}
	
	//Render the slice
	geometry.computeCentroids();
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	var mesh = new THREE.Mesh( geometry, colorMaterial );
	
	//Transform the object so that it centers on the origin
	mesh.rotation.x = (Math.PI/180)*-90;
	mesh.position.y -= shift;
	mesh.position.y -= (zLength*zSpacing)/2;
	mesh.position.x -= xLength/2;
	mesh.position.z += yLength/2;

	return mesh;
}



//Function to render an object that is a function
//	-We add the shape once and then don't add anything else (no slices as in previous render function)
function renderFunctions() 
{
	if(!rendered)
		scene.add(marchLayerFunction(lowerLimit,upperLimit,shift,marchingCubeSize, xLength, yLength, zLength, isoValue));
	rendered = true;
	renderer.render( scene, camera );
}



//Marching Cubes Algorithm
//	-Adopted from: http://paulbourke.net/geometry/polygonise/
//	-Adopted from: http://stemkoski.github.io/Three.js/Marching-Cubes.html
//	-Marches through each cube and then computes the value at all points of each cube
//	-Creates a single mesh based on these data points
function marchLayerFunction(lowSliceLimit, upperSliceLimit, shift, marchCubeSize, xLength, yLength, zLength, isolevel)
{
	// Vertices may occur along edges of cube, when the values at the edge's endpoints
	// straddle the isolevel value.
	// Actual position along edge weighted according to function values.
	var vlist = new Array(12);
	var geometry = new THREE.Geometry();
	var vertexIndex = 0;

	//Loop through the values of the current slice and increment by the specified marching cube size
	for (var z = -zLength; z < zLength - marchCubeSize; z+=marchCubeSize)
	for (var y = -yLength; y < yLength - marchCubeSize; y+=marchCubeSize)
	for (var x = -xLength; x < xLength - marchCubeSize; x+=marchCubeSize)
	{
		//Create an index for each point on the cube
		var p    = 1,
			px   = 2,
			py   = 3,
			pxy  = 4,
			pz   = 5,
			pxz  = 6,
			pyz  = 7,
			pxyz = 8;
		
		//Find the isovalues of the given function at each point on the cube
		var value0 = getFunctionValue(x,y,z),
			value1 = getFunctionValue(x+marchCubeSize,y,z),
			value2 = getFunctionValue(x,y+marchCubeSize,z),
			value3 = getFunctionValue(x+marchCubeSize,y+marchCubeSize,z),
			value4 = getFunctionValue(x,y,z+marchCubeSize),
			value5 = getFunctionValue(x+marchCubeSize,y,z+marchCubeSize),
			value6 = getFunctionValue(x,y+marchCubeSize,z+marchCubeSize),
			value7 = getFunctionValue(x+marchCubeSize,y+marchCubeSize,z+marchCubeSize);
		
		//From: http://paulbourke.net/geometry/polygonise/
		//	-We form an index of a an entry in the edge table by
		//	 inserting a "1" when a point is less than the specifiec
		//	 surface value.
		var points = [];
		var cubeindex = 0;
		if ( value0 < isolevel ) cubeindex |= 1;
		if ( value1 < isolevel ) cubeindex |= 2;
		if ( value2 < isolevel ) cubeindex |= 8;
		if ( value3 < isolevel ) cubeindex |= 4;
		if ( value4 < isolevel ) cubeindex |= 16;
		if ( value5 < isolevel ) cubeindex |= 32;
		if ( value6 < isolevel ) cubeindex |= 128;
		if ( value7 < isolevel ) cubeindex |= 64;
		var bits = THREE.edgeTable[ cubeindex ];
		
		//If no points are less than the surface value
		if ( bits === 0 ) continue;
		
		
		//Create Three.js points only if we will need them to draw our triangles 
		//(Helps with performance)
		if(bits & 1 || bits & 8 || bits & 256)
			points[p] = new THREE.Vector3(x,y,z);
		if(bits & 1 || bits & 2 || bits & 512)
			points[px] = new THREE.Vector3(x+marchCubeSize,y,z);
		if(bits & 2 || bits & 4 || bits & 1024)
			points[pxy] = new THREE.Vector3(x+marchCubeSize,y+marchCubeSize,z);
		if(bits & 4 || bits & 8 || bits & 2048)
			points[py] = new THREE.Vector3(x,y+marchCubeSize,z);
		if(bits & 16 || bits & 128 || bits & 256)
			points[pz] = new THREE.Vector3(x,y,(z+marchCubeSize));
		if(bits & 16 || bits & 32 || bits & 512)
			points[pxz] = new THREE.Vector3(x+marchCubeSize,y,(z+marchCubeSize));
		if(bits & 64 || bits & 128 || bits & 2048)
			points[pyz] = new THREE.Vector3(x,y+marchCubeSize,(z+marchCubeSize));
		if(bits & 32 || bits & 64 || bits & 1024)
			points[pxyz] = new THREE.Vector3(x+marchCubeSize,y+marchCubeSize,(z+marchCubeSize));
		
		
		//Look at edges that cross the surface we are attempting to draw
		//and estimate the point where the surface is crossed by interpolating
		//using the specified isovalue(surface value) and the two points that form
		//the edge. We then push these interpolated points to an array of vertices
		//	-Adopted from:http://paulbourke.net/geometry/polygonise/
		var mu = 0.5; 
		// bottom of the cube
		if ( bits & 1 )
		{		
			mu = ( isolevel - value0 ) / ( value1 - value0 );
			vlist[0] = points[p].clone().lerp( points[px], mu );
		}
		if ( bits & 2 )
		{
			mu = ( isolevel - value1 ) / ( value3 - value1 );
			vlist[1] = points[px].clone().lerp( points[pxy], mu );
		}
		if ( bits & 4 )
		{
			mu = ( isolevel - value2 ) / ( value3 - value2 );
			vlist[2] = points[py].clone().lerp( points[pxy], mu );
		}
		if ( bits & 8 )
		{
			mu = ( isolevel - value0 ) / ( value2 - value0 );
			vlist[3] = points[p].clone().lerp( points[py], mu );
		}
		// top of the cube
		if ( bits & 16 )
		{
			mu = ( isolevel - value4 ) / ( value5 - value4 );
			vlist[4] = points[pz].clone().lerp( points[pxz], mu );
		}
		if ( bits & 32 )
		{
			mu = ( isolevel - value5 ) / ( value7 - value5 );
			vlist[5] = points[pxz].clone().lerp( points[pxyz], mu );
		}
		if ( bits & 64 )
		{
			mu = ( isolevel - value6 ) / ( value7 - value6 );
			vlist[6] = points[pyz].clone().lerp( points[pxyz], mu );
		}
		if ( bits & 128 )
		{
			mu = ( isolevel - value4 ) / ( value6 - value4 );
			vlist[7] = points[pz].clone().lerp( points[pyz], mu );
		}
		// vertical lines of the cube
		if ( bits & 256 )
		{
			mu = ( isolevel - value0 ) / ( value4 - value0 );
			vlist[8] = points[p].clone().lerp( points[pz], mu );
		}
		if ( bits & 512 )
		{
			mu = ( isolevel - value1 ) / ( value5 - value1 );
			vlist[9] = points[px].clone().lerp( points[pxz], mu );
		}
		if ( bits & 1024 )
		{
			mu = ( isolevel - value3 ) / ( value7 - value3 );
			vlist[10] = points[pxy].clone().lerp( points[pxyz], mu );
		}
		if ( bits & 2048 )
		{
			mu = ( isolevel - value2 ) / ( value6 - value2 );
			vlist[11] = points[py].clone().lerp( points[pyz], mu );
		}
		
		//Render the triangle
		//	-Taken from: http://stemkoski.github.io/Three.js/Marching-Cubes.html
		var i = 0;
		cubeindex <<= 4;  // multiply by 16... 
		// "Re-purpose cubeindex into an offset into triTable." 
		//  since each row really isn't a row.
		 
		// the while loop should run at most 5 times,
		//   since the 16th entry in each row is a -1.
		while ( THREE.triTable[ cubeindex + i ] != -1 ) 
		{
			var index1 = THREE.triTable[cubeindex + i];
			var index2 = THREE.triTable[cubeindex + i + 1];
			var index3 = THREE.triTable[cubeindex + i + 2];
			
			geometry.vertices.push( vlist[index1].clone() );
			geometry.vertices.push( vlist[index2].clone() );
			geometry.vertices.push( vlist[index3].clone() );
			var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);
			geometry.faces.push( face );
			geometry.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );
			vertexIndex += 3;
			i += 3;
		}
	}
	//Render the shape
	geometry.computeCentroids();
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	var mesh = new THREE.Mesh( geometry, colorMaterial );

	return mesh;
}