



```
let getRealValue = function(number) {
	const addLeadingZero = function(str) {
		const difference = 32 - str.length;
		return difference > 0 ?
			"0".repeat(difference).concat(str) :
			str;
	};
	const getSign = function() {
		return Number(binary.substr(0, 1));
	};
	const getFrac = function() {
		return binary.substr(12);
	};
	const getExp = function() {
		return binary.substr(1, 11);
	};
	const sumFrac = function(binary) {
		return binary.split("").reduce((pre, cur, index) => {
			return pre + Math.pow(0.5, index + 1) * Number(cur);
		}, 0);
	};
	const sumExp = function(binary) {
		return binary.split("").reverse().reduce((pre, cur, index) => {
			return pre + Math.pow(2, index) * Number(cur);
		}, 0);
	};
	const getE = function() {
		if (normalized) {
			return  sumExp(exp) - bias;
		} else {
			return  1 - bias;
		}
	};
	const getM = function() {
		//console.log(sumFrac(frac))
		if (normalized) {
			return 1 + sumFrac(frac);
		} else {
			return sumFrac(frac);
		}
	};
	let normalized = false;
	const bias = 1023;
	const array = new Float64Array([number]);
	const view = new DataView(array.buffer);
	let part1 = view.getUint32(4, true).toString(2);
	let part2 = view.getUint32(0, true).toString(2);
	part1 = addLeadingZero(part1);
	part2 = addLeadingZero(part2);
	const binary = part1.concat(part2);
	const sign = getSign();
	const exp = getExp();
	const frac = getFrac();
	if (parseInt(exp, 2) !== 1 && parseInt(exp, 2) !== 0b11111111111) {
		console.log("规格化");
		normalized = true;
	} else if (parseInt(exp, 2) === 0) {
		console.log("非规格化");
		normalized = false;
	} else if (parseInt(exp, 2) === 0b11111111111 && parseInt(frac, 2) === 0) {
		return sign > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	} else {
		return NaN;
	}
	const realValue = Math.pow(-1, sign) * getM() * Math.pow(2, getE());
	console.log(`符号${sign}, 阶码${exp}, 尾数${frac}`);
	return Number(realValue);
};
```
