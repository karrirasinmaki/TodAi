(function(ai) {
	
	function Todo() {
		this._id = undefined;
		
		this.likelyToPostpone = 1;
		this.weekday = (new Date()).getDay();
		this.offeredHours = 0;
		
		this.todoId = null;
	}
		
	Todo.Weekday = {
		SUN: 0,
		MON: 1,
		TUE: 2,
		WED: 3,
		THU: 4,
		FRI: 5,
		SAT: 6
	};
	
	ai.Todo = Todo;
	
})(window.TodAi.Ai);
