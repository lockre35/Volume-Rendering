/**
	ComS 336 - Project - ParseWorker.js
	Logan Laughery
	12/8/14

	
	Description
		Web worker that parses a file and returns the byte array to 
		the main function.  Also sends messages with information regarding
		how much of the parsing has been completed.
**/	


//Set up listener for when this worker receives a message
self.addEventListener('message', receiveMessage);
 
//When a message is received
function receiveMessage(e) {
    var data = e.data;
	switch (data.command){
		case 'start':
			parser(data.input);
			break;
		default:
			//unknown command
	}
}

//Simple function to load data from input file
//	-Loads each byte of the input file into an array
//	-Each byte represents a coordinate and a monochromatic color value
function parser(Input)
{
		//Values to be returned to the main function
		var Values = new Array();
		
		//Set up an array for returning the percentage of the file parsed
		var percentageComplete = [];
		percentageComplete[0] = Input.length/10;
		percentageComplete[1] = Input.length/10 * 2;
		percentageComplete[2] = Input.length/10 * 3;
		percentageComplete[3] = Input.length/10 * 4;
		percentageComplete[4] = Input.length/10 * 5;
		percentageComplete[5] = Input.length/10 * 6;
		percentageComplete[6] = Input.length/10 * 7;
		percentageComplete[7] = Input.length/10 * 8;
		percentageComplete[8] = Input.length/10 * 9;
		percentageComplete[9] = Input.length;
		percentageComplete[10] = Input.length + 1;
		
		var percentage = 0;
		
		//Parse the input file and store each byte in an array
		console.log("Parser called");
		for (var i = 0; i < Input.length; i++) {
			var byteStr = Input.charCodeAt(i).toString(16);
			Values.push(parseInt(byteStr, 16));
			//If we should send a percentage complete message to the main function
			if(i>percentageComplete[percentage])
			{
				percentage++;
				self.postMessage({'status':'partial','output':Values,'percentage':percentage});
				Values = new Array();
			}
		}
		self.postMessage({'status':'partial','output':Values});
		self.postMessage({'status': 'success'});
}

//Return values to the main function
function getValues()
{
	console.log("Values returned");
	return Values;
}