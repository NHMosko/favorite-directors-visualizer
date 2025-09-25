(() => {
    const input = document.getElementById('file');
    const table = document.createElement('table');

    if (!input) {
        console.error('No input element with id="file" found.');
        return;
    }

    document.body.appendChild(table);

    input.addEventListener('change', () => {
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            let data = JSON.parse(text);

            buildTable(data);
        };

        reader.onerror = (e) => {
            console.error(e);
        };

        reader.readAsText(file);
    });

    function buildTable(json) {
        table.innerHTML = '';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const keys = Object.keys(json[0]);

        keys.forEach(k => {
            const th = document.createElement('th');
            th.textContent = k;
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
})();