var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
    return cell !== '' && cell != null;
}

function loadFileData(filename) {
    if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
        try {
            var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
            var firstSheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[firstSheetName];
            var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
            var filteredData = jsonData.filter(row => row.some(filledCell));
            var headerRowIndex = filteredData.findIndex((row, index) =>
                row.filter(filledCell).length >= filteredData[index + 1]?.filter(filledCell).length
            );
            if (headerRowIndex === -1 || headerRowIndex > 25) {
                headerRowIndex = 0;
            }
            var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
            csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
            return csv;
        } catch (e) {
            console.error(e);
            return "";
        }
    }
    return gk_fileData[filename] || "";
}

const randomPages = [
    'https://www.hackerrank.com',
    'https://dev.to',
    'https://css-tricks.com',
    'https://www.smashingmagazine.com',
    'https://news.ycombinator.com'
];

function loadRandomPage() {
    const randomIndex = Math.floor(Math.random() * randomPages.length);
    document.getElementById('randomPage').src = randomPages[randomIndex];
}

function toTamilNumeral(num) {
    const tamilDigits = ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯'];
    return num.toString().split('').map(digit => tamilDigits[parseInt(digit)]).join('');
}

function updateVisitorCount() {
    let count = localStorage.getItem('visitorCount') || 0;
    count = parseInt(count) + 1;
    localStorage.setItem('visitorCount', count);
    document.getElementById('visitorCount').textContent = `Visitors: ${toTamilNumeral(count)}`;
}

async function fetchLinuxCommits() {
    try {
        const response = await fetch('https://api.github.com/repos/torvalds/linux/commits?per_page=5');
        const commits = await response.json();
        const linuxList = document.getElementById('linuxCommits');
        linuxList.innerHTML = '';
        commits.forEach(commit => {
            const li = document.createElement('li');
            li.textContent = `[${commit.sha.slice(0,7)}] ${commit.commit.message.split('\n')[0]} (${new Date(commit.commit.author.date).toISOString().split('T')[0]})`;
            linuxList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching Linux commits:', error);
    }
}

async function fetchPostgresCommits() {
    try {
        const response = await fetch('https://api.github.com/repos/postgres/postgres/commits?per_page=5');
        const commits = await response.json();
        const postgresList = document.getElementById('postgresCommits');
        postgresList.innerHTML = '';
        commits.forEach(commit => {
            const li = document.createElement('li');
            li.textContent = `[${commit.sha.slice(0,7)}] ${commit.commit.message.split('\n')[0]} (${new Date(commit.commit.author.date).toISOString().split('T')[0]})`;
            postgresList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching PostgreSQL commits:', error);
    }
}

const hackerRankNews = [
    {
        title: "HackerRank’s Tech Talent Summit in London",
        date: "2025-04-28",
        description: "HackerRank will host its Tech Talent Summit on May 8, 2025, in London, focusing on AI's impact on tech roles and skills. Register at hackerrank.com/tech-talent-summit.",
        source: "finance.yahoo.com"
    },
    {
        title: "HackerRank’s AI Day 2025 Highlights",
        date: "2025-03-18",
        description: "HackerRank’s AI Day 2025 showcased new product innovations and insights from CEOs of HackerRank, GitHub, and Perplexity.",
        source: "markets.businessinsider.com"
    }
];

function displayHackerRankNews() {
    const newsContainer = document.getElementById('hackerRankNews');
    hackerRankNews.forEach(news => {
        const div = document.createElement('div');
        div.className = 'news-item';
        div.innerHTML = `${news.title} (${news.date})\n${news.description}\nSource: ${news.source}`;
        newsContainer.appendChild(div);
    });
}

function initChessPuzzle() {
    const board = ChessBoard('lichess-board', {
        position: 'start',
        draggable: true,
        dropOffBoard: 'snapback'
    });
    const chess = new Chess();
    
    async function loadPuzzle() {
        try {
            const response = await fetch('https://lichess.org/api/puzzle/daily');
            const puzzle = await response.json();
            chess.load_pgn(puzzle.game.pgn);
            board.position(chess.fen());
        } catch (error) {
            console.error('Error loading Lichess puzzle:', error);
        }
    }
    
    loadPuzzle();
}

document.addEventListener('DOMContentLoaded', () => {
    loadRandomPage();
    updateVisitorCount();
    fetchLinuxCommits();
    fetchPostgresCommits();
    displayHackerRankNews();
    initChessPuzzle();
});