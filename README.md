#Volumetric Rendering

##Introduction

This application implements the marching cube algorithm using Three.js so that medical images and functions can be displayed in a web browser.  When viewing medical images, the surface level can be changed to display different elements of an image.  For example, we can look at the surface of a human foot and after increasing the surface value, we can view the skeletal structure of a foot.

##Usage

The application can be found here 
(http://softwarego.no-ip.biz/FinalProject/Volumetic%20Rendering/MarchingCubesAlgorithm.html).  Additional .raw 3D files can be downloaded here (http://www.volvis.org/).  To use the application, users need to select an object to render, update rendering settings, and render the file.

#####Select Object to Render
* Press the Select Object button
* Depending on type of object, a value from the dropdowns may need to be selected
* Press either Load 3D File, Load Function, or Upload A Local File
* Wait for the object to load
* Once all dialog boxes are automatically closed, the object can be rendered

#####Update Rendering Settings
* Press the Settings button
* In the following dialog, enter necessary values
* Rendering settings are specific to the type of file or function being rendered
* Specific rendering settings are displayed later in this document

#####Render An Object
* Simply press the button on the upper right hand corner of the screen
* The object will load automatically
* If the object does not load or the page crashes, try decreasing the cube size and adjusting other settings

##Algorithm Implementation
The marching cubes algorithm used is based on the algorithm described in this aritcle (http://paulbourke.net/geometry/polygonise/).  The basic idea is that we take a 3D object that is represented with a function or points and divide it into a grid of cubes.  We then look at each cube individually and determine if a surface of the 3D object is present inside the cube.  

#####Render A Function
The implementation used here uses the algorithm described in the Paul Bourke paper linked earlier.  When rendering a function, the application divides the area specified by the user in the settings into cubes, each with a user specified size.  A function then loops through each cube and computes the function value at the four points of the cube.  We then build a binary value by looking at which points are lower than the isovalue specified by the user.  We then look at which edges of the cubes are intersected by the surface of the function.  If there is an intersection along the edge, we use interpolation to compute the estimated location of the point.  Finally, we use the triangle table presented in the Paul Bourke paper to create the triangles found within the current marching cube.  We then apply smoothing to the entire object to make everything look cleaner.

#####Render A 3D File
To understand how the .raw 3D files are rendered, we must first look at how data is stored in the files.  A description of how data is stored can be found here (http://www.3dleds.com/bitmap.html).  Basically, each byte of the file stores a decimal value from 0 to 255.  These bytes are then used to form a stack of 2D images where each byte is at a different point.  The application stores the byte array and then itterates through the marching cubes as before but instead of computing a value for each point of a cube, the application gets a corresponding value from the byte array.  

##Object Settings
Below are some settings that help render different objects correctly.  If you are using a file not described here, you will need to find the settings on your own.

#####Skull.txt
    XLength: 256
    YLength: 256
    ZLength: 256
    CubeSize: 2
    IsoValue: 45

#####Circle - x^2 + y^2 + z^2 - 10000
    XLength: 256
    YLength: 256
    ZLength: 256
    CubeSize: 4
    IsoValue: 45
    
#####Distel - x^2 + y^2 + z^2 + 1000(x^2 + y^2)(x^2 + z^2)(y^2 + z^2)
    XLength: 3
    YLength: 3
    ZLength: 3
    CubeSize: .025
    IsoValue: 60
    
#####Heart - (x^2 + (9yy)/4 + z^2 - 1)^3 - x^2z^3 - (9y^2z^3)/80
    XLength: 2
    YLength: 2
    ZLength: 2
    CubeSize: .02
    IsoValue: 0

#####Crazy - sin(xy + xz + yz) + sin(xy) + sin(yz) + sin(xz) - 1
    XLength: 3
    YLength: 3
    ZLength: 3
    CubeSize: .1
    IsoValue: 0

##References
The code in custom-ui.js, ParseWorker.js, and MarchingCubeAlgorithm.html was all written by me.  Much of Main.js was also written by me however part of the algorithm for maching cubes was adapted from the Paul Bourke paper.  This includes the lines dedicated to using the look up table provided in MarchingCubeEdges.js which was taken from the Paul Bourke paper as well.  A majority of the other files in the application were not written by me but only provide Three.js support.
* Gallery of geometric functions (http://homepage.univie.ac.at/herwig.hauser/bildergalerie/gallery.html)
* Marching cube algorithm (http://paulbourke.net/geometry/polygonise/)
* Three.js marching cubes (http://stemkoski.github.io/Three.js/Marching-Cubes.html)
* .Raw 3D file structure (http://www.3dleds.com/bitmap.html)
* Cleaning objects from scene (http://stackoverflow.com/questions/18357529/threejs-remove-object-from-scene)

