"use strict";

const ScopeManager = require("./scope-manager");
const DocUtils = require("./doc-utils");
const ijfXumUtils = require("./ijfXumUtils");

function moduleRender(part, options) {
	let moduleRendered;
	for (let i = 0, l = options.modules.length; i < l; i++) {
		const module = options.modules[i];
		if (!module.render) {
			continue;
		}
		moduleRendered = module.render(part, options);
		if (moduleRendered) {
			return moduleRendered;
		}
	}
	return false;
}

function render(options) {

	//*****************local IJF Functions
	function ijfQueryData(inAction,inContext,inDebug)
		{
		   if(inDebug)
		   {
			  inContext["debug"]=[{"name":"Tom"},{"name":"Dick"},{"name":"Harry"}];
			  return;
		   }
		   //parse inAction
		   //{action:query, jql:"project=DJP", fields:"summary,duedate", path:"issues", snippet:""}
	  	      var tStr = "{" + inAction + "}";
 			  var action = JSON.parse(tStr);

			  var jql = action.jql;
			  var flds = action.fields;
			  var suffix = "";
			  if(flds) suffix = "&fields=" + flds;

			   var aUrl = '/rest/api/2/search?jql='+jql + suffix;
			   var rawList = ijfUtils.jiraApiSync('GET',aUrl, null);
			   var newVals=[];
               rawList.issues.forEach(function(i){
					var itemData={};
					Object.keys(ijf.jiraMeta.fields).forEach(function(k)
					{
						if(i.fields.hasOwnProperty(k))
						{
							var f = i.fields[k];
							var v = ijfUtils.handleJiraFieldType(ijf.jiraMeta.fields[k],f,true,true);
							itemData[ijf.jiraMeta.fields[k].name]=v;
						}
					});
 	 			    newVals.push(itemData);
			   });
			   inContext[action.path] = newVals;
		}

	function ijfLog(inMessage)
		{
			if(ijfUtils)
			{
				ijfUtils.footLog(inMessage);
			}
			else
			{
				console.info(inMessage);
			}

	}

	//*******************end local IJF Functions

	options.render = render;
	options.modules = options.modules;
	if (!options.scopeManager) {
		options.scopeManager = ScopeManager.createBaseScopeManager(options);
	}
	var compArr =  options.compiled.map(function (part) {
		const moduleRendered = moduleRender(part, options);
		if (moduleRendered) {
			return moduleRendered.value;
		}
		if (part.type === "placeholder") {
			let value = options.scopeManager.getValue(part.value);
			if (value == null) {
				value = options.nullGetter(part);
			}
			if(options.includeTags)
			{
				  //var cId = "5";
	              //options.commentRanges.push({"commentId":cId,"commentText": part.value});
  				  //return "Hello</w:t><w:commentRangeStart w:id=\""+cId+"\"/><w:t xml:space=\"preserve\">" + DocUtils.utf8ToWord(value) + "</w:t><w:commentRangeEnd w:id=\""+cId+"\"/><w:t xml:space=\"preserve\">World";
			      //return "{" + part.value + "}" + DocUtils.utf8ToWord(value.replace("\n","<w:br/>")) + "{/" + part.value + "}";
					return "{" + part.value + "}" + value.replace("\n","<w:br/>") + "{/" + part.value + "}";
			}
			else {
				//special handling for altering data model and extending data dynamically
				//syntax:
				//{action:query, jql:"", fields:"", path:"pathtojsonlocationtosave", snippet:"snippet that alters data optionally"}
				//console.info("About to process: " + part.value);
				var cleanWordChars = ijfUtils.replaceWordChars(part.value);
				if(cleanWordChars.indexOf("\"action\":")>-1)
				{
					console.info("Processing action: " + part.value); //query is only real one now...
					try
					{
						ijfQueryData(cleanWordChars,options.tags);
				    }
				    catch(e)
				    {
						//failed to update data
						ijfLog("Failed inline word action: " + JSON.stringify(e));
						return "Failed inline word action: " + JSON.stringify(e);
					}
					return "";
				}
				else
				{
						if(typeof(value)=="string") return value.replace("\n","<w:br/>");
						else return value;
				}
			}
		}
		if (part.type === "content" || part.type === "tag") {
			return part.value;
		}
		throw new Error(`Unimplemented tag type "${part.type}"`);
	});
	var retVal = compArr.join("");
	return retVal;
}

module.exports = render;
