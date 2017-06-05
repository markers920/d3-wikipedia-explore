
// api sandbox: https://en.wikipedia.org/wiki/Special:ApiSandbox
var wikiAPI = 'https://en.wikipedia.org/w/api.php'

//var svg;
//var simulation;
//var link;
//var node;

var seenNodes = {}		//good enough...
var seenLinks = {}		//good enough...

function addNode(newNode) {
	//console.log('   addNode(' + newNode + ')')
	if(!(newNode in seenNodes)) {
		//console.log('      added')
		//graph['nodes'].push({'id':newNode,'group':1})
		seenNodes[newNode] = {'id':newNode,'group':1}
	}
}

function addLink(source, target, value) {
	newLinkString = source + '/' + target + '/' + value
	//console.log('   addLink(' + newLinkString + ')')
	if(!(newLinkString in seenLinks)) {
		//console.log('      added')
		//graph['links'].push({'source': source, 'target': target, 'value': value})
		seenLinks[newLinkString] = {'source': source, 'target': target, 'value': value}
	}
}

function updateContent(seed) {
	console.log('getContent(' + seed + ')')
	$.getJSON( wikiAPI, {
		action : 'query',
		format : 'json',
		titles : seed,
		origin : '*',
		prop : 'links'
	})
	.done(function(data) {
		
		
		var pagesMap = data['query']['pages']
		for(key in pagesMap) {
			var page = pagesMap[key]
			var pageTitle = page['title']
			var pageLinks = page['links']
			
			addNode(pageTitle)
			
			pageLinks.forEach(function cb(pageLink) {
				var pageLinkTitle = pageLink['title']
				addNode(pageLinkTitle)
				addLink(pageTitle, pageLinkTitle, 1)
				//console.log('$$$ ' + pageTitle + ' -> ' + pageLinkTitle)
			})
		}
		
		//console.log('graph: ' + JSON.stringify(graph))
		
		var graph = {}
		graph['nodes'] = []
		graph['links'] = []
		
		for(newNodeKey in seenNodes) {
			//console.log('seenNodes:' + JSON.stringify(seenNodes[newNodeKey]))
			graph['nodes'].push(seenNodes[newNodeKey])
		}
		
		for(newLinkKey in seenLinks) {
			//console.log('seenLinks:' + JSON.stringify(seenLinks[newLinkKey]))
			graph['links'].push(seenLinks[newLinkKey])
		}
		
		makeGraph(graph)
	})
}



function makeGraph(graph) {
	var svg = d3.select("svg")
	var width = +svg.attr("width")
	var height = +svg.attr("height")
		
	svg.selectAll("*").remove()		// out with the old

	var simulation = d3.forceSimulation()
		.force("link", d3.forceLink().id(function(d) { return d.id; }))
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(width / 2, height / 2))
		
		
	var link = svg.append("g")
			.attr("class", "links")
		.selectAll("line")
		.data(graph.links)
		.enter().append("line")
			.attr("stroke-width", function(d) { return Math.sqrt(d.value); })

	var node = svg.append("g")
			.attr("class", "nodes")
		.selectAll("circle")
		.data(graph.nodes)
		.enter().append("circle")
			.attr("r", 8)
			.attr("fill", "#CC2222")
			.attr("stroke", "#FFFFFF")
			.attr("stroke-width", "5.0px")
			.on("click", function(d) {
				console.log("click:" + JSON.stringify(d))
				updateContent(d['id'])
			})
			.call(d3.drag()
				.on("start", function dragstarted(d) {
					if (!d3.event.active) simulation.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on("drag", function dragged(d) {
					d.fx = d3.event.x;
					d.fy = d3.event.y;
				})
				.on("end", function dragended(d) {
					if (!d3.event.active) {
						simulation.alphaTarget(0);
					}
					d.fx = null;
					d.fy = null;
				})
			)
			

	//add hover over tool tip
	node.append("title")
		.text(function(d) { return d.id; })
		
	simulation
		.nodes(graph.nodes)
		//.on("tick", ticked);
		.on("tick", function ticked() {
			//not sure why these are coming as null values
			node
				.attr("cx", function(d) { return ifNullReturnDefault(d.x, width/2); })
				.attr("cy", function(d) { return ifNullReturnDefault(d.y, height/2); })
				//.attr("cx", function(d) { return ifNullReturnDefault(d.x, stringHash(d.id)%width); })
				//.attr("cy", function(d) { return ifNullReturnDefault(d.y, stringHash(d.id)%height); });
				
			link
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; })
		})

	simulation.force("link")
		.links(graph.links)
}
	
function ifNullReturnDefault(v, d) {
	return v || d
}

/*function stringHash(str) {
	var hash = 0;
	//if (str.length == 0)
	//	return hash;
	for (i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}*/

