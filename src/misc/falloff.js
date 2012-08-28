function getFalloff(data, value) {
	// Lower limit (assuming the list is sorted)
	if(value <= data[0][0]) {
	   return data[0][1];   
	}
	
	// Upper limit (assuming the list is sorted)
	if(value >= data[data.length - 1][0]) {
	   return data[data.length - 1][1];   
	}
	
	var i;
	for(i = 0; i < data.length; i++) {
		if(data[i][0] === value) {
		   return data[i][1]; 
		}
		
		if(data[i][0] > value) {
		   break;   
		}
	}
  
	var before = data[i - 1];
	var after = data[i];

	var between = (after[0] - value) / (after[0] - before[0]);
	
	// Limit range from 0 to 1
	between = Math.max(0, Math.min(between, 1));

	return (before[1] * between) + (after[1] * (1 - between));
}