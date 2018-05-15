$(document).ready(function() {
    // all custom jQuery will go here
    var client = new Messaging.Client("broker.hivemq.com", 8000, "myclientid_" + parseInt(Math.random() * 100, 10));
    var sub1 = new Messaging.Client("broker.hivemq.com", 8000, "myclientid_" + parseInt(Math.random() * 100, 10));
    var sub2 = new Messaging.Client("broker.hivemq.com", 8000, "myclientid_" + parseInt(Math.random() * 100, 10));
    var sub3 = new Messaging.Client("broker.hivemq.com", 8000, "myclientid_" + parseInt(Math.random() * 100, 10));
    var serverConnectUrl = "http://localhost:3000/bookings";
    var available = 0;
    var parkingSpace = {1: 1, 2: 1, 3: 0};
    var isParkingAvailable = {1: 0, 2:0, 3:0};
	//Create a new Client object with your broker's hostname, port and your own clientId 
	var options = {
	     //connection attempt timeout in seconds
	     timeout: 3,
	     //Gets Called if the connection has successfully been established
	     onSuccess: function () {
	         console.log("Connected");
	     },
	     //Gets Called if the connection could not be established
	     onFailure: function (message) {
	         alert("Connection failed: " + message.errorMessage);
	     }
	 };
	
	//Attempt to connect
	connectSubs();
	
	// Subscribe to HiveMQ every 5 sec
	setTimeout( subscribeMqtt, 5000 );

    function update(){
    	$.getJSON(serverConnectUrl, function(data) {
    		console.log(data);
		    //data is the JSON string
			var obj = JSON.parse(JSON.stringify(data));
			//clear data
			$("#current_bookings").html("");
			$("#booked").html("");
			$("#waiting").html("");

			obj.forEach(function(element) {
				if (element.status == 1){ // booked
					// update UI
					var innerhtml = $("#current_bookings").html();
					$("#current_bookings").html(innerhtml +  "<l1>" + element.user +  "</li> <br> ");
					if(parkingSpace[element.node] == 0 && isParkingAvailable[element.node] == 1) {
						console.log("NODE: " + element.node);
					}
				} 
				else if (element.status == 2) {
					var innerhtml = $("#booked").html();
					$("#booked").html(innerhtml +  "<l1>" + element.user +  "</li> <br> ");
				}
				else { // waiting
					
					// update UI
					var innerhtml = $("#waiting").html();
					$("#waiting").html(innerhtml + "<l1>" + element.user +  "</li><br>");

				  	if (available == 0){
				  		console.log ("still waiting, can't find");
				  	}else {
				  		console.log("Preparing to process booking request....")
				  		var message = '{"status":1}';
				  		for (var key in parkingSpace){
				  			if (parkingSpace[key] == 1){
				  				console.log("Publishing daa to node....");
				  				publish( message, "park_node3/status", 2);	
				  				processRequest(element, key);
				  				break;	
				  			}	
				  		}
				  		
				  		//setTimeout( processRequest(element), 5000 );	
				  	}
				}
			  
			});
		});

		repeat();
    }
    
    function seeAvailable () { // update available UI
    	$("#available").html("");
    	$("#available").html("<l1>" + available + "</li><br>");
    }

    function connectSubs(){
    	client.connect(options);
    	sub1.connect(options);
    	sub2.connect(options);
    	sub3.connect(options);
    	$("#booked").html("Loading...");
		$("#waiting").html("Loading...");
		$("#current_bookings").html("Loading...");
    }

    function subscribeMqtt(){
    	sub1.subscribe("park_node1/sensor", {qos: 2});
    	sub2.subscribe("park_node2/sensor", {qos: 2});
    	sub3.subscribe("park_node3/sensor", {qos: 2});
    	// Start Updating DB and interface server side
		repeat();
    }

     //Creates a new Messaging.Message Object and sends it to the HiveMQ MQTT Broker
	function publish(payload, topic, qos) {
	     //Send your message (also possible to serialize it as JSON or protobuf or just use a string, no limitations)
	     var message = new Messaging.Message(payload);
	     message.destinationName = topic;
	     message.qos = qos;
	     client.send(message);
	}

	sub1.onMessageArrived = function (message) {
	     console.log (message.payloadString);
	     var message = JSON.parse(message.payloadString);
	     console.log(message.availability);
	     if (message.availability == 0){
     		console.log("Node 1 --------------------------- NOT available");
	     	parkingSpace[1] = 0;
	     	if(isParkingAvailable[1] == 1)
	     	{
	     		available--;
     			isParkingAvailable[1] = 0;
	     	}
	     	
		    //processRequest(userid);
	     }else {
     		console.log("Node 1 --------------------------- available");
     		parkingSpace[1] = 1;

     		if(isParkingAvailable[1] == 0){
     			available++;
     			isParkingAvailable[1] = 1;
     		}
	     }
	};
	sub2.onMessageArrived = function (message) {
	     console.log (message.payloadString);
	     var message = JSON.parse(message.payloadString);
	     console.log(message.availability);
	     if (message.availability == 0){
     		console.log("Node 2 --------------------------- NOT available");
	     	parkingSpace[2] = 0;
	     	if(isParkingAvailable[2] == 1)
	     	{
	     		available--;
     			isParkingAvailable[2] = 0;
	     	}
	     	//processRequest(userid);
	     }else {
     		console.log("Node 2 --------------------------- available");
     		parkingSpace[2] = 1;

     		if(isParkingAvailable[2] == 0){
     			available++;
     			isParkingAvailable[2] = 1;
     		}
	     }
	};
	sub3.onMessageArrived = function (message) {
	     console.log (message.payloadString);
	     var message = JSON.parse(message.payloadString);
	     console.log(message.availability);
	     if (message.availability == 0){
     		console.log("Node 3 --------------------------- NOT available");
	     	parkingSpace[3] = 0;
	     	if(isParkingAvailable[3] == 1)
	     	{
	     		available--;
     			isParkingAvailable[3] = 0;
	     	}
	     	//processRequest(userid);
	     }else {
     		console.log("Node 3 --------------------------- available");
     		parkingSpace[3] = 1;

     		if(isParkingAvailable[3] == 0){
     			available++;
     			isParkingAvailable[3] = 1;
     		}
	     }
	};

	function repeat(){
    	setTimeout( update, 5000 );	
    	setTimeout( seeAvailable, 5000 );	
    }

	function processRequest (element, key){
		console.log("Process request to database......");
		console.log("Available ------------- " + available);
		
		if (available > 0){
			$.ajax({
		        url: 'http://localhost:3000/bookings/' + element.id,   
		        type: 'PUT',   //type is any HTTP method
		        data: {
		        	"id" : element.id,
		          	"user": element.user,
			      	"start_date": element.start_date,
			        "start_time": element.start_time,
			        "end_date": element.end_date,
			        "end_time": element.end_time,
			        "place": element.place,
			        "status": 1,
			        "cancel": 2,
			        "total_cost": element.total_cost,
			        "total_hours": element.total_hours,
			        "node": key
			    },      //Data as js object
		        success: function () {
		        	console.log ("successfully updated database");
		        	//setTimeout(sendArrivedToNode(), 10000);
		        }
		    });
		}
	}

	function sendArrivedToNode() {
		var message = '{"status":3}';

		for (var key in parkingSpace){
  			if (parkingSpace[key] == 0){
  				console.log("Publishing daa to node....");
  				publish( message, "park_node"+ key + "/status", 2);	
  				break;	
  			}	
  		}
	}

	function endBooking() {

	}
});