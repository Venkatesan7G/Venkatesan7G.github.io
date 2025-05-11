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

function updateVisitorCount() {
    let count = localStorage.getItem('visitorCount') || 0;
    count = parseInt(count) + 1;
    localStorage.setItem('visitorCount', count);
    const binaryCount = count.toString(2);
    document.getElementById('visitorCount').textContent = `Visitors: ${count} (Binary: ${binaryCount})`;
}

const linuxCommits = [
    { hash: '1a2b3c4', message: 'Fix memory leak in kernel module', date: '2025-05-10' },
    { hash: '5d6e7f8', message: 'Update scheduler for better performance', date: '2025-05-09' },
    { hash: '9g0h1i2', message: 'Add support for new hardware', date: '2025-05-08' },
    { hash: '3j4k5l6', message: 'Security patch for network stack', date: '2025-05-07' },
    { hash: '7m8n9o0', message: 'Optimize filesystem performance', date: '2025-05-06' }
];

const postgresCommits = [
    { hash: 'p1q2r3s4', message: 'Improve query planner performance', date: '2025-05-09' },
    { hash: 't5u6v7w8', message: 'Fix index corruption bug', date: '2025-05-08' },
    { hash: 'x9y0z1a2', message: 'Add new JSONB functions', date: '2025-05-07' },
    { hash: 'b3c4d5e6', message: 'Optimize WAL handling', date: '2025-05-06' },
    { hash: 'f7g8h9i0', message: 'Security fix for authentication', date: '2025-05-05' }
];

function displayCommits() {
    const linuxList = document.getElementById('linuxCommits');
    linuxCommits.forEach(commit => {
        const li = document.createElement('li');
        li.textContent = `[${commit.hash}] ${commit.message} (${commit.date})`;
        linuxList.appendChild(li);
    });

    const postgresList = document.getElementById('postgresCommits');
    postgresCommits.forEach(commit => {
        const li = document.createElement('li');
        li.textContent = `[${commit.hash}] ${commit.message} (${commit.date})`;
        postgresList.appendChild(li);
    });
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

document.addEventListener('DOMContentLoaded', () => {
    loadRandomPage();
    updateVisitorCount();
    displayCommits();
    displayHackerRankNews();
});