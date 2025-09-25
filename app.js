(() => {
    const input = document.getElementById('file');
    const table = document.createElement('table');
    let jsonData = [];
    let sortKey = 'movie_count'; // Default sort key
    let ascending = false;       // Default descending

    if (!input) return;

    document.body.appendChild(table);

    input.addEventListener('change', () => {
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            jsonData = JSON.parse(text);
            // Keep default sort on new data
            sortAndRender();
        };

        reader.readAsText(file);
    });

    function buildTable(json) {
        table.innerHTML = '';

        if (!json || json.length === 0) return;

        // Aliases for column headers
        const aliases = {
            director_name: 'Directors',
            movie_count: 'Movies Rated',
            avg_rating: 'Average Rating'
        };

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const keys = Object.keys(json[0]);

        keys.forEach(k => {
            const th = document.createElement('th');
            th.style.cursor = 'pointer';

            // Use alias if available, else use key
            const label = aliases[k] || k;

            // Add arrow if this is the sorted column
            if (sortKey === k) {
                th.textContent = ascending ? `${label} ▲` : `${label} ▼`;
            } else {
                th.textContent = label;
            }

            th.addEventListener('click', () => {
                if (sortKey === k) {
                    ascending = !ascending;
                } else {
                    sortKey = k;
                    ascending = true;
                }
                sortAndRender();
            });
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        json.forEach(row => {
            const tr = document.createElement('tr');
            keys.forEach(k => {
                const td = document.createElement('td');
                let v = row[k];
                if (v === null || v === undefined) v = '';
                if (typeof v === 'object') v = JSON.stringify(v);
                td.textContent = v;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

    function sortAndRender() {
        if (!sortKey || jsonData.length === 0) return;
        const sorted = [...jsonData].sort((a, b) => {
            let va = a[sortKey], vb = b[sortKey];

            const na = parseFloat(va), nb = parseFloat(vb);
            if (!isNaN(na) && !isNaN(nb)) {
                return ascending ? na - nb : nb - na;
            }

            va = (va ?? '').toString().toLowerCase();
            vb = (vb ?? '').toString().toLowerCase();
            if (va < vb) return ascending ? -1 : 1;
            if (va > vb) return ascending ? 1 : -1;
            return 0;
        });
        buildTable(sorted);
    }
})();