(function(app) {
	
	/**
	 * Return given number of days in milliseconds
	 */
	function daysInMilliseconds(days) {
		return days * 1000*60*60*24;
	}
	app.daysInMilliseconds = daysInMilliseconds;

	/**
	 * Get given dates date at 00:00:00 o'clock. If no 
	 * date given use today's date.
	 */
	function dateToday(dateval) {
		var date;
		if (dateval) date = new Date(dateval);
		else date = new Date();

		date.setMilliseconds(0);
		date.setSeconds(0);
		date.setMinutes(0);
		date.setHours(0);
		return date;
	}
	app.dateToday = dateToday;
	
	/**
	 * Tomorrow at 00:00:00 o'clock.
	 */
	function dateTomorrow() {
		return dateToday(new Date() + daysInMilliseconds(1));
	}
	app.dateTomorrow = dateTomorrow;
	
})(window.TodAi);