#!/usr/bin/env node


"use strict";

/* eslint-disable no-console */
// Because we are in the cli

const fs = require("fs");
const JSZip = require("jszip");
const DocUtils = require("./doc-utils");
const Docxtemplater = require("./docxtemplater");
const fileExts = ["pptx", "docx", "xlsx"];

const jsonInput = {
    "config.inputFile":"testIn1.xlsx",
    "config.outputFile":"testOut1.xlsx",
    "config.debug":true,
    "first_name":"John",
    "last_name":"Smith",
    "age":62
};

var jsonParser = [
  {
    "type":"text",
    "start":"textboundry1",
    "end":"/textboundry1",
    "parameter":"paramname"
  },
  {
    "type":"text",
    "start":"textboundry2",
    "end":"/textboundry2",
    "parameter":"paramname2"
  }
];

DocUtils.config = {};

const currentPath = process.cwd() + "/";
DocUtils.pathConfig = {node: currentPath};

for (const key in jsonInput) {
	if (key.substr(0, 7) === "config.") {
		DocUtils.config[key.substr(7)] = jsonInput[key];
	}
}

const inputFileName = DocUtils.config.inputFile;
//const fileType = inputFileName.indexOf(".pptx") !== -1 ? "pptx" : "docx";
const fileType = "xlsx";
const jsonFileName = process.argv[2];
const outputFile = DocUtils.config.outputFile;
const debug = DocUtils.config.debug;
let debugBool = DocUtils.config.debugBool;

if (debug === "-d" || debug === "--debug") { debugBool = true; }
debugBool = true;
if (debugBool) {
	console.info(process.cwd());
	console.info(debug);
}
if (debugBool) {
	console.info("loading docx:" + inputFileName);
}
const content = fs.readFileSync(currentPath + inputFileName, "binary");
const zip = new JSZip(content);
const doc = new Docxtemplater().loadZip(zip);
doc.fileType = "xlsx";
doc.setOptions({fileType});
console.info("setting data");
doc.setData(jsonInput);
console.info("calling Render");

//doc.textRanges = jsonParser
//doc.parseContent();
//doc.includeTags=false;
doc.render();

var buf = doc.getZip().generate({type:"nodebuffer"});

//fs.writeFileSync(__dirname+"/"+DocUtils.config.outputFile,buf);


console.info("done");
