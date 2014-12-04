
//Global variables
var binaryFile = new Array();
var values = new Array();
var sliceSize = 173;
var xLength = 512;
var yLength = 512;
var zLength = 174;
var marchingCubeSize=1;
var isoValue = 150;
var destroy = false;
var renderFunction = false;

worker = new Worker('ParseWorker.js');
worker.addEventListener('message', receiveMessage);

//Get messages from the parser
function receiveMessage(e) {
    var data = e.data;
	switch (data.status){
		case 'success':
			$( "#progressbar" ).progressbar({
			  value: 100
			});
			init();
			animate();
			break;
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
		case 'error':
			//Throw some sort of alert
			break;
		default:
			//unknown status
	}
}

////////////////////////////////////////////
//Declare listeners for the user interface//
////////////////////////////////////////////

//Handle camera controls
function handleKeyPress(event)
{
  var ch = getChar(event);
  if (cameraControl(camera, ch)) return;
}

//If the function button is clicked
document.getElementById("functionButton").onclick = function () {   
	renderFunction = true;
	init();
	animate();
};      

//Function to generate a surface based on a function
function getFunctionValue(x,y,z)
{
	result = x*x + y*y + z*z - 10000;
	return result;
} 


//If a new file is uploaded
document.getElementById("browseOpen").onchange = function () {         
	destroy = true;
	var fr = new FileReader();
	fr.onloadend = function () {
		values = new Array();
		destroy = false;
		//setInput(this.result);
		$( "#progressbar" ).progressbar({
		  value: 0
		});
		worker.postMessage({'command': 'start', 'input':this.result});
		//parser(this.result,values);
	};
	fr.readAsBinaryString(this.files[0]);
};

//When the page is loaded
function start()
{
	window.onkeypress = handleKeyPress;
}



// MAIN
// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
// custom global variables


// FUNCTIONS 		
function init() 
{
	// SCENE
	scene = new THREE.Scene();
	// CAMERA
	var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
	var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
	camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
	scene.add(camera);
	camera.position.set(-512,0,0);
	camera.lookAt(new THREE.Vector3(0,0,0));
	
	// RENDERER
	if ( Detector.webgl )
		renderer = new THREE.WebGLRenderer( {antialias:true} );
	else
		renderer = new THREE.CanvasRenderer(); 
	renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
	container = document.getElementById( 'ThreeJS' );
	container.appendChild( renderer.domElement );
	
	// EVENTS
	THREEx.WindowResize(renderer, camera);
	THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

	// STATS
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	stats.domElement.style.zIndex = 100;
	container.appendChild( stats.domElement );
	
	// LIGHT
	var light = new THREE.PointLight(0xffffff);
	light.position.set(-512,0,0);
	scene.add(light);
	 
	// AXIS HELPER
	scene.add( new THREE.AxisHelper(100) );
}

//Animation
function animate() 
{
	if(!destroy)
	{
	    requestAnimationFrame( animate );
		if(renderFunction)
		{
			renderFunctions();
		}
		else
		{
			render();
		}
		update();
	}
}

//Update statistics and controls
function update()
{
	//controls.update();
	stats.update();
}

//Variables updated by renderer function
var upperLimit = sliceSize;
var lowerLimit = 0;
var shift = 0;
function render() 
{
	if(upperLimit<zLength)
	{
		scene.add(marchLayer(lowerLimit,upperLimit,shift,marchingCubeSize, xLength, yLength, zLength, isoValue));
		shift+=2;
	}
	lowerLimit+=sliceSize;
	upperLimit+=sliceSize;
	renderer.render( scene, camera );
}

// Marching Cubes Algorithm
function marchLayer(lowSliceLimit, upperSliceLimit, shift, marchCubeSize, xLength, yLength, zLength, isolevel)
{
	var zSpacing = 3;
	// Vertices may occur along edges of cube, when the values at the edge's endpoints
	//   straddle the isolevel value.
	// Actual position along edge weighted according to function values.
	var vlist = new Array(12);
	var geometry = new THREE.Geometry();
	var vertexIndex = 0;
	//alert("low"+lowSliceLimit+"high"+upperSliceLimit+"march"+marchCubeSize+"x"+xLength+"y"+yLength+"z"+zLength);
	for (var z = lowSliceLimit; z < upperSliceLimit - marchCubeSize; z+=marchCubeSize)
	for (var y = 0; y < yLength - marchCubeSize; y+=marchCubeSize)
	for (var x = 0; x < xLength - marchCubeSize; x+=marchCubeSize)
	{
		// index of base point, and also adjacent points on cube
		var p    = x + xLength * y + xLength * yLength * z,
			px   = p   + marchCubeSize,
			py   = p   + xLength * marchCubeSize,
			pxy  = py  + marchCubeSize,
			pz   = p   + xLength * yLength * marchCubeSize,
			pxz  = px  + xLength * yLength * marchCubeSize,
			pyz  = py  + xLength * yLength * marchCubeSize,
			pxyz = pxy + xLength * yLength * marchCubeSize;
		
		// store scalar values corresponding to vertices
		var value0 = values[ p    ],
			value1 = values[ px   ],
			value2 = values[ py   ],
			value3 = values[ pxy  ],
			value4 = values[ pz   ],
			value5 = values[ pxz  ],
			value6 = values[ pyz  ],
			value7 = values[ pxyz ];
		
		// place a "1" in bit positions corresponding to vertices whose
		//   isovalue is less than given constant.
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
		
		// bits = 12 bit number, indicates which edges are crossed by the isosurface
		var bits = THREE.edgeTable[ cubeindex ];
		
		// if none are crossed, proceed to next iteration
		if ( bits === 0 ) continue;
		
		// check which edges are crossed, and estimate the point location
		//    using a weighted average of scalar values at edge endpoints.
		// store the vertex in an array for use later.
		var mu = 0.5; 
		
		
		// create the points of the current marching cube
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
		
		// construct triangles -- get correct vertices from triTable.
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
	
	geometry.computeCentroids();
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	
	var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	var mesh = new THREE.Mesh( geometry, colorMaterial );
	mesh.rotation.x = (Math.PI/180)*-90;
	mesh.position.y -= shift;
	
	mesh.position.y -= (zLength*zSpacing)/2;
	mesh.position.x -= xLength/2;
	mesh.position.z += yLength/2;

	//mesh.rotation.y = (Math.PI/180)*90;
	return mesh;
}

//Variables updated by renderer function
var rendered = false;
function renderFunctions() 
{
	if(!rendered)
		scene.add(marchLayerFunction(lowerLimit,upperLimit,shift,marchingCubeSize, xLength, yLength, zLength, isoValue));
	rendered = true;
	renderer.render( scene, camera );
}

// Marching Cubes Algorithm
function marchLayerFunction(lowSliceLimit, upperSliceLimit, shift, marchCubeSize, xLength, yLength, zLength, isolevel)
{
	var zSpacing = 1;
	// Vertices may occur along edges of cube, when the values at the edge's endpoints
	//   straddle the isolevel value.
	// Actual position along edge weighted according to function values.
	var vlist = new Array(12);
	var geometry = new THREE.Geometry();
	var vertexIndex = 0;
	//alert("low"+lowSliceLimit+"high"+upperSliceLimit+"march"+marchCubeSize+"x"+xLength+"y"+yLength+"z"+zLength);
	for (var z = -zLength; z < zLength - marchCubeSize; z+=marchCubeSize)
	for (var y = -yLength; y < yLength - marchCubeSize; y+=marchCubeSize)
	for (var x = -xLength; x < xLength - marchCubeSize; x+=marchCubeSize)
	{
		// index of base point, and also adjacent points on cube
		var p    = 1,
			px   = 2,
			py   = 3,
			pxy  = 4,
			pz   = 5,
			pxz  = 6,
			pyz  = 7,
			pxyz = 8;
		
		// store scalar values corresponding to vertices
		var value0 = getFunctionValue(x,y,z),
			value1 = getFunctionValue(x+marchCubeSize,y,z),
			value2 = getFunctionValue(x,y+marchCubeSize,z),
			value3 = getFunctionValue(x+marchCubeSize,y+marchCubeSize,z),
			value4 = getFunctionValue(x,y,z+marchCubeSize),
			value5 = getFunctionValue(x+marchCubeSize,y,z+marchCubeSize),
			value6 = getFunctionValue(x,y+marchCubeSize,z+marchCubeSize),
			value7 = getFunctionValue(x+marchCubeSize,y+marchCubeSize,z+marchCubeSize);
		
		// place a "1" in bit positions corresponding to vertices whose
		//   isovalue is less than given constant.
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
		
		// bits = 12 bit number, indicates which edges are crossed by the isosurface
		var bits = THREE.edgeTable[ cubeindex ];
		
		// if none are crossed, proceed to next iteration
		if ( bits === 0 ) continue;
		
		// check which edges are crossed, and estimate the point location
		//    using a weighted average of scalar values at edge endpoints.
		// store the vertex in an array for use later.
		var mu = 0.5; 
		
		
		// create the points of the current marching cube
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
		
		// construct triangles -- get correct vertices from triTable.
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
	
	geometry.computeCentroids();
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	
	var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0x0000ff, side: THREE.DoubleSide} );
	var mesh = new THREE.Mesh( geometry, colorMaterial );

	mesh.position.x+= 250;
	mesh.position.y+= 250;
	mesh.position.z-= 250;
	//mesh.rotation.y = (Math.PI/180)*90;
	return mesh;
}