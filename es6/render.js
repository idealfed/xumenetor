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
	function ijfQueryData(inAction,options,inDebug)
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

			  var varBindings = jql.split("$").reduce(function(inKeys, p){
				  //must walk forward and end on ", ) or space
				  var i=0;
				  while(i<p.length) {
					  if((p[i]=="\"") || (p[i]==" ") || (p[i]==")") || (p[i]=="'")) break;
					  i++;
				  }
				  var key = p.substring(0,i);
				  inKeys.push(key);
				  return inKeys;
			  },[]);
			  varBindings=varBindings.slice(1);
  			  varBindings.forEach(function(b)
			  {
				 var newVal = options.scopeManager.getValue(b);
				 if(newVal) jql=jql.replace("$"+b,newVal);
			  });

			  var flds = action.fields;
			  //need to translate fields to custom fields....
				if(!ijf.jiraFields)
						{
							ijf.jiraFields = ijfUtils.getJiraFieldsSync();
							ijf.jiraFieldsKeyed = [];
							ijf.jiraFields.forEach(function(f)
							{
								ijf.jiraFieldsKeyed[f.name]=f;
							});
				}
			  var translateFields = ijfUtils.translateJiraFieldsToIds(flds);

			  var suffix = "";
			  if(flds) suffix = "&fields=" + translateFields;

			   var aUrl = '/rest/api/2/search?jql='+jql + suffix;
			   var rawList = ijfUtils.jiraApiSync('GET',aUrl, null);
			   var newVals=[];
               rawList.issues.forEach(function(i){
					var itemData={};

					if(i.fields)
					{
						var fieldMap = ijfUtils.translateJiraFieldsToObjs(flds);
						fieldMap.forEach(function(f){
							if(ijf.jiraFieldsKeyed.hasOwnProperty(f.name))
							{
								var v = ijfUtils.handleJiraFieldType(ijf.jiraFieldsKeyed[f.name],i.fields[f.id],true,true);
								itemData[action.path + "." + f.name]=v;
							}
							else
							{
								itemData[action.path + "." + f.id]= i.fields[f.id];
							}
						});
				    }
					itemData[action.path + "." + "key"]=i.key;
					itemData[action.path + "." + "id"]=i.id;
					itemData[action.path + "." + "self"]=i.self;
 	 			    newVals.push(itemData);
			   });
			   if(action.snippet)
			   {
				   if(ijf.snippets.hasOwnProperty(action.snippet)) newVals = ijf.snippets[action.snippet](newVals);
			   }
			   options.scopeManager.scopeList[(options.scopeManager.scopeList.length-1)][action.path]=newVals;
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

				//special handling for altering data model and extending data dynamically
				//syntax:
				//{action:query, jql:"", fields:"", path:"pathtojsonlocationtosave", snippet:"snippet that alters data optionally"}
				//console.info("About to process: " + part.value);
				var cleanWordChars = ijfUtils.replaceWordChars(part.value);
				if(cleanWordChars.indexOf("\"action\":")>-1)
				{
					//console.info("Processing action: " + part.value); //query is only real one now...
					try
					{
						ijfQueryData(cleanWordChars,options);
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
					    if(value=="undefined")
					    {
							if(options.includeTags) return "NOVALUE-" + part.value + "-FORTAG";
							return "";
						}

						if(typeof(value)=="string")
						{
							var cleanWordChars = ijfUtils.replaceWordChars(value);
							return cleanWordChars.replace("\n","<w:br/>");
						}
					    return value;
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
