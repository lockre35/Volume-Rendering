$(function() 
{
	//Adjust the dialog box size depending on screen size
	var boxWidth = 600;
	if(document.getElementById("navBar").offsetWidth < 600)
		boxWidth = document.getElementById("navBar").offsetWidth - 20;
		
	//Set z index
	var dialogZindex =  101;
	
	//Open buttons
	$("#browseOpen")
    .button();
	
	$("#functionOpen")
	.button();
	
	$("#serverOpen")
	.button();
	
	$("#fileButton")
	.button();
	
	$("#serverFiles")
	.selectmenu();
	
	$("#serverFiles-button").css( 
	{
	   "height":"35px"
	});
	
	$('.ui-selectmenu-open').css('z-index', dialogZindex);
	$('.ui-selectmenu-button').click( function() { dialogZindex+= 1; $('.ui-selectmenu-open').css('z-index', dialogZindex); });
	

	//Dialog box to display progress
	$("#progressBox")
	.css( 
	{
	   "background":"rgba(255,255,255,0.5)"
	})
	.dialog({ autoOpen: false, 
		width:boxWidth,
		show: { effect: 'fade', duration: 500 },
		hide: { effect: 'fade', duration: 500 } 
	});
		
	
	//Button and box for selecting the object to render
	$("#objectButton")
    .button()
	.click( 
		function() 
		{ 
			$("#objectBox").dialog("open");
		});	
	$("#objectBox")
	.css( 
	{
	   "background":"rgba(255,255,255,0.5)"
	})
	.dialog({ autoOpen: false, 
		width:325,
		show: { effect: 'fade', duration: 500 },
		hide: { effect: 'fade', duration: 500 } 
	});
		
		
	//Button and box for settings
	$("#settingsButton")
    .button()
	.click( 
		function() 
		{ 
			$("#settingsBox").dialog("open");
		});	
	$("#settingsBox")
	.css( 
	{
	   "background":"rgba(255,255,255,0.5)"
	})
	.dialog({ autoOpen: false, 
		width:325,
		show: { effect: 'fade', duration: 500 },
		hide: { effect: 'fade', duration: 500 },
		buttons: {
        Ok: function() {
          $( this ).dialog( "close" );
        }
      }
	});
	$( "#spinner" ).spinner({
      min: 0,
      max: 255,
    });
		
		
	$("#renderButton")
    .button()
	.click( 
		function() 
		{ 
			$("#objectBox").dialog("open");
		});	
		
		
		
	$("#uploadBox")
	.css( 
	{
	   "background":"rgba(255,255,255,0.5)"
	})
	.dialog({ autoOpen: false, 
		show: { effect: 'fade', duration: 500 },
		hide: { effect: 'fade', duration: 500 } 
	});
	
	 $("#uploadButton")
       .text("") // sets text to empty
	.css(
	{ "z-index":"2",
	  "background":"rgba(0,0,0,0)", "opacity":"0.9", 
	  "position":"absolute", "top":"4px", "right":"4px"
	}) // adds CSS
    .append("<img width='32' height='32' src='images/icon-info.png'/>")
    .button()
	.click( 
		function() 
		{ 
			$("#uploadBox").dialog("open");
		});
		
	//Make input text look like a button
	$('input:text')
	  .button()
	  .css({
			  'font' : 'inherit',
			 'color' : 'inherit',
		'text-align' : 'left',
		   'outline' : 'none',
			'cursor' : 'text'
	  });
	 
	 $('.ui-spinner').css({ 'float': 'right', 'width': '150px'});
});