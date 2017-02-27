"use strict";

const DocUtils = require("./doc-utils");
const ScopeManager = require("./scope-manager");
const xmlMatcher = require("./xml-matcher");
const Errors = require("./errors");
const Lexer = require("./lexer");
const Parser = require("./parser.js");
const render = require("./render.js");

function getFullText(content, tagsXmlArray) {
	const matcher = xmlMatcher(content, tagsXmlArray);
	const result = matcher.matches.map(function (match) {
		return match.array[2];
	});
	return DocUtils.wordToUtf8(DocUtils.convertSpaces(result.join("")));
}

module.exports = class XmlTemplater {
	constructor(content, options) {
		this.fromJson(options);
		this.setModules({inspect: {filePath: this.filePath}});
		this.load(content);
	}
	load(content) {
		if (typeof content !== "string") {
			const err = new Errors.XTInternalError("Content must be a string");
			err.properties.id = "xmltemplater_content_must_be_string";
			throw err;
		}
		this.content = content;
	}
	fromJson(options) {
		this.tags = (options.tags != null) ? options.tags : {};
		this.filePath = options.filePath;
		this.modules = options.modules;
		this.includeTags = options.includeTags;
		this.fileTypeConfig = options.fileTypeConfig;
		this.scopeManager = ScopeManager.createBaseScopeManager({tags: this.tags, parser: this.parser});
		Object.keys(DocUtils.defaults).map(function (key) {
			const defaultValue = DocUtils.defaults[key];
			this[key] = options[key] != null ? options[key] : defaultValue;
		}, this);
	}
	getFullText() {
		return getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
	}
	setModules(obj) {
		this.modules.forEach((module) => {
			if (module.set) {
				module.set(obj);
			}
		});
	}
	/*
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content
	*/
	parseContent() {
		console.info("    In the main xml parsing");
		this.xmllexed = Lexer.xmlparse(this.content, {text: this.fileTypeConfig.tagsXmlTextArray, other: this.fileTypeConfig.tagsXmlLexedArray});
		console.info("        done xmllexed");

		//handle the comments file as a special case
		/*
		if(this.filePath.indexOf("comments.xml")>-1)
		{
			var commentContent = {"inTextTag":false,"inComment":false,"comments":[], "tempText":""};
			this.commentContent = this.xmllexed.reduce(function(commentContent, el) {
				if(el.value.substr(0,5)=="<?xml") return commentContent;
				if(el.value.indexOf("<w:comment ")>-1)
				{
					var commentId = el.value.substr(el.value.indexOf("<w:comment "));
					commentId = commentId.substr(commentId.indexOf("w:id="));
					commentId=commentId.replace("w:id=\"","");
					commentId = commentId.substring(0,commentId.indexOf("\""));
					commentContent.tempId=commentId;
					commentContent.inComment=true;
					commentContent.tempText="";
					return commentContent;
				}
				if(el.value.indexOf("</w:comment>")>-1)
				{
					commentContent.comments[commentContent.tempId]={"value":commentContent.tempText};
					commentContent.inComment=false;
					commentContent.tempText="";
					return commentContent;
				}
				if((el.value.substring(0,4)==="<w:t") || (el.value==="</w:t>"))
				{
					(el.value.substring(0,4)==="<w:t") ? commentContent.inTextTag=true : commentContent.inTextTag=false;
					return commentContent;
				}
				if((commentContent.inTextTag) && (el.type==="content"))
				{
					commentContent.tempText+=el.value;
				}
				return commentContent;
			},commentContent);
			return this;
		}
   */
    //handle normal content files
		//var textContent = {"inTextTag":false,"inTextRange":false,"value":"", "textRanges":this.textRanges};
		var textContent = {"inTextTag":false,"value":""};
    this.textContent = this.xmllexed.reduce(function(textContent, el) {
			/*
        if(el.value.indexOf("<w:commentRangeStart")>-1)
				{
						var commentId = el.value.replace("<w:commentRangeStart w:id=\"","").replace("\"\/>","");
						textContent.commentRanges[commentId]={"tag":el.value,
																					"id":commentId,
																					"comment":"",
																				  "inComment":true};
            textContent.inComment=true;
						return textContent;
				}
				if(el.value.indexOf("<w:commentRangeEnd")>-1)
				{
						var commentId = el.value.replace("<w:commentRangeEnd w:id=\"","").replace("\"\/>","");
						var lc = textContent.commentRanges[commentId];
						if(lc)
						{
							lc.inComment=false;
							textContent.inComment = textContent.commentRanges.reduce(function(prevValue,cr){
								if(prevValue) return true;
								return cr.inComment;
							},false);
						}
						else
						{
							//error, closing a content we didn't have openned
							console.info("bad state...found a close comment we did not have");
						}
						return textContent;
				}
		 */
				if((el.value.substring(0,4)==="<w:t") || (el.value==="</w:t>"))
				{
					(el.value.substring(0,4)==="<w:t") ? textContent.inTextTag=true : textContent.inTextTag=false;
					return textContent;
				}
				if((textContent.inTextTag) && (el.type==="content"))
				{
					textContent.value+=el.value;
				}
					/*
					textContent.commentRanges.reduce(function(inText, cr){
						if (cr.inComment)
						{
								cr.comment += inText;
						}
						return inText;
					},el.value);
				}
				*/
				return textContent;
		},textContent);

    //now, this.textRanges are the ranges we're looking for.  for each we should find the text....
		this.textRanges.forEach(function(r){
			if ((textContent.value.indexOf(r.start)>-1) && (textContent.value.indexOf(r.end) >-1))
			{
				r["value"] = textContent.value.substring((textContent.value.indexOf(r.start)+r.start.length),(textContent.value.indexOf(r.end)));
			}
			else {
				r["value"] = "boundary tags not found";
			}
		});

    console.info(textContent.value);
		return this;
	}
	/*
	content is the whole content to be tagged
	scope is the current scope
	returns the new content of the tagged content
	*/
	render() {
		this.xmllexed = Lexer.xmlparse(this.content, {text: this.fileTypeConfig.tagsXmlTextArray, other: this.fileTypeConfig.tagsXmlLexedArray});
		this.setModules({inspect: {xmllexed: this.xmllexed}});
		this.lexed = Lexer.parse(this.xmllexed, this.delimiters);
		this.setModules({inspect: {lexed: this.lexed}});
		this.parsed = Parser.parse(this.lexed, this.modules);
		this.setModules({inspect: {parsed: this.parsed}});
		this.postparsed = Parser.postparse(this.parsed, this.modules);
		this.setModules({inspect: {postparsed: this.postparsed}});
		//this.commentRanges = [];
		this.content = render({
			compiled: this.postparsed,
			includeTags: this.includeTags,
			commentRanges: this.commentRanges,
			tags: this.tags,
			modules: this.modules,
			parser: this.parser,
			nullGetter: this.nullGetter,
			filePath: this.filePath,
		});
		this.setModules({inspect: {content: this.content}});
		return this;
	}
};
