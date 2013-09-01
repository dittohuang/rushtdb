// ==UserScript==
//
// @name			My First Script
// @namespace		http://MyFirstScript/
// @description		我的第一个测试脚本
// @include			https://dynamic.12306.cn/otsweb/*
// @include			https://www.12306.cn/otsweb/*
// @require			http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
//
// ==/UserScript==



$(document).ready(function(){
	//Login Page
	if ($("#UserName").length > 10) {		
		$("#randCode").focus();
		$("#randCode").keyup(function (e) {
			e = e || event;
			if (e.charCode == 13 || $("#randCode").val().length == 4) getLoginRandCode();
		});

		function getLoginRandCode() {
			$.ajax({
				url: "/otsweb/loginAction.do?method=loginAysnSuggest",
				method: "POST",
				dataType: "json",
				cache: false,
				success: function (json, code, jqXhr) {
						$("#loginRand").val(json.loginRand);
						relogin();
				},
				error: function (msg) {
					alert(msg);
				}
			});
		}
		
		function relogin() {
			var data = {};
			$.each($("#loginForm").serializeArray(), function () {
				if (this.name == "refundFlag" && !document.getElementById("refundFlag").checked) return;
				data[this.name] = this.value;
			});
			if (!data["loginUser.user_name"] || !data["user.password"])// || !data.randCode || data.randCode.length != 4)
				return;
				
			$.ajax({
				type: "POST",
				url: "/otsweb/loginAction.do?method=login",
				data: data,
				timeout: 10000,
				dataType: "text",
				success: function (html) {
						window.location.href = "/otsweb/order/querySingleAction.do?method=init";
				},
				error: function (msg) {
					alert(msg);
				}
			});
		}

	}
	
	//Query Page
	var train_date;
	var queryTimer;
	var queryCount;
	var queryCountError;

 	if ($("#singleRadio").length > 0) {
		$(".in_fromr").append("<button id=\"myQuery\" type=\"button\">自动查询</button>");
		queryPassenger();
		initSeat();
		$("#myQuery").click(function () {
			var totalPassenger = 0;
			var passenger;
			var seat;
			window.localStorage.clear();
			for (var i = 0; i <= document.getElementsByName('passengerInfo').length - 1; i++) {
				passenger = document.getElementsByName('passengerInfo')[i];
				//alert (passenger.attributes["pname"].nodeValue);
				if (passenger.checked) {
					//alert (passenger.attributes["value"].nodeValue);
					totalPassenger++;
					localStore("Passenger_pname_" + totalPassenger, passenger.attributes["pname"].nodeValue);
					localStore("Passenger_id_" + totalPassenger, passenger.attributes["value"].nodeValue);
				}
				if (totalPassenger >= 5) break;
			}
			if (totalPassenger == 0) {
				alert("请选择乘车人");
				return;
			}
			localStore("TotalPassenger", totalPassenger);
			
			localStore("Seat", "x");
			for (var i = 0; i <= document.getElementsByName('seatInfo').length - 1; i++) {
				seat = document.getElementsByName('seatInfo')[i];
				if (seat.checked) {
					localStore("Seat", seat.attributes["value"].nodeValue);
					break;
				}
			}
			if (localLoad("Seat") == "x") {
				alert("请选择席别");
				return;
			}
			
			queryCount = 0;
			queryCountError = 0;
			queryTimer = setInterval(queryTicket, "500");
		});
	}
	
	//Submit Page
	if ($("#passenger_1_mobileno").length > 0) {
		var totalPassenger = localLoad("TotalPassenger");
		
		for (var i = 1; i <= totalPassenger; i++) {
			var name = localLoad("Passenger_pname_" + i);
			var id = localLoad("Passenger_id_" + i);
			var seat = localLoad("Seat");
			var p = seat + ",0,1," + name + ",1," + id + ",,Y";
			
			$("#passenger_" + i).show();
			$("#passenger_" + i + "_name").val(name);
			$("#passenger_" + i + "_cardno").val(id);
			$("#passenger_" + i + "_p").removeAttr("disabled");
			$("#passenger_" + i + "_p").val(p);
			$("#passenger_" + i + "_seat").removeAttr("disabled");
			$("#passenger_" + i + "_seat").val(seat);
			$("#passenger_" + i + "_ticket").removeAttr("disabled");
			$("#passenger_" + i + "_ticket").val(1);
		}
		getRand();
		getRand();
		$("#rand").focus();
//		$(".table_qr").append("<br>");
		//$(".table_qr").append("<p id=\"myleftticket\">剩余票数：未知</p>");
//		$(".tj_btn").append("<button id=\"myleftticket\" type=\"button\">剩余票数:</button>");
//		$("#myleftticket").click(function () {
//			queryTicketBeforeSumbit();
//		});
		//queryTicketTimer = setInterval(queryTicketBeforeSumbit, "500");
	}
	
	function getRand() {
			var queryData = {
			};
			$.ajax({
				url: "/otsweb/passCodeAction.do?rand=randp&0.4030487500884895",
				data: queryData,
				timeout: 10000,
				type: "GET",
				success: function (msg) {
					},
				error: function () {
				},
				dataType: "image/jpeg"
			});		
	}
	
 	function queryTicketBeforeSumbit() {
			var queryData = {
				'from': $('#from_station_telecode').val(),
				'seat': localLoad("Seat"),
				'station': $('#station_train_code').val(),
				'ticket': $('#left_ticket').val(),
				'to': $('#to_station_telecode').val(),
				'train_date': $('#start_date').val(),
				'train_no': $('#train_no').val()
			};
			$.ajax({
				url: "/otsweb/order/confirmPassengerAction.do?method=getQueueCount",
				data: queryData,
				timeout: 10000,
				type: "GET",
				success: function (msg) {
						if (!msg) return;
						var count = 0;
						count = msg.match(/.*ticket\":\"\d*\**\d*\**(\d*)\".*/)[1];
						$("#myleftticket").text("剩余票数：" + count);
					},
				error: function () {
				},
				dataType: "text"
			});
	}

	function queryTicket() {
		train_date = $('#startdatepicker').val();
		var queryLeftData = {
				'orderRequest.train_date': train_date,
				'orderRequest.from_station_telecode': $('#fromStation').val(),
				'orderRequest.to_station_telecode': $('#toStation').val(),
				'orderRequest.train_no': $('#trainCode').val(),
				'trainPassType': 'QB',
				'trainClass': 'QB#D#Z#T#K#QT#',
				'includeStudent': '00',
				'seatTypeAndNum': '',
				'orderRequest.start_time_str': '00:00--24:00'
			};
		$.ajax({
			url: "/otsweb/order/querySingleAction.do?method=queryLeftTicket",
			data: queryLeftData,
			timeout: 60000,
			type: "GET",
			success: function (msg) {
					var param;
					queryCount++;
					$("#myQuery").text("已查询" + queryCount + "次, Err:" + queryCountError);
					if (!msg) return;
					param = msg.match(/.*getSelected\(\'(\S*)\'\)\>/)[1];
					//alert(param);
					if (param) {
						clearTimeout(queryTimer);
						getSelected(param);
					}
				},
			error: function () {
					queryCount++;
					queryCountError++;
					$("#myQuery").text("已查询" + queryCount + "次, Err:" + queryCountError);
			},
			dataType: "text"
		});		
	}
	
	function getSelected(selectStr) {
		var selectStr_arr = selectStr.split("#");
		var station_train_code=selectStr_arr[0];
		var lishi=selectStr_arr[1];
		var starttime=selectStr_arr[2];
		var trainno=selectStr_arr[3];
		var from_station_telecode=selectStr_arr[4];
		var to_station_telecode=selectStr_arr[5];
		var arrive_time=selectStr_arr[6];
		var from_station_name=selectStr_arr[7];
		var to_station_name=selectStr_arr[8];
		var from_station_no=selectStr_arr[9];
		var to_station_no=selectStr_arr[10];
		var ypInfoDetail=selectStr_arr[11];
		var mmStr = selectStr_arr[12];
		var locationCode = selectStr_arr[13];
		//alert(from_station_name);
		submitRequest(station_train_code,lishi,starttime,trainno,from_station_telecode,to_station_telecode,arrive_time,from_station_name,to_station_name,from_station_no,to_station_no,ypInfoDetail,mmStr,locationCode);
	} 
	
	function submitRequest(station_train_code,lishi,starttime,trainno,from_station_telecode,to_station_telecode,arrive_time,from_station_name,to_station_name,from_station_no,to_station_no,ypInfoDetail,mmStr,locationCode) {
		$('#station_train_code').val(station_train_code);
		$('#lishi').val(lishi);
		$('#train_start_time').val(starttime);
		$('#trainno').val(trainno);
		$('#from_station_telecode').val(from_station_telecode);
		$('#to_station_telecode').val(to_station_telecode);
		$('#arrive_time').val(arrive_time);
		$('#from_station_name').val(from_station_name);
		$('#to_station_name').val(to_station_name);
		$('#from_station_no').val(from_station_no);
		$('#to_station_no').val(to_station_no);
		$('#ypInfoDetail').val(ypInfoDetail);
		$('#mmStr').val(mmStr);
		$('#locationCode').val(locationCode);

		$('#include_student').val('00');
		$('#single_round_type').val('1');
		$('#train_date').val(train_date);
		

		$('#orderForm').attr("action", "/otsweb/order/querySingleAction.do?method=submutOrderRequest");
		$('#orderForm').submit();
	}
	
	function queryPassenger() {
		$.ajax({
			type: "POST",
			url: "/otsweb/order/confirmPassengerAction.do?method=getpassengerJson",
			data: "",
			timeout: 10000,
			dataType: "text",
			success: function getresult(jsondata) {
				var passengers = eval ("(" + jsondata + ")");
				$(".cx_form").append("<br>");
				for (var i = 0; i < passengers.passengerJson.length; i++) {
					var p = $("<input class=\"passenger_info\" type=\"checkbox\" value=\"" + passengers.passengerJson[i].passenger_id_no + "\" name=\"passengerInfo\" pname=\""+ passengers.passengerJson[i].passenger_name +"\">" + passengers.passengerJson[i].passenger_name + "</input>");
					$(".cx_form").append(p);
				}
			},
			error: function (msg) {
				alert(msg);
			}
		});
	}
	
	function initSeat() {
		$(".cx_form").append("<br>");
		
		$(".cx_form").append("<input class=\"seat_info\" type=\"radio\" value=\"1\" name=\"seatInfo\">硬座</input>");
		$(".cx_form").append("<input class=\"seat_info\" type=\"radio\" value=\"3\" name=\"seatInfo\">硬卧</input>");
		$(".cx_form").append("<input class=\"seat_info\" type=\"radio\" value=\"4\" name=\"seatInfo\">软卧</input>");
		$(".cx_form").append("<input class=\"seat_info\" type=\"radio\" value=\"M\" name=\"seatInfo\">一等座</input>");
		$(".cx_form").append("<input class=\"seat_info\" type=\"radio\" value=\"0\" name=\"seatInfo\">二等座</input>");
	}
	
	function localStore(key, value) {
		window.localStorage.setItem(key, value);
	}

	function localLoad(key) {
		return window.localStorage.getItem(key);
	}

});
