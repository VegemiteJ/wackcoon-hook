var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var exec = require('child_process').exec;
// Node cron backup schedule
var cron = require('node-cron');
// Read config
var config = require('config');

// Timing

function getDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    if (month.toString().length == 1) {
        month = '0' + month;
    }
    if (day.toString().length == 1) {
        day = '0' + day;
    }
    if (hour.toString().length == 1) {
        hour = '0' + hour;
    }
    if (minute.toString().length == 1) {
        minute = '0' + minute;
    }
    if (second.toString().length == 1) {
        second = '0' + second;
    }
    var dateTime = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
    return dateTime;
}

// Logging from console commands
function execCallback(err, stdout, stderr) {
    if (stdout) {
        console.log(stdout);
    }
    if (stderr) {
        console.log(stderr);
    }
}

// Logic to update repo
function updateRepo(projectPath)
{
    console.log(`[${getDateTime()}] Pulling code from GitHub...`);
    // reset any changes that have been made locally
    exec('git -C ' + projectPath + ' reset --hard', execCallback);

    // and ditch any files that have been added locally too
    exec('git -C ' + projectPath + ' clean -xdf', execCallback);

    // ensure on master branch
    exec('git -C ' + projectPath + ' checkout master', execCallback);

    // now pull down the latest
    exec('git -C ' + projectPath + ' pull -f', execCallback);
    console.log(`[${getDateTime()}] Request complete`);
}


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.htm')
    console.log(`[${getDateTime()}] get / (root)`)
});

app.get('/payload', function (req, res) {
    res.sendStatus(200);
    console.log(`[${getDateTime()}] get / (payload)`)
});

// Handle webhook request
app.post('/payload', function (req, res) {
    console.log(`[${getDateTime()}] New Push from: ${req.body.pusher.name} to ${req.body.repository.full_name}`);
    // Read local config file with project name and path
    //  Read on every call so the server doesn't need to restart on config updates
    const projectName = config.get('projectName');
    const projectPath = config.get('projectPath');
    console.log(`[${getDateTime()}] Hook updating ${projectName} at path ${projectPath}`);
    // Verify this is an update for the right repo
    if (req.body.repository.full_name !== projectName) {
        console.log(`[${getDateTime()}] Rejecting request - repository name does not match config`)
        res.sendStatus(400);
        return;
    };

    updateRepo(projectPath);
    res.sendStatus(200);
});

// Start on default path + port
var port = config.get('port');
app.listen(port, '0.0.0.0', () => {
    console.log(`[${getDateTime()}] Started on port: ${port}`)
});

// Setup node cron backup schedule
var cronJob = cron.schedule("*/5 * * * *", function(){
    const projectName = config.get('projectName');
    const projectPath = config.get('projectPath');
    console.log(`[${getDateTime()}] Cron updating ${projectName} at path ${projectPath}`);
    updateRepo(projectPath);
});
cronJob.start();
