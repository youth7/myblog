"use strict";
//这个已经不再使用，用原生的util.promisefy代替
const promisefy = function(fn) {
	return function() {
		return new Promise((resolve, reject) => {
			fn(...arguments, function(e, ...args) {
				if (e) {
					reject(e);
				} else {
					resolve(args);
				}
			});
		});
	};
};
module.exports = promisefy;