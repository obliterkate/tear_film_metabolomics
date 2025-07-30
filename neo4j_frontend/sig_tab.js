const regPriority = {
    "up": 3,
    "down": 2,
    "undefined": 1
};

document.getElementById("uploadExcel").addEventListener("change", handleExcelUpload);

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const idCounts = {};
        rawData.forEach(row => {
            const id = row["ID"];
            if (id) idCounts[id] = (idCounts[id] || 0) + 1;
        });

        const processedData = rawData.map(row => {
            const log2FC = parseFloat(row["log 2 FC"]);
            let reg = "Undefined";
            if (!isNaN(log2FC)) reg = log2FC > 0 ? "Upregulated" : "Downregulated";

            const format = val => isNaN(val) ? val : parseFloat(val).toPrecision(5);

            return {
                Metabolite: row["ID"],
                FoldChange: format(row["fold change"]),
                Log2FoldChange: format(row["log 2 FC"]),
                PValue: format(row["P value"]),
                Regulation: reg,
                Duplicate_Count: idCounts[row["ID"]] || 1
            };
        });

        renderTable(processedData);
    };
    reader.readAsArrayBuffer(file);
}

function renderTable(data) {
    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-row", JSON.stringify(row).toLowerCase());

        let id = "", regulation = "", style = "";
        if (row.Regulation === "Upregulated") {
            id = "up";
            regulation = "➔";
            style = "font-size: 24px; color: #00ff00; text-align: center; transform: rotate(-90deg);";
        } else if (row.Regulation === "Downregulated") {
            id = "down";
            regulation = "➔";
            style = "font-size: 24px; color: #ff0000; text-align: center; transform: rotate(90deg);";
        } else {
            id = "undefined";
            regulation = row.Regulation;
            style = "text-align: center;";
        }

        tr.innerHTML = `
            <td>${row.Metabolite}</td>
            <td style="text-align: center;">${row.FoldChange}</td>
            <td style="text-align: center;">${row.Log2FoldChange}</td>
            <td style="text-align: center;">${row.PValue}</td>
            <td id="${id}" style="${style}">${regulation}</td>
            <td style="text-align: center;">${row.Duplicate_Count}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filterResults() {
    const filter = document.getElementById("filter").value.toLowerCase();
    const rows = document.querySelectorAll("#resultsTable tbody tr");
    rows.forEach(row => {
        const rowData = row.getAttribute("data-row");
        row.style.display = rowData.includes(filter) ? "" : "none";
    });
}

function filterByPValue() {
    const threshold = parseFloat(document.getElementById("pValueInput").value);
    const rows = document.querySelectorAll("#resultsTable tbody tr");
    rows.forEach(row => {
        const pVal = parseFloat(row.querySelector("td:nth-child(4)").textContent.trim());
        row.style.display = (!isNaN(pVal) && pVal <= threshold) ? "" : "none";
    });
}

function sortResults() {
    const method = document.getElementById("sortingDropdown").value || 1;
    const direction = document.getElementById('asc').checked ? "asc" : "desc";
    const tableBody = document.querySelector("#resultsTable tbody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));

    rows.sort((a, b) => {
        const getText = (el, n) => el.querySelector(`td:nth-child(${n})`).textContent.trim();

        if (method == "1") {
            const [aText, bText] = [getText(a, 1).toLowerCase(), getText(b, 1).toLowerCase()];
            return direction === "asc" ? aText.localeCompare(bText) : bText.localeCompare(aText);
        } else if (method == "4") {
            const [aNum, bNum] = [parseFloat(getText(a, 4)), parseFloat(getText(b, 4))];
            return direction === "asc" ? aNum - bNum : bNum - aNum;
        } else if (method == "8") {
            const [aReg, bReg] = [a.querySelector("td:nth-child(5)").id, b.querySelector("td:nth-child(5)").id];
            return direction === "asc" ? regPriority[bReg] - regPriority[aReg] : regPriority[aReg] - regPriority[bReg];
        } else {
            const [aNum, bNum] = [parseFloat(getText(a, method)), parseFloat(getText(b, method))];
            return direction === "asc" ? aNum - bNum : bNum - aNum;
        }
    });

    rows.forEach(row => tableBody.appendChild(row));
}

function changeOptions() {
    const method = document.getElementById("sortingDropdown").value;
    const ascLabel = document.querySelector("label[for='asc']");
    const descLabel = document.querySelector("label[for='desc']");
    const directionBox = document.getElementById("sort-direction");

    directionBox.style.display = "block";
    if (method == "1") {
        ascLabel.textContent = "A - Z";
        descLabel.textContent = "Z - A";
    } else if (method == "4") {
        ascLabel.textContent = "Ascending";
        descLabel.textContent = "Descending";
    } else if (method == "8") {
        ascLabel.textContent = "Up";
        descLabel.textContent = "Down";
    } else {
        ascLabel.textContent = "Ascending";
        descLabel.textContent = "Descending";
    }

    sortResults();
} 
