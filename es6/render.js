"use strict";

const ScopeManager = require("./scope-manager");
const DocUtils = require("./doc-utils");

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
				//return DocUtils.utf8ToWord(value.replace("\n","<w:br/>"));
				return value.replace("\n","<w:br/>");
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
