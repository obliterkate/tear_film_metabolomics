// Neo4j HTTP endpoint for Cypher transaction API
const neo4j_http_url = "http://localhost:7474/db/neo4j/tx"
const neo4jUsername = "neo4j"
const neo4jPassword = "password"

// Used for drawing nodes and arrows later on
const circleSize = 30
const arrowHeight = 5
const arrowWidth = 5

let metaboliteOne = ""
let metaboliteTwo = ""

let single = true;

// Fetch all of the data from the json files
let compoundsData = [];
let pathwaysData = [];
fetch('compounds.json')
    .then(response => response.json())
    .then(data => {
        compoundsData = data;
        console.log("Compounds data loaded:", compoundsData);
    })
    .catch(error => console.error("Error loading compounds data:", error));

fetch('pathways.json')
    .then(response => response.json())
    .then(data => {
        pathwaysData = data;
        console.log("Pathways data loaded:", pathwaysData);
    })
    .catch(error => console.error("Error loading pathways data:", error));

/**
 * Gets the compoundId from a given compound name
 * @param {string} compoundName, name of a compound
 * @returns compoundID or null
 */
function getCompoundId(compoundName) {
    const compound = compoundsData.find(c => c.compound_name.toLowerCase() == compoundName.toLowerCase());
    return compound ? compound.compound_id : null;
}

/**
 * Updates name of a metabolite based on compoundID, and whether it is the first metabolite
 * @param {number} compoundID, ID of a compound
 * @param {bool} first, compound may have aliases, first instance of the compound
 */
function changeName(compoundID, first) {
    const compounds = compoundsData
        .filter(c => c.compound_id == compoundID)
        .sort((a, b) => {
            const nameA = a.compound_name;
            const nameB = b.compound_name;
            const compare = nameA.length - nameB.length;
            return compare != 0 ? compare : nameA.localeCompare(nameB);
        });

    if (compounds) {
        if (first) {
            metaboliteOne = compounds[0].compound_name;
        } else {
            metaboliteTwo = compounds[0].compound_name;
        }
    }
}

/**
 * If the pathway exists, gets the pathway ID from the name
 * @param {string }pathwayName, name of a pathway
 * @returns pathway's ID or null
 */
function getPathwayId(pathwayName) {
    const name = pathwayName.split(";");
    const pathway = pathwaysData.find(p => p.pathway_name.toLowerCase() === name[0].toLowerCase());
    return pathway ? pathway.pathway_id : null;
}

/**
 * Opens link for either pathways or compounds, displays its information
 * @param {bool} isCompound 
 * @param {number} id 
 * @param {string} name 
 */
function openLinksPage(isCompound, id, name) {
    if (isCompound) {
        const url = `compound_tab.html?compoundId=${id}`;
        console.log(`Opening compound page: ${url}`);
        window.open(url, "_blank");
    } else {
        const url = `pathway_tab.html?pathwayId=${id}`;
        console.log(`Opening pathway page: ${url}`);
        window.open(url, "_blank");
    }
}

/**
 * Toggles the visibility of input fields based on the selected query type.
 * 
 * The function checks which radio button is selected:
 * - If the radio button with ID 'one' is checked, it displays the input
 *   field for a single metabolite (`oneMetabolite`) and hides the input field
 *   for two metabolites (`twoMetabolites`).
 * - If the radio button with ID 'two' is checked, it hides the input field
 *   for a single metabolite (`oneMetabolite`) and displays the input field
 *   for two metabolites (`twoMetabolites`).
 */
function changeQueryType() {
    if (document.getElementById('one').checked) {
        document.getElementById('oneMetabolite').style.display = 'block';
        document.getElementById('twoMetabolites').style.display = 'none';
    } else if (document.getElementById('two').checked) {
        document.getElementById('oneMetabolite').style.display = 'none';
        document.getElementById('twoMetabolites').style.display = 'block';
    }
}

/**
 * Processes and submits a query for a metabolite or pathway, updates query history,
 * and generates a graph visualization based on the query.
 *
 * Functionality:
 * 1. Extracts input values from the query text field and neighbors dropdown.
 * 2. Determines whether the input corresponds to a compound or pathway.
 * 3. Updates query history stored in the browser's localStorage, either by appending
 *    a new query or updating the timestamp of an existing query.
 * 4. Constructs a Cypher query to fetch data from the Neo4j database and calls 
 *    `generateGraph` to visualize the query result.
 *
 * Cypher Query Construction:
 * - Constructs a `MATCH` clause to find a node in the database (`m0`) based on its KEGG ID or pathway ID.
 * - Dynamically appends relationships and neighboring nodes based on the `neighbors` count.
 * - Appends a `RETURN` clause to retrieve the matched nodes and relationships.
 * - Limits the query results to 300 entries.
 *
 */
const submitQuery = () => {
    // Contents of the query text field
    metaboliteOne = document.querySelector('#queryContainer').value
    const searched = metaboliteOne;
    metaboliteTwo = "";
    neighbors = document.querySelector('#neighborsDropdown').value;
    let type = -1;

    const compound = getCompoundId(metaboliteOne);
    const pathway = getPathwayId(metaboliteOne);
    if (compound) {
        changeName(compound, true);
        type = 1;
    } else if (pathway) {
        type = 2;
    }

    // Get history if no history make an array
    const queryHistory = JSON.parse(localStorage.getItem('queryHistory')) || [];

    // Check to see if the query already exists
    const existingQuery = queryHistory.find(q => 
        q.neighbors == neighbors && q.metabolite.toLowerCase() == searched.toLowerCase()
    );

    if (existingQuery) {
        existingQuery.timestamp = new Date().toLocaleString();
    } else {
        console.log("type = " + type);
        queryHistory.push({
            type: type,
            metabolite: searched,
            metabolite2: metaboliteTwo,
            neighbors: neighbors,
            timestamp: new Date().toLocaleString()
        });
    }
    
    // Save into local storage
    localStorage.setItem('queryHistory', JSON.stringify(queryHistory));

    let start = compound ? `MATCH (m0 {kegg_id: '${compound}'})` :
        pathway ? `MATCH (m0 {mapp_id: 'map${pathway}'})` : '';
    let end = ` RETURN m0`;
    for (let i = 0; i < neighbors; i++) {
        start += `-[r${i+1}:LINKED]-(m${i+1})`;
        end += `,r${i+1},m${i+1}`;
    }
    generateGraph(start + end + ` LIMIT 300`);
}

window.addEventListener('DOMContentLoaded', () => {

    // Get the metab name and neigbours in the URL
    const params = new URLSearchParams(window.location.search);
    const metabolite = params.get('metabolite');
    const neighbors = params.get('neighbors');

    // If metab name and neighbors are in the URL, set them
    if (metabolite && neighbors) {
        document.getElementById('queryContainer').value = metabolite;
        document.getElementById('neighborsDropdown').value = neighbors;
    } else if (neighbors) {
        const pathway = params.get('pathway');
        document.getElementById('queryContainer').value = pathway;
        document.getElementById('neighborsDropdown').value = neighbors;
    } else {
        const metabolite1 = params.get('metaboliteOne');
        const metabolite2 = params.get('metaboliteTwo');
        if (metabolite1 && metabolite2) {
            document.getElementById('one').checked = false;
            document.getElementById('two').checked = true;
            changeQueryType();
            document.getElementById('firstMetabolite').value = metabolite1;
            document.getElementById('secondMetabolite').value = metabolite2;
        }
    }
});

/**
 * Finds the shortest path between two metabolites and visualizes the result.
 * 
 * Functionality:
 * 1. Sets the query type to multiple metabolites (`single = false`).
 * 2. Retrieves the names of the two metabolites from the input fields.
 * 3. Updates the query history stored in the browser's localStorage:
 *    - Checks if the query (pair of metabolites) already exists.
 *    - Updates the timestamp if it exists or adds a new entry if it doesn't.
 * 4. Retrieves the KEGG IDs for the two metabolites and updates their names.
 * 5. Constructs a Cypher query to find the shortest path between the two metabolites
 *    in the Neo4j database and calls `generateGraph` to visualize the result.

 * Cypher Query:
 * - Finds the shortest path between two metabolites (`m1` and `m2`) using their KEGG IDs.
 * - Matches the shortest path using `shortestPath` and retrieves the path for visualization.
 */
async function findPath() {
    single = false;
    metaboliteOne = document.querySelector('#firstMetabolite').value;
    metaboliteTwo = document.querySelector('#secondMetabolite').value;

    const queryHistory = JSON.parse(localStorage.getItem('queryHistory')) || [];
    const existingQuery = queryHistory.find(q => 
        q.metabolite.toLowerCase() == metaboliteOne.toLowerCase() &&
        q.metabolite2.toLowerCase() == metaboliteTwo.toLowerCase()
    );

    if (existingQuery) {
        existingQuery.timestamp = new Date().toLocaleString();
    } else {
        console.log("history = " + queryHistory);
        queryHistory.push({
            type: 3,
            metabolite: metaboliteOne,
            metabolite2: metaboliteTwo,
            neighbors: "",
            timestamp: new Date().toLocaleString()
        });
        console.log("history = " + queryHistory);
    }
    
    //save into local storage
    localStorage.setItem('queryHistory', JSON.stringify(queryHistory));

    const kegg1 = getCompoundId(metaboliteOne);
    const kegg2 = getCompoundId(metaboliteTwo);
    if (kegg1 && kegg2) {
        changeName(kegg1, true);
        changeName(kegg2, false);
        generateGraph(
            `MATCH (m1:METABOLITE {kegg_id: '${kegg1}'}), (m2:METABOLITE {kegg_id: '${kegg2}'})
            MATCH path = shortestPath((m1)-[*]-(m2))
            RETURN path`
        );
    }
}

// generateGraph
//      - Generates the nodes and links from the graph given from the return of the Cypher Query
//
// Parameters:
//      - cypherString (string) - cypher query that the graph will generate
//
// Returns:
//      - nothing
//
/**
 * Generates the nodes and links from the graph given from the return of the
 * Cypher query.
 * 
 * @param {*} cypherString 
 */
function generateGraph(cypherString) {
    let nodeItemMap = {}
    let linkItemMap = {}
    
    // make POST request with auth headers
    fetch(neo4j_http_url, {
        method: 'POST',
        // authentication using the username and password of the user in Neo4j
        headers: {
            "Authorization": "Basic " + btoa(`${neo4jUsername}:${neo4jPassword}`),
            "Content-Type": "application/json",
            "Accept": "application/json;charset=UTF-8",
        },
        // Formatted request for Neo4j's Cypher Transaction API with generated query included
        // https://neo4j.com/docs/http-api/current/actions/query-format/
        // generated query is formatted to be valid JSON for insertion into request body
        body: '{"statements":[{"statement":"' + cypherString.replace(/(\r\n|\n|\r)/gm, "\\n").replace(/"/g, '\\"') + '", "resultDataContents":["graph", "row"]}]}'
    })
        .then(res => res.json())
        .then(data => { // usable data from response JSON
            
            // If errors present in the response from Neo4j, propagate alert() dialog box with the error
            if (data.errors != null && data.errors.length > 0) {
                alert(`Error:${data.errors[0].message}(${data.errors[0].code})`);
            }
            // If results within valid data are not null or empty, extract the returned nodes/relationships into nodeItemMap and linkItemMap respectively
            if (data.results != null && data.results.length > 0 && data.results[0].data != null && data.results[0].data.length > 0) {
                let neo4jDataItmArray = data.results[0].data;
                neo4jDataItmArray.forEach(function (dataItem) { // Iterate through all items in the embedded 'results' element returned from Neo4j, https://neo4j.com/docs/http-api/current/actions/result-format/
                    // Node
                    if (dataItem.graph.nodes != null && dataItem.graph.nodes.length > 0) {
                        let neo4jNodeItmArray = dataItem.graph.nodes; // All nodes present in the results item
                        neo4jNodeItmArray.forEach(function (nodeItm) {
                            if (!(nodeItm.id in nodeItemMap)) // If node is not yet present, create new entry in nodeItemMap whose key is the node ID and value is the node itself
                                nodeItemMap[nodeItm.id] = nodeItm;
                        });
                    }
                    // Link, interchangeably called a relationship
                    if (dataItem.graph.relationships != null && dataItem.graph.relationships.length > 0) {
                        let neo4jLinkItmArray = dataItem.graph.relationships; // All relationships present in the results item
                        neo4jLinkItmArray.forEach(function (linkItm) {
                            if (!(linkItm.id in linkItemMap)) { // If link is not yet present, create new entry in linkItemMap whose key is the link ID and value is the link itself
                                // D3 force layout graph uses 'startNode' and 'endNode' to determine link start/end points, these are called 'source' and 'target' in JSON results from Neo4j
                                linkItm.source = linkItm.startNode;
                                linkItm.target = linkItm.endNode;
                                linkItemMap[linkItm.id] = linkItm;
                            }
                        });
                    }
                });
            }

            // Update the D3 force layout graph with the properly formatted lists of nodes and links from Neo4j
            updateGraph(Object.values(nodeItemMap), Object.values(linkItemMap));
        });
}

/**
 * Creates a new D3 force simulation, with the nodes and links returned from a
 * Cypher query to Neo4j for display on the canvas element.
 * @param {array} nodes 
 * @param {array} links 
 */
const updateGraph = (nodes, links) => {
    const canvas = document.querySelector('canvas');
    const width = canvas.width;
    const height = canvas.height;
    let transform = d3.zoomIdentity;

    // This object sets the force between links and instructs the below simulation to use the links provided from query results, https://github.com/d3/d3-force#links
    const d3LinkForce = d3.forceLink()
        .distance(50)
        .strength(0.1)
        .links(links)
        .id(d => d.id);

    // This defines a new D3 Force Simulation which controls the physical behavior of how nodes and links interact.
    // https://github.com/d3/d3-force#simulation
    
    let simulation = new d3.forceSimulation()
        .force('chargeForce', d3.forceManyBody().strength())
        .force('collideForce', d3.forceCollide(circleSize * 3))
        .force("center", d3.forceCenter(width / 2, height / 2))

    // Here, the simulation is instructed to use the nodes returned from the query results and to render links using the force defined above
    simulation
        .nodes(nodes)
        .force("linkForce", d3LinkForce)
        .on("tick",simulationUpdate) // on each tick of the simulation's internal timer, call simulationUpdate()
        .restart();

    d3.select(canvas)
        .call(d3.zoom()
            .scaleExtent([0.05, 10])
            .on('zoom', zoomed));

    function zoomed(e) {
        transform = e.transform;
        simulationUpdate();
    }

    // Zoom Buttons
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
            transform = event.transform;
            simulationUpdate();
        });

    // Call zoom on the canvas
    d3.select(canvas).call(zoom);

    // Zoom control button functions
    document.getElementById('zoomInBtn').onclick = () => zoom.scaleBy(d3.select(canvas).transition().duration(1000), 1.2);
    document.getElementById('zoomOutBtn').onclick = () => zoom.scaleBy(d3.select(canvas).transition().duration(500), 0.8);
    document.getElementById('resetZoomBtn').onclick = () => zoom.transform(d3.select(canvas).transition().duration(500), d3.zoomIdentity);

    // Save the current canvas function
    document.getElementById('saveCanvasBtn').onclick = function() {
        const canvas = document.getElementById('graphCanvas');
        console.log(canvas); 

        if (canvas) {
            console.log('Canvas found:', canvas);
        } else {
            console.error('Canvas element with ID "graphCanvas" not found.');
        }
        const dataURL = canvas.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'canvas_image.png';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // The canvas is cleared and then instructed to draw each node and link with updated locations per the physical force simulation.
    function simulationUpdate() {
        let context = canvas.getContext('2d');
        context.save(); // save canvas state, only rerender what's needed
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);

        // Draw links
        links.forEach(function(d) {
            context.beginPath();
            const deltaX = d.target.x - d.source.x;
            const deltaY = d.target.y - d.source.y;
            const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const cosTheta = deltaX / dist;
            const sinTheta = deltaY / dist;
            const sourceX = d.source.x + (circleSize * cosTheta);
            const sourceY = d.source.y + (circleSize * sinTheta);
            const targetX = d.target.x - (circleSize * cosTheta);
            const targetY = d.target.y - (circleSize * sinTheta);

            const arrowLeftX = targetX - (arrowHeight * sinTheta) - (arrowWidth * cosTheta);
            const arrowLeftY = targetY + (arrowHeight * cosTheta) - (arrowWidth * sinTheta);
            const arrowRightX = targetX + (arrowHeight * sinTheta) - (arrowWidth * cosTheta);
            const arrowRightY = targetY - (arrowHeight * cosTheta) - (arrowWidth * sinTheta);

            // Each link is drawn using SVG-format data to easily draw the dynamically generated arc
            let path = new Path2D(`M${sourceX},${sourceY} ${targetX},${targetY} M${targetX},${targetY} L${arrowLeftX},${arrowLeftY} L${arrowRightX},${arrowRightY} Z`);

            context.closePath();
            context.stroke(path);
        });

        // Draw nodes
        nodes.forEach(function(d) {
            context.beginPath();
            context.arc(d.x, d.y, circleSize, 0, 2 * Math.PI);

            // fill color
            if (d.properties.name.toLowerCase() == metaboliteOne.toLowerCase() || 
                d.properties.name.toLowerCase() == metaboliteTwo.toLowerCase()) {
                context.fillStyle = '#A865B5';
            } else if (d.labels && d.labels.includes('METABOLITE')) {
                context.fillStyle = '#4EA8E5';
            } else if (d.labels && d.labels.includes('PATHWAY')) {
                context.fillStyle = '#6df1a9';
            } else {
                context.fillStyle = '#000000';
            }
            context.fill()

            context.textAlign = "center"
            context.textBaseline = "middle"
            context.fillStyle = "#000000"
            context.font = '12px Arial'

            // Limit text length and add ellipsis if necessary
            const maxLabelLength = 10;
            let labelText = d.properties.name || d.properties.title || "";
            if (labelText.length > maxLabelLength - 3) {
                labelText = labelText.substring(0, maxLabelLength - 3) + "...";
            }

            // Draws the appropriate text on the node
            context.fillText(labelText, d.x, d.y)
            context.closePath();
            context.stroke();
        });

        context.restore();
    }

    canvas.addEventListener('mousemove', event => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
        const mouseY = (event.clientY - rect.top - transform.y) / transform.k;
    
        let isHoveringOverNode = false;
    
        nodes.forEach(node => {
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            if (Math.sqrt(dx * dx + dy * dy) < circleSize) {
                isHoveringOverNode = true; // If the mouse is over a node
            }
        });
    
        // Change cursor style based on hover state
        canvas.style.cursor = isHoveringOverNode ? 'pointer' : 'default';
    });

    canvas.addEventListener('click', event => {
        const rect = canvas.getBoundingClientRect();
        console.log("dimensions:", rect);
        const mouseX = (event.clientX - rect.left - transform.x) / transform.k;
        const mouseY = (event.clientY - rect.top - transform.y) / transform.k;
    
        nodes.forEach(node => {
            const dx = mouseX - node.x;
            const dy = mouseY - node.y;
            if (Math.sqrt(dx * dx + dy * dy) < circleSize) {
                const nodeName = node.properties.name;
                console.log("Node clicked:", nodeName);
    
                const compoundId = getCompoundId(nodeName);
                const pathwayId = getPathwayId(nodeName);
                console.log("Compound = " + compoundId + "\nPathway = " + pathwayId);
    
                if (compoundId) {
                    openLinksPage(true, compoundId, nodeName);
                } else if (pathwayId) {
                    openLinksPage(false, pathwayId, nodeName);
                } else {
                    alert("Link not available for this node.");
                }
            }
        });
    });
}

/**
 * Resizes canvas to fit the user's screen
 */
function responsiveCanvasSizer() {
    const canvas = document.querySelector('canvas')
    const rect = canvas.getBoundingClientRect()

    // Set the "actual" size of the canvas
    canvas.width = rect.width
    canvas.height = rect.height

    // Set the "drawn" size of the canvas
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
}
