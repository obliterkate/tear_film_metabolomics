// Load information about a compound based on its ID or Name

async function loadInfo(compoundInput) {
    try {
        const response = await fetch("compounds.json");
        const compounds = await response.json();

        // Normalize input (case-insensitive for names)
        const inputLower = compoundInput.trim().toLowerCase();

        // Match by ID (exact) or Name (case-insensitive)
        const matches = compounds.filter(c =>
            (c.compound_id && c.compound_id === compoundInput) ||
            (c.compound_name && c.compound_name.toLowerCase() === inputLower)
        );

        // Handle found compound
        if (matches.length > 0) {
            const compound = matches[0];

            // Update Title
            document.title = `Compound: ${compound.compound_name || compound.compound_id}`;

            // Display data with fallbacks for missing fields
            document.getElementById('compoundId').innerText = compound.compound_id || "Not available";
            document.getElementById('nameTitle').innerText = "Name:";
            document.getElementById('compoundName').innerText = compound.compound_name || "Name not available";
            document.getElementById('compoundFormula').innerText = compound.formula || "Formula not available";
            document.getElementById('compoundSmiles').innerText = compound.canonical_smiles || "SMILES not available";

            // Links
            if (compound.compound_id) {
                document.getElementById('keggLink').href = `https://www.genome.jp/dbget-bin/www_bget?cpd:${compound.compound_id}`;
                document.getElementById('pubchemLink').href = `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.compound_id}`;
            } else {
                document.getElementById('keggLink').removeAttribute('href');
                document.getElementById('pubchemLink').removeAttribute('href');
            }

        } else {
            // If compound not found
            document.getElementById('compoundId').innerText = compoundInput;
            document.getElementById('compoundName').innerText = "Compound not found";
            document.getElementById('compoundFormula').innerText = "-";
            document.getElementById('compoundSmiles').innerText = "-";
        }

    } catch (error) {
        console.error("Error fetching compound data:", error);
        document.getElementById('compoundName').innerText = "Error loading data";
    }
}

// Get query parameter from URL (compoundId = ID or Name)
const urlParams = new URLSearchParams(window.location.search);
const compoundInput = urlParams.get('compoundId');
if (compoundInput) {
    loadInfo(compoundInput);
} else {
    document.getElementById('compoundId').innerText = "Compound ID or Name not provided.";
}
