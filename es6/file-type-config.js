"use strict";

const loopModule = require("./modules/loop");
const spacePreserveModule = require("./modules/space-preserve");
const RawXmlModule = require("./modules/rawxml");
const expandPairTrait = require("./modules/expand-pair-trait");

const PptXFileTypeConfig = {
	getTemplatedFiles(zip) {
		const slideTemplates = zip.file(/ppt\/(slides|slideMasters)\/(slide|slideMaster)\d+\.xml/).map(function (file) { return file.name; });
		return slideTemplates.concat(["ppt/presentation.xml"]);
	},
	textPath: "ppt/slides/slide1.xml",
	tagsXmlTextArray: ["a:t", "m:t"],
	tagsXmlLexedArray: ["p:sp", "a:tc", "a:tr", "a:table", "a:p", "a:r"],
	tagRawXml: "p:sp",
	tagTextXml: "a:t",
	baseModules: [() => expandPairTrait, () => new RawXmlModule(), () => loopModule],
};

const DocXFileTypeConfig = {
	getTemplatedFiles(zip) {
		var slideTemplates = zip.file(/word\/(header|footer)\d+\.xml/).map(function (file) { return file.name; });
		//slideTemplates = slideTemplates.concat(zip.file(/word\/comments\.xml/).map(function (file) { return file.name; }));
		return slideTemplates.concat(["word/document.xml"]);
	},
	textPath: "word/document.xml",
	tagsXmlTextArray: ["w:t", "m:t"],
	tagsXmlLexedArray: ["w:tc", "w:tr", "w:table", "w:p", "w:r"],
	tagRawXml: "w:p",
	tagTextXml: "w:t",
	baseModules: [() => spacePreserveModule, () => expandPairTrait, () => new RawXmlModule(), () => loopModule],
};
//, "w:comment"

const XlsXFileTypeConfig = {
	getTemplatedFiles(zip) {
		var slideTemplates = zip.file(/xl\/worksheets\/sheet\d+\.xml/).map(function (file) { return file.name; });
		//slideTemplates = slideTemplates.concat(zip.file(/word\/comments\.xml/).map(function (file) { return file.name; }));
		return slideTemplates.concat(["xl/sharedStrings.xml"]);
		return slideTemplates;
	},
	textPath: "xl/sharedStrings.xml",
	tagsXmlTextArray: ["v","t"],
	tagsXmlLexedArray: ["c","si"],
	tagRawXml: "w:p",
	tagTextXml: "w:t",
	baseModules: [() => spacePreserveModule, () => expandPairTrait, () => new RawXmlModule(), () => loopModule],
};



//'<w:p w14:paraId="20E7BB22" w14:textId="5584C8FD" w:rsidR="00BC20FF" w:rsidRDefault="00BC20FF">' +
const DocXCommentsFileConfig = {
	textPath: "word/comments.xml",
	preamble: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex" xmlns:cx1="http://schemas.microsoft.com/office/drawing/2015/9/8/chartex" xmlns:cx2="http://schemas.microsoft.com/office/drawing/2015/10/21/chartex" xmlns:cx3="http://schemas.microsoft.com/office/drawing/2016/5/9/chartex" xmlns:cx4="http://schemas.microsoft.com/office/drawing/2016/5/10/chartex" xmlns:cx5="http://schemas.microsoft.com/office/drawing/2016/5/11/chartex" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml" xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 w15 w16se wp14">',
	startComment: '<w:comment w:id="5" w:author="Author" w:initials="A">' +
									'<w:p w14:paraId="24BE470A" w14:textId="77777777" w:rsidR="00E33166" w:rsidRDefault="00E33166">' +
										'<w:pPr>' +
											'<w:pStyle w:val="CommentText"/>' +
										'</w:pPr>' +
										'<w:r>' +
											'<w:rPr>' +
												'<w:rStyle w:val="CommentReference"/>' +
											'</w:rPr>' +
											'<w:annotationRef/>' +
										'</w:r>' +
										'<w:r>' +
											'<w:t>',
	endComment: 			'</w:t>' +
										'</w:r>' +
									'</w:p>' +
								'</w:comment>',
	suffix: '</w:comments>'
};


module.exports = {
	docx: DocXFileTypeConfig,
	pptx: PptXFileTypeConfig,
	commentFile: DocXCommentsFileConfig,
	xlsx: XlsXFileTypeConfig
};
