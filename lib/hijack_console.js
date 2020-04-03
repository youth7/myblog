const functions = Object.keys(console).reduce((result, fn) => {
    if (typeof console[fn] === "function") {
        result[fn] = console[fn].bind(console);
    }
    return result;
}, {});

function getFormatDate() {
    const date = new Date();
    const yyyymmdd = date.toISOString().substring(0, 10);
    const timeString = date.toTimeString().substring(0, 8);
    return `${yyyymmdd} ${timeString}`;
}

["log", "warn", "error"].forEach(fn => {
    console[fn] = function () {
        const date = getFormatDate();
        functions[fn](date, ...arguments);
    };
});


// (function test(){
//     const date = new Date();
//     //Array.prototype.unshift.call(arguments, date)
//     console.log(date, ...arguments)
// }())