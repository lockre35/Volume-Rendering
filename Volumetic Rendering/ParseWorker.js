


self.addEventListener('message', receiveMessage);
 
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
function parser(Input)
{

		var Values = new Array();
		
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
		
		console.log("Parser called");
		for (var i = 0; i < Input.length; i++) {
			var byteStr = Input.charCodeAt(i).toString(16);
			Values.push(parseInt(byteStr, 16));
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

function getValues()
{
	console.log("Values returned");
	return Values;
}