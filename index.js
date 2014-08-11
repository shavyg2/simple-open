#!/usr/bin/env node

var program = require("commander");
var platform = require("simple-platform");
var path = require("path");
var printf = require("printf");
var mkdirp = require("mkdirp");

var child_p = require("child_process");

var fs = require("fs");

 
program.version("1.0.0")
    .option("-n,--name [value]", "Name of Application")
    .option("-p,--path [value]", "Path of Application")
    .option("-a, --apps")
    .option("--settings","Display Settings")
    .parse(process.argv);


function getConfig() {
    var HomeFolder = "OpenApp";
    var config = {
        home: "",
        file: "configuration.json",
        alias:"alias.json"
    }

    for (var key in config) {
        var value = config[key]
        config[key] = path.join(HomeFolder, value);
    }

    for (var key in config) {
        var value = config[key]
        config[key] = path.join(platform.home, value);
    }
    return config;
}

function createSettings(){
    var config = getConfig();
    mkdirp(config.home);
    if (!fs.existsSync(config.file)) {
        if (program.settings) {
            console.log("Creating configuration file");
        }
        fs.writeFileSync(config.file, JSON.stringify(config, null, 2));
    } else {

        var configUser = require(config.file);
        if (program.settings) {
            console.log("Configuration File exist");
        }

        for (var key in configUser) {
            config[key] = configUser[key];
        }
    }

    if (!fs.existsSync(config.alias)) {
        fs.writeFileSync(config.alias, JSON.stringify({}), { encoding: "utf8" });
    }
    return config;
}


function validPath(app) {
    var stat=fs.statSync(app);
    return stat && stat.isFile();
}

function add(name, app) {
    console.log(name, path.resolve(app));
    if (validPath(app)) {
        applications[name] = path.resolve(app);
    } else {
        console.log("This isn't a valid program");
    }
}



///////////Application

var settings = createSettings();

console.log(settings.alias);
var applications = require(settings.alias);

if (program.name && program.path) {
    add(program.name,program.path);
} else if (program.apps) {
    for (var name in applications) {
        console.log(printf("Application Alias: %s\nApplication path: %s\n", name, applications[name]));
    }
} else {
    if (program.args.length > 0) {
        var alias = program.args.shift();
        var app_name = applications[alias];

        var task = child_p.spawn(app_name, program.args);
        task.stdout.on("data", function (data) {
            console.log(data);
        });

        task.on("close", function () {
            console.log(printf("%s has been closed", alias));
        });
    }
}




if (program.settings) {
    var config = getConfig();
    console.log(printf("Home Directory: %s", config.home));
    console.log(printf("Configuration File: %s", config.file));
    console.log(printf("Program Alias: %s", config.alias));
}



fs.writeFileSync(settings.alias, JSON.stringify(applications), { encoding: "utf8" });