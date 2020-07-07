var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var exec = require('child_process').exec;
// Read config
var config = require('config');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.htm');
    console.log('get /');
});

app.get('/payload', function (req, res) {
    res.sendStatus(200);
    console.log('get /payload');
});

// Handle webhook request
app.post('/payload', function (req, res) {
    //verify that the payload is a push from the correct repo
    //verify repository.name == 'wackcoon-device' or repository.full_name = 'DanielEgan/wackcoon-device'
    console.log(req.body.pusher.name + ' just pushed to ' + req.body.repository.full_name);

    // Read local config file with project name and path
    const projectName = config.get('projectName');
    const projectPath = config.get('projectPath');
    console.log('Read name and path... Name:' + projectName + ', Path:' + projectPath)
    if (req.body.repository.name !== projectName) {
        console.log('Rejecting request - repository name does not match config')
        res.sendStatus(404);
        return;
    };

    console.log('Pulling code from GitHub...');
    // reset any changes that have been made locally
    //exec('git -C ' + projectPath + ' reset --hard', execCallback);

    // and ditch any files that have been added locally too
    //exec('git -C ' + projectPath + ' clean -xdf', execCallback);

    // now pull down the latest
    //exec('git -C ' + projectPath + ' pull -f', execCallback);
});

app.listen(5000, function () {
    console.log('listening on port 5000')
});

function execCallback(err, stdout, stderr) {
    if(stdout) console.log(stdout);
    if(stderr) console.log(stderr);
}