(() => {
    const input = document.getElementById('file');
    const table = document.createElement('table');
    let directorsData = [];
    let sortKey = 'movie_count'; // Default sort key
    let ascending = false;       // Default descending

    if (!input) return;

    document.body.appendChild(table);

    input.addEventListener('change', () => {
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];

		parseCSV(file);
    });

	const MIN_MOVIE_TRESHOLD = 3;
    const RATING_IDX = 1;
    let rawArray = [];
    let directorMap = new Map();

    function parseCSV(file) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            let csvString = evt.target.result;
            csvArray = parseToArray(csvString);
            csvArray.shift();
            for (row of csvArray) {
                rawArray.push([row[RATING_IDX], extractDirectors(row)]);
            }
            for (row of rawArray) {
                let rating = parseInt(row[0])
                let directors = row[1]
                if (directors) {
                    for (director of directors) {
                        //directorMap["Hitchcock"]: [7, ~60] !!!instead of average use total score, calculate average on display
                        //key: dirname = [movie_count, ~total_rating]
                        if (directorMap.has(director)) {
                            let countAndRating = directorMap.get(director)
                            countAndRating[0]++
                            countAndRating[1] += rating
                            directorMap.set(director, countAndRating)
                        } else {
                            directorMap.set(director, [1, rating])
                        }
                    }
                }
            }
            directorsData = convertMapToArray(directorMap);
			sortAndRender();
        };
        reader.readAsText(file);
    }

    function parseToArray(csvString){
        //Split the array into rows, then split these rows into cells
        return csvString.split('\n').map(row => {
            return row.split(',')
        })
    }

    function extractDirectors(row){
        let directors = [];
        for (let i = row.length - 1; i >= 0; i--) {
            if (isNaN(row[i][1])) {
                directors.push(row[i]);
            } else {
                return directors;
            }
        }
    }

    function convertMapToArray(directorMap) {
        let out = [];
        for (const [key, value] of directorMap) {
            if (value[0] >= MIN_MOVIE_TRESHOLD && key != "") {
                out.push({
                    "director_name": key.replace("\"", "").replace("\"", ""),
                    "movie_count": value[0],
                    "avg_rating": (value[1]/value[0]).toFixed(1),
                });
            }
        }
        return out;
    }

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
        if (!sortKey || directorsData.length === 0) return;
        const sorted = [...directorsData].sort((a, b) => {
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
