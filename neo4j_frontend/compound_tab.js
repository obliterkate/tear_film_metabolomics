// Load information about a compound based on its ID
async function loadInfo(compoundId) {
    try {
        const response = await fetch("compounds.json");
        const compounds = await response.json();

        const names = compounds
            .filter(c => c.compound_id == compoundId)
            .map(c => c.compound_name)
            .sort((a, b) => {
                return a.localeCompare(b);
            });

        const formula = compounds
            .filter(c => c.compound_id == compoundId)
            .map(c => c.formula);

        const canonicalSmiles = compounds
            .filter(c => c.compound_id == compoundId)
            .map(c => c.canonical_smiles);

        document.getElementById('compoundId').innerText = `${compoundId}`;
        
        if (names.length > 0) {
            document.title = `Compound: ${names[0]}`;
            document.getElementById('nameTitle').innerText = names.length == 1 ? "Name:" : "Names:";
            document.getElementById('compoundName').innerText = `${names.join("\n")}`;
            document.getElementById('compoundFormula').innerText = `${formula[0]}`;
            document.getElementById('compoundSmiles').innerText = `${canonicalSmiles[0]}`;
        } else {
            document.getElementById('compoundName').innerText = `Compound not found`;
        }
        
        // Create URLs for KEGG and PubChem using compound ID
        const keggUrl = `https://www.genome.jp/dbget-bin/www_bget?cpd:${compoundId}`;
        const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/compound/${compoundId}`;
        document.getElementById('keggLink').href = keggUrl;
        document.getElementById('pubchemLink').href = pubchemUrl;
    } catch (error) {
        console.error("Error fetching compound data:", error);
    }
}

const urlParams = new URLSearchParams(window.location.search);
const compoundId = urlParams.get('compoundId');
if (compoundId) {
    loadInfo(compoundId);
} else {
    document.getElementById('compoundId').innerText = "Compound ID not provided.";
}
