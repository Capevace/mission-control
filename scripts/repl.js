// const cliProgress = require('cli-progress');

// // create new progress bar
// const b1 = new cliProgress.SingleBar({
//     format: 'CLI Progress |{bar}| {percentage}% || {value}/{total} Chunks || Speed: {speed}',
//     barCompleteChar: '\u2588',
//     barIncompleteChar: '\u2591',
//     hideCursor: true
// });

// // initialize the bar - defining payload token "speed" with the default value "N/A"
// b1.start(200, 0, {
//     speed: "N/A"
// });

// // update values
// b1.increment();
// b1.update(20);

// // stop the bar
// b1.stop();

var log = require('npmlog')

// additional stuff ---------------------------+
// message ----------+                         |
// prefix ----+      |                         |
// level -+   |      |                         |
//        v   v      v                         v
    log.info('fyi', 'I have a kitty cat: %j', {ass:true});
    log.enableProgress()

    setTimeout(() => {}, 20000);