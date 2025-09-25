(() => {
    var DELIMITER = ',';
    var NEWLINE = '\n';
    var i = document.getElementById('file');
    var table = document.getElementById('table');

    if (!i) {
        return;
    }

    i.addEventListener('change', function () {
        if (i.files && i.files.length > 0) {
            parseCSV(i.files[0]);
        }
    })

    function parseCSV(file) {
        if (!file || !FileReader) {
            return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
            toTable(e.target.result);
        };

        reader.readAsText(file);
    }

    function toTable(text) {
        if (!text || !table) {
            return;
        }

        //clear table
        while (table.lastElementChild) {
            table.removeChild(table.lastElementChild);
        }

        var rows = text.split(NEWLINE);
        var headers = rows.shift().trim().split(DELIMITER);
        var htr = document.createElement('tr');

        headers.forEach((h) => {
            var th = document.createElement('th');
            var ht = h.trim();

            if (!ht) {
                return;
            }

            th.textContent = ht;
            htr.appendChild(th);
        });

        table.appendChild(htr);

        var rtr;

        rows.forEach((r) => {
            r = r.trim();

            if (!r) {
                return;
            }

            var cols_split = r.split(DELIMITER);
            var cols = [];

            if (cols_split.length == 0) {
                return;
            }

            let currentWord = "";
            for (let i = 0; i < cols_split.length; i++) {
                let thisWord = cols_split[i];
                if (!currentWord) {
                    if (thisWord[0] != '"') {
                        cols.push(thisWord);
                    }
                    else if (thisWord[thisWord.length - 1] == '"' && thisWord[thisWord.length - 2] != '\\') {
                        cols.push(thisWord.slice(1, -1));
                    }
                    else {
                        currentWord += thisWord.slice(1) + ',';

                    }
                }
                else {
                    if (thisWord[thisWord.length - 1] == '"' && thisWord[thisWord.length - 2] != '\\') {
                        currentWord += thisWord.slice(0, -1);
                        cols.push(currentWord);
                        currentWord = "";
                    }
                    else {
                        currentWord += thisWord + ',';
                    }
                }
            }

            rtr = document.createElement('tr');

            cols.forEach((c) => {
                var td = document.createElement('td');
                var tc = c.trim();

                td.textContent = tc;
                rtr.appendChild(td);
            });

            table.appendChild(rtr);
        })
    }
})();