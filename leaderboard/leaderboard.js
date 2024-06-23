const table = document.querySelector('table');
const tbody = document.querySelector('tbody');

let log = JSON.parse(localStorage.getItem('lastStandLogAsil'));

if (!log){
    table.style.display = 'none';
}
else{
    for (let i = 1; i <= log.noOfGames; i++){
        log.games.sort(compareFn);

        let tr = document.createElement('tr');
        
        let td = document.createElement('td');
        td.innerText = i;
        tr.append(td);

        td = document.createElement('td');
        td.innerText = log.games[i-1].name;
        tr.append(td);

        td = document.createElement('td');
        td.innerText = log.games[i-1].score;
        tr.append(td);

        tbody.append(tr);
    }
}

function compareFn(a, b){
    return b.score - a.score;
}
