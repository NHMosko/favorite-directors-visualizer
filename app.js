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
	const TMDB_API_KEY = "4445fe4f91eba86a59b725296d635e76"
    let rawArray = [];
	let origin = ""

    function parseCSV(file) {
		// Reset everything
		rawArray = [];
		directorsData = [];
		origin = "";
		sortKey = 'movie_count';
		ascending = false;
		table.innerHTML = "";

        var reader = new FileReader();
        reader.onload = async function (evt) {
            let csvString = evt.target.result;
            csvArray = parseToArray(csvString);
            let headers = csvArray.shift();
			if (headers[0].startsWith("Const")) {
				console.log("IMDb")
				origin = "imdb"
				for (let row of csvArray) {
					rawArray.push([row[RATING_IDX], extractDirectors(row)]);
				}
			} else if (headers[0].startsWith("Date")) {
				console.log("Letterboxd")
				origin = "letterboxd"
				document.getElementById("loader_holder").style.display = "block";
				let progressEnd = csvArray.length;
				let progress = 0;
				loader.value = progress;
				loader.max = progressEnd;
				for (let row of csvArray) {
					if (row.length > 1) {
						console.log("Fetching films")
						let directorsPromise = getDirectorFromTMDb(row)
						mapDirectors(rawArray, 1); //show everyone
						let directors = await directorsPromise
						if (directors.length > 0) {
							rawArray.push([row[row.length - 1], directors]);
						}
						progress++;
						loader.value = progress;
					}
				}
				document.getElementById("loader_holder").style.display = "none";
				//console.log(rawArray);
			} else {
				console.log("Unsupported file")
				return
			}
			mapDirectors(rawArray);
        };
        reader.readAsText(file);
    }

	function mapDirectors(rawArray, minMovieTreshold = MIN_MOVIE_TRESHOLD) {
		let directorMap = new Map();
		for (let row of rawArray) {
			let rating = parseInt(row[0])
			let directors = row[1]
			if (directors) {
				for (let director of directors) {
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
		directorsData = convertMapToArray(directorMap, minMovieTreshold);
		sortAndRender();
	}


    function parseToArray(csvString){
        //Split the array into rows, then split these rows into cells
        return csvString.split('\n').map(row => {
            return row.trim().split(',');
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

	async function getDirectorFromTMDb(row) {
		//await new Promise(r => setTimeout(r, 400));

		let titleAndYear = []
		if (row[1][0] != "\"") {
			titleAndYear = [row[1], row[2]]
		} else {
			titleAndYear = extractTitleAndYear(row)
		}
		let title = titleAndYear[0]
		let year = titleAndYear[1]

		fetchingText.innerText = `Fetching director data from TMDb...\n Movie: ${title} (${year})`
		//console.log(titleAndYear)

		//Edge case:
		if (title === "The VelociPastor") {
			year = 2018
		}
		//

		const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`);
		const data = await res.json();
		if (data.results && data.results[0]) {
			const movieId = data.results[0].id;

			const creditsUrl = `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`;
			const creditsRes = await fetch(creditsUrl);
			const creditsData = await creditsRes.json();
			if (creditsData) {
				let directors = [];
				for (let person of creditsData.crew) {
					if (person.job === "Director") {
						directors.push(person.name);
					}
				}	
				//console.log("Movie:", data.results[0].title, "director:", directors)
				return directors;
			}

		} else {
			console.warn('Movie not found or request failed:', title, year);
		}
		
		return []
	}

	function extractTitleAndYear(row) {
		let title = ""
		let year = 0

		for (let i = 1; i < row.length; i++) {
			//console.log(row[i][row[i].length - 1])
			if (row[i][row[i].length - 1] == "\"") {
				title += row[i]
				year = row[i + 1]
				break
			}

			title += row[i] + ","
		}

		return [title, year]
	}

    function convertMapToArray(directorMap, minMovieTreshold = MIN_MOVIE_TRESHOLD) {
        let out = [];
        for (const [key, value] of directorMap) {
            if (value[0] >= minMovieTreshold && key != "") {
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
				if (origin === "letterboxd" && k === "avg_rating") {
					td.textContent += generateStars(v)
				}
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

	function generateStars(rating) {
		let stars = " "
		for (let i = 0; i < Math.floor(rating); i++) {
			stars += "★"
		}
		if (rating % 1 >= 0.5) {
			stars += "⯪"
		}
		while (stars.length < 6) {
			stars += "☆"
		}
		return stars
	}

    function sortAndRender() {
        if (!sortKey || directorsData.length === 0) return;
        const sorted = [...directorsData].sort((a, b) => {
            let va = a[sortKey], vb = b[sortKey];

            const na = parseFloat(va), nb = parseFloat(vb);
			let cmp;
            if (!isNaN(na) && !isNaN(nb)) {
                cmp = ascending ? na - nb : nb - na;
            } else {
				va = (va ?? '').toString().toLowerCase();
				vb = (vb ?? '').toString().toLowerCase();
				if (va < vb) {
					cmp = ascending ? -1 : 1;
				} else if (va > vb) {
					cmp = ascending ? 1 : -1;
				} else {
					cmp = 0
				}
			}

			if (cmp === 0) {
				if (sortKey === "movie_count") {
					const rateA = parseFloat(a.avg_rating)
					const rateB = parseFloat(b.avg_rating)
					cmp = ascending ? rateA - rateB : rateB - rateA
				} else {
					const countA = parseFloat(a.movie_count)
					const countB = parseFloat(b.movie_count)
					cmp = ascending ? countA - countB : countB - countA
				}
			}

            return cmp;
        });
        buildTable(sorted);
    }
})();
