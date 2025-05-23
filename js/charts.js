// Wykresy finansowe - Chart.js z lepszą obsługą ładowania i formatowaniem

// Sprawdzenie dostępności Chart.js z retry mechanism
let isChartJSAvailable = false;
let chartJSCheckAttempts = 0;
const maxChartJSCheckAttempts = 10;

document.addEventListener('DOMContentLoaded', function () {
    console.log('Charts.js inicjalizacja...');
    checkChartJSAvailability();
});

// Funkcja sprawdzania dostępności Chart.js z ponawianiem
function checkChartJSAvailability() {
    chartJSCheckAttempts++;
    // console.log('Sprawdzanie Chart.js, próba:', chartJSCheckAttempts); 

    if (typeof Chart !== 'undefined') {
        isChartJSAvailable = true;
        console.log('Chart.js dostępne - konfiguracja...');
        configureChartJS();
        return true;
    } else if (chartJSCheckAttempts < maxChartJSCheckAttempts) {
        setTimeout(checkChartJSAvailability, 500);
        return false;
    } else {
        console.error('Chart.js nie zostało załadowane po', maxChartJSCheckAttempts, 'próbach');
        isChartJSAvailable = false;
        const chartContainers = document.querySelectorAll('.chart-container');
        chartContainers.forEach(container => {
            if (!container.querySelector('canvas')) return;
            const canvasId = container.querySelector('canvas').id;
            if (canvasId) {
                showChartError(canvasId, 'Krytyczny błąd: Biblioteka wykresów (Chart.js) nie mogła zostać załadowana. Odśwież stronę lub spróbuj później.');
            }
        });
        return false;
    }
}

// Konfiguracja Chart.js
function configureChartJS() {
    try {
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            Chart.defaults.font.size = 12;
            Chart.defaults.color = '#64748b';
            Chart.defaults.borderColor = '#e2e8f0';
            Chart.defaults.plugins.legend.labels.usePointStyle = true;
            Chart.defaults.plugins.tooltip.cornerRadius = 8;
            Chart.defaults.elements.line.tension = 0.4;
            Chart.defaults.elements.point.radius = 3;
            Chart.defaults.elements.point.hoverRadius = 5;
            console.log('Chart.js skonfigurowany pomyślnie');
        }
    } catch (error) {
        console.error('Błąd konfiguracji Chart.js:', error);
    }
}

// Kolory dla wykresów
const chartColors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primaryLight: '#60a5fa',
    secondary: '#64748b',
    success: '#10b981',
    successLight: '#34d399',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    light: '#f1f5f9',
    dark: '#1e293b',
    white: '#ffffff',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray500: '#6b7280',
    stackedInitial: '#0ea5e9', // Sky 500 (Kapitał początkowy)
    stackedContributions: '#22c55e', // Green 500 (Dopłaty regularne)
    stackedInterest: '#f97316'  // Orange 500 (Odsetki)
};
if (typeof Chart !== 'undefined') Chart.defaults.borderColor = chartColors.gray200;


// Zmienne globalne dla wykresów
let compoundChart = null;
let investmentChart = null;
let savingsChart = null;
let loanChart = null;
let retirementChart = null;
let carLoanChart = null;

function ensureChartJS() {
    if (!isChartJSAvailable) {
        return checkChartJSAvailability();
    }
    return true;
}

function formatAxisValue(value) {
    if (isNaN(value) || !isFinite(value)) return '0';
    const absValue = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absValue >= 1e9) return sign + (absValue / 1e9).toFixed(1).replace('.0', '') + 'mld';
    if (absValue >= 1e6) return sign + (absValue / 1e6).toFixed(1).replace('.0', '') + 'mln';
    if (absValue >= 1e3) return sign + (absValue / 1e3).toFixed(0) + 'k';
    return sign + Math.round(absValue).toLocaleString('pl-PL');
}

function filterDataForFullYears(data) {
    if (!data || data.length === 0) return [];
    const yearlyData = [];
    if (data[0]) yearlyData.push(data[0]);

    let lastPushedYear = data[0] ? Math.floor(data[0].year) : -1;

    for (let i = 1; i < data.length; i++) {
        const item = data[i];
        if (!item || typeof item.year === 'undefined') continue;
        const currentItemYear = Math.floor(item.year);
        if (currentItemYear > lastPushedYear) {
            yearlyData.push(item);
            lastPushedYear = currentItemYear;
        }
    }
    if (data.length > 1 && yearlyData.length > 0) {
        const lastOriginalItem = data[data.length - 1];
        const lastPushedItem = yearlyData[yearlyData.length - 1];
        if (lastOriginalItem.year !== lastPushedItem.year && Math.floor(lastOriginalItem.year) > Math.floor(lastPushedItem.year)) {
            yearlyData.push(lastOriginalItem);
        }
    }
    return yearlyData;
}

// WYKRES PROCENTU SKŁADANEGO - ZAKTUALIZOWANY DLA STACKED BAR
function updateCompoundChart(data, summaryFutureValue) {
    console.log('=== AKTUALIZACJA WYKRESU PROCENTU SKŁADANEGO (v_charts_final) ===');

    if (!ensureChartJS()) {
        setTimeout(() => updateCompoundChart(data, summaryFutureValue), 1000);
        return;
    }

    const ctx = document.getElementById('compound-chart');
    if (!ctx) {
        console.warn('Canvas compound-chart nie został znaleziony');
        return;
    }

    if (!data || data.length === 0 || !data.every(d =>
        d && typeof d.year === 'number' &&
        typeof d.initialPrincipal === 'number' &&
        typeof d.regularContributions === 'number' &&
        typeof d.interest === 'number' &&
        typeof d.balance === 'number'
    )) {
        showChartError('compound-chart', 'Brak lub niekompletne dane do wyświetlenia.');
        console.error("Niekompletne dane dla updateCompoundChart:", data);
        return;
    }

    const filteredData = data.filter(d =>
        isFinite(d.initialPrincipal) &&
        isFinite(d.regularContributions) &&
        isFinite(d.interest) &&
        isFinite(d.balance)
    );

    if (filteredData.length === 0) {
        showChartError('compound-chart', 'Brak poprawnych danych po filtrowaniu.');
        return;
    }

    if (compoundChart) {
        try { compoundChart.destroy(); } catch (e) { console.warn('Błąd niszczenia wykresu compound:', e); }
        compoundChart = null;
    }

    try {
        const chartTypeRadio = document.querySelector('input[name="chart-type"]:checked');
        const chartType = chartTypeRadio ? chartTypeRadio.value : 'line';

        const years = filteredData.map(d => Math.floor(d.year));
        const initialPrincipals = filteredData.map(d => Math.round(d.initialPrincipal));
        const regularContributionsData = filteredData.map(d => Math.round(d.regularContributions));
        const interestData = filteredData.map(d => Math.round(d.interest));
        const totalBalances = filteredData.map(d => Math.round(d.balance));

        if (summaryFutureValue !== undefined && totalBalances.length > 0) {
            const lastChartBalance = totalBalances[totalBalances.length - 1];
            if (Math.abs(lastChartBalance - summaryFutureValue) > Math.max(1, Math.abs(summaryFutureValue) * 0.005)) {
                console.warn(`Niezgodność (Compound)! Ostatnie saldo wykresu: ${lastChartBalance}, Obliczone FV z podsumowania: ${summaryFutureValue.toFixed(0)}`);
            }
        }

        let datasetsConfig;
        const scalesConfig = {
            x: {
                type: 'category',
                stacked: chartType === 'bar',
                grid: { drawBorder: false },
                ticks: { color: chartColors.gray500, font: { size: 11 } }
            },
            y: {
                type: 'linear',
                stacked: chartType === 'bar',
                min: 0,
                grid: { drawBorder: false },
                ticks: {
                    color: chartColors.gray500, font: { size: 11 },
                    callback: function (value) { return formatAxisValue(value); },
                    maxTicksLimit: 8, precision: 0, beginAtZero: true
                }
            }
        };

        if (chartType === 'bar') {
            datasetsConfig = [
                {
                    label: 'Kapitał początkowy', data: initialPrincipals,
                    backgroundColor: chartColors.stackedInitial,
                    borderColor: chartColors.white, borderWidth: 1,
                    stack: 'finances' // Grupa dla skumulowania
                },
                {
                    label: 'Dopłaty regularne', data: regularContributionsData,
                    backgroundColor: chartColors.stackedContributions,
                    borderColor: chartColors.white, borderWidth: 1,
                    stack: 'finances' // Ta sama grupa
                },
                {
                    label: 'Odsetki', data: interestData,
                    backgroundColor: chartColors.stackedInterest,
                    borderColor: chartColors.white, borderWidth: 1,
                    stack: 'finances' // Ta sama grupa
                }
            ];
            // Upewnij się, że totalBalances nie zawiera NaN przed użyciem Math.max
            const validTotalBalances = totalBalances.filter(isFinite);
            const maxStackedValue = validTotalBalances.length > 0 ? Math.max(0, ...validTotalBalances) : 0;
            scalesConfig.y.max = Math.ceil(Math.min(maxStackedValue * 1.1 || 100, 1.5e12));
        } else {
            datasetsConfig = [
                {
                    label: 'Łączna wartość', data: totalBalances,
                    borderColor: chartColors.primary, backgroundColor: chartColors.primary + '30',
                    fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5
                },
                {
                    label: 'Suma wpłat (Pocz. + Reg.)',
                    data: filteredData.map(d => Math.round(d.initialPrincipal + d.regularContributions)),
                    borderColor: chartColors.success, backgroundColor: chartColors.success + '20',
                    fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointHoverRadius: 5, borderDash: [5, 3]
                }
                // Opcjonalna seria dla odsetek w wykresie liniowym:
                // {
                // label: 'Odsetki (skumulowane)', data: interestData,
                // borderColor: chartColors.warning, backgroundColor: chartColors.warning + '20',
                // fill: false, tension: 0.4, borderWidth: 2
                // }
            ];
            const validTotalBalancesLine = totalBalances.filter(isFinite);
            const maxLineValue = validTotalBalancesLine.length > 0 ? Math.max(0, ...validTotalBalancesLine) : 0;
            scalesConfig.y.max = Math.ceil(Math.min(maxLineValue * 1.1 || 100, 1.5e12));
        }

        const config = {
            type: chartType,
            data: {
                labels: years.map(y => y === 0 ? 'Start' : `Rok ${y}`),
                datasets: datasetsConfig
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: { display: true, text: 'Wzrost kapitału w czasie', font: { size: 16, weight: 'bold' }, color: chartColors.dark, padding: { top: 10, bottom: 20 } },
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, boxWidth: 15, font: { size: 11 } } },
                    tooltip: {
                        backgroundColor: chartColors.dark, titleColor: chartColors.white, bodyColor: chartColors.white,
                        borderColor: chartColors.primaryLight, borderWidth: 1,
                        cornerRadius: 6, displayColors: true, padding: 10,
                        itemSort: function (a, b) {
                            return chartType === 'bar' ? b.datasetIndex - a.datasetIndex : a.datasetIndex - b.datasetIndex;
                        },
                        callbacks: {
                            label: function (context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${formatCurrency(value)}`;
                            },
                            footer: function (tooltipItems) {
                                if (chartType === 'bar' && tooltipItems.length > 0) {
                                    // Suma dla tooltipa jest już zawarta w 'totalBalances' dla danego indeksu
                                    const dataIndex = tooltipItems[0].dataIndex;
                                    if (dataIndex < totalBalances.length) {
                                        const totalForYear = totalBalances[dataIndex];
                                        return `Całkowite saldo: ${formatCurrency(totalForYear)}`;
                                    }
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: scalesConfig
            }
        };

        compoundChart = new Chart(ctx, config);

    } catch (error) {
        console.error(`Błąd tworzenia wykresu procentu składanego (${chartType}):`, error.message, error.stack);
        showChartError('compound-chart', 'Błąd tworzenia wykresu: ' + error.message);
    }
}

function updateInvestmentChart(data) {
    if (!ensureChartJS()) { setTimeout(() => updateInvestmentChart(data), 1000); return; }
    const ctx = document.getElementById('investment-chart');
    if (!ctx || !data || data.length === 0 || !data.every(d => d && typeof d.year === 'number' && isFinite(d.nominal))) {
        showChartError('investment-chart', 'Brak lub niekompletne dane dla wykresu inwestycji.'); return;
    }
    if (investmentChart) { try { investmentChart.destroy(); } catch (e) { console.warn(e); } investmentChart = null; }

    try {
        const filteredData = filterDataForFullYears(data.filter(d => isFinite(d.nominal) && isFinite(d.real) && isFinite(d.contributions)));
        if (filteredData.length === 0) { showChartError('investment-chart', 'Brak poprawnych danych po filtrowaniu (inwestycje).'); return; }

        const years = filteredData.map(d => Math.floor(d.year));
        const nominal = filteredData.map(d => Math.round(d.nominal));
        const real = filteredData.map(d => Math.round(d.real));
        const contributions = filteredData.map(d => Math.round(d.contributions));

        const maxValue = Math.max(0, ...nominal.filter(isFinite), ...real.filter(isFinite), ...contributions.filter(isFinite));
        const yAxisMax = Math.ceil(Math.min(maxValue * 1.1 || 100, 1.5e12));

        investmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => y === 0 ? 'Start' : `Rok ${y}`),
                datasets: [
                    { label: 'Wartość nominalna', data: nominal, borderColor: chartColors.primary, backgroundColor: chartColors.primary + '30', fill: true, tension: 0.4, borderWidth: 2 },
                    { label: 'Wartość realna', data: real, borderColor: chartColors.info, backgroundColor: chartColors.info + '20', fill: true, tension: 0.4, borderDash: [5, 5], borderWidth: 2 },
                    { label: 'Wpłaty', data: contributions, borderColor: chartColors.success, backgroundColor: chartColors.success + '20', fill: false, tension: 0.4, borderWidth: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: { display: true, text: 'Wzrost inwestycji (nominalna vs realna)', font: { size: 16, weight: 'bold' }, color: chartColors.dark, padding: { top: 10, bottom: 20 } },
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, boxWidth: 15, font: { size: 11 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${formatCurrency(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { grid: { drawBorder: false }, ticks: { color: chartColors.gray500 } },
                    y: { min: 0, max: yAxisMax, grid: { drawBorder: false }, ticks: { callback: val => formatAxisValue(val), color: chartColors.gray500, maxTicksLimit: 8 } }
                }
            }
        });
    } catch (error) { console.error('Błąd tworzenia wykresu inwestycji:', error.stack); showChartError('investment-chart', 'Błąd tworzenia wykresu.'); }
}

function updateSavingsChart(data) {
    if (!ensureChartJS()) { setTimeout(() => updateSavingsChart(data), 1000); return; }
    const ctx = document.getElementById('savings-chart');
    if (!ctx || !data || data.length === 0 || !data.every(d => d && typeof d.year === 'number' && isFinite(d.balance) && isFinite(d.goal))) {
        showChartError('savings-chart', 'Brak lub niekompletne dane dla wykresu oszczędności.'); return;
    }
    if (savingsChart) { try { savingsChart.destroy(); } catch (e) { console.warn(e); } savingsChart = null; }

    try {
        const filteredData = data.filter((d, index) => (index % Math.max(1, Math.floor(data.length / 20)) === 0 || index === data.length - 1) && isFinite(d.balance) && isFinite(d.goal));
        if (filteredData.length === 0) { showChartError('savings-chart', 'Brak poprawnych danych po filtrowaniu (oszczędności).'); return; }

        const labels = filteredData.map(d => d.year.toFixed(1) === '0.0' ? 'Start' : `${d.year.toFixed(1)} lat`);
        const balances = filteredData.map(d => Math.round(d.balance));
        const goals = filteredData.map(d => Math.round(d.goal));

        const maxValue = Math.max(0, ...balances.filter(isFinite), ...goals.filter(isFinite));
        const yAxisMax = Math.ceil(Math.min(maxValue * 1.1 || 100, 1.5e12));

        savingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Oszczędności', data: balances, borderColor: chartColors.success, backgroundColor: chartColors.success + '30', fill: 'origin', tension: 0.4, borderWidth: 2.5 },
                    { label: 'Cel', data: goals, borderColor: chartColors.danger, backgroundColor: 'transparent', borderDash: [10, 5], fill: false, pointRadius: 0, borderWidth: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: { display: true, text: 'Postęp w oszczędzaniu do celu', font: { size: 16, weight: 'bold' }, color: chartColors.dark, padding: { top: 10, bottom: 20 } },
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, boxWidth: 15, font: { size: 11 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${formatCurrency(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { grid: { drawBorder: false }, ticks: { color: chartColors.gray500 } },
                    y: { min: 0, max: yAxisMax, grid: { drawBorder: false }, ticks: { callback: val => formatAxisValue(val), color: chartColors.gray500, maxTicksLimit: 8 } }
                }
            }
        });
    } catch (error) { console.error('Błąd tworzenia wykresu oszczędności:', error.stack); showChartError('savings-chart', 'Błąd tworzenia wykresu.'); }
}

function updateLoanChart(data) {
    if (!ensureChartJS()) { setTimeout(() => updateLoanChart(data), 1000); return; }
    const ctx = document.getElementById('loan-chart');
    if (!ctx || !data || data.length === 0 || !data.every(d => d && typeof d.year === 'number' && isFinite(d.remainingCapital))) {
        showChartError('loan-chart', 'Brak lub niekompletne dane dla wykresu kredytu.'); return;
    }
    if (loanChart) { try { loanChart.destroy(); } catch (e) { console.warn(e); } loanChart = null; }

    try {
        const filteredData = filterDataForFullYears(data.filter(d => isFinite(d.remainingCapital)));
        if (filteredData.length === 0) { showChartError('loan-chart', 'Brak poprawnych danych po filtrowaniu (kredyt).'); return; }

        const years = filteredData.map(d => Math.floor(d.year));
        const remaining = filteredData.map(d => Math.round(d.remainingCapital));

        const maxValue = Math.max(0, ...remaining.filter(isFinite));
        const yAxisMax = Math.ceil(Math.min(maxValue * 1.1 || 100, 1.5e12));

        loanChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => y === 0 ? 'Start' : `Rok ${y}`),
                datasets: [
                    { label: 'Pozostały kapitał', data: remaining, borderColor: chartColors.danger, backgroundColor: chartColors.danger + '30', fill: 'origin', tension: 0.4, borderWidth: 2.5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: { display: true, text: 'Spłata kredytu w czasie', font: { size: 16, weight: 'bold' }, color: chartColors.dark, padding: { top: 10, bottom: 20 } },
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, boxWidth: 15, font: { size: 11 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${formatCurrency(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { grid: { drawBorder: false }, ticks: { color: chartColors.gray500 } },
                    y: { min: 0, max: yAxisMax, grid: { drawBorder: false }, ticks: { callback: val => formatAxisValue(val), color: chartColors.gray500, maxTicksLimit: 8 } }
                }
            }
        });
    } catch (error) { console.error('Błąd tworzenia wykresu kredytu:', error.stack); showChartError('loan-chart', 'Błąd tworzenia wykresu.'); }
}

function updateRetirementChart(data) {
    if (!ensureChartJS()) { setTimeout(() => updateRetirementChart(data), 1000); return; }
    const ctx = document.getElementById('retirement-chart');
    if (!ctx || !data || data.length === 0 || !data.every(d => d && typeof d.year === 'number' && isFinite(d.balance))) {
        showChartError('retirement-chart', 'Brak lub niekompletne dane dla wykresu emerytury.'); return;
    }
    if (retirementChart) { try { retirementChart.destroy(); } catch (e) { console.warn(e); } retirementChart = null; }

    try {
        const filteredData = filterDataForFullYears(data.filter(d => isFinite(d.balance) && isFinite(d.contributions) && isFinite(d.interest)));
        if (filteredData.length === 0) { showChartError('retirement-chart', 'Brak poprawnych danych po filtrowaniu (emerytura).'); return; }

        const years = filteredData.map(d => Math.floor(d.year));
        const balances = filteredData.map(d => Math.round(d.balance));
        const contributions = filteredData.map(d => Math.round(d.contributions));
        const interests = filteredData.map(d => Math.round(d.interest));

        const maxValue = Math.max(0, ...balances.filter(isFinite), ...contributions.filter(isFinite), ...interests.filter(isFinite));
        const yAxisMax = Math.ceil(Math.min(maxValue * 1.1 || 100, 1.5e12));

        retirementChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => y === 0 ? 'Start' : `Rok ${y}`),
                datasets: [
                    { label: 'Kapitał emerytalny', data: balances, borderColor: chartColors.primary, backgroundColor: chartColors.primary + '30', fill: 'origin', tension: 0.4, borderWidth: 2.5 },
                    { label: 'Wpłaty', data: contributions, borderColor: chartColors.success, backgroundColor: chartColors.success + '20', fill: 'origin', tension: 0.4, borderWidth: 2, borderDash: [5, 3] },
                    { label: 'Odsetki', data: interests, borderColor: chartColors.warning, backgroundColor: chartColors.warning + '20', fill: false, tension: 0.4, borderWidth: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: { display: true, text: 'Wzrost kapitału emerytalnego', font: { size: 16, weight: 'bold' }, color: chartColors.dark, padding: { top: 10, bottom: 20 } },
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, boxWidth: 15, font: { size: 11 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${formatCurrency(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { grid: { drawBorder: false }, ticks: { color: chartColors.gray500 } },
                    y: { min: 0, max: yAxisMax, grid: { drawBorder: false }, ticks: { callback: val => formatAxisValue(val), color: chartColors.gray500, maxTicksLimit: 8 } }
                }
            }
        });
    } catch (error) { console.error('Błąd tworzenia wykresu emerytury:', error.stack); showChartError('retirement-chart', 'Błąd tworzenia wykresu.'); }
}

function updateCarLoanChart(data) {
    if (!ensureChartJS()) { setTimeout(() => updateCarLoanChart(data), 1000); return; }
    const ctx = document.getElementById('car-loan-chart');
    if (!ctx || !data || data.length === 0 || !data.every(d => d && typeof d.year === 'number' && isFinite(d.remainingCapital))) {
        showChartError('car-loan-chart', 'Brak lub niekompletne dane dla wykresu kredytu samochodowego.'); return;
    }
    if (carLoanChart) { try { carLoanChart.destroy(); } catch (e) { console.warn(e); } carLoanChart = null; }

    try {
        const filteredData = filterDataForFullYears(data.filter(d => isFinite(d.remainingCapital)));
        if (filteredData.length === 0) { showChartError('car-loan-chart', 'Brak poprawnych danych po filtrowaniu (kredyt auto).'); return; }

        const years = filteredData.map(d => Math.floor(d.year));
        const remaining = filteredData.map(d => Math.round(d.remainingCapital));

        const maxValue = Math.max(0, ...remaining.filter(isFinite));
        const yAxisMax = Math.ceil(Math.min(maxValue * 1.1 || 100, 1.5e12));

        carLoanChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years.map(y => y === 0 ? 'Start' : `Rok ${y}`),
                datasets: [
                    { label: 'Pozostały dług', data: remaining, borderColor: chartColors.danger, backgroundColor: chartColors.danger + '30', fill: 'origin', tension: 0.4, borderWidth: 2.5 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
                plugins: {
                    title: { display: true, text: 'Spłata kredytu samochodowego', font: { size: 16, weight: 'bold' }, color: chartColors.dark, padding: { top: 10, bottom: 20 } },
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, boxWidth: 15, font: { size: 11 } } },
                    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label || ''}: ${formatCurrency(ctx.parsed.y)}` } }
                },
                scales: {
                    x: { grid: { drawBorder: false }, ticks: { color: chartColors.gray500 } },
                    y: { min: 0, max: yAxisMax, grid: { drawBorder: false }, ticks: { callback: val => formatAxisValue(val), color: chartColors.gray500, maxTicksLimit: 8 } }
                }
            }
        });
    } catch (error) { console.error('Błąd tworzenia wykresu kredytu samochodowego:', error.stack); showChartError('car-loan-chart', 'Błąd tworzenia wykresu.'); }
}

// Formatowanie waluty (z calculators.js)
function formatCurrency(amount) {
    if (isNaN(amount) || !isFinite(amount)) return 'Błąd';
    const limitedAmount = Math.min(Math.abs(amount), 1e15);
    const sign = amount < 0 ? "-" : "";
    return sign + new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(limitedAmount));
}

// Wyświetlanie błędu wykresu
function showChartError(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        const container = canvas.parentElement;
        if (container.querySelector('.chart-error')) return;

        container.innerHTML = `<div class="chart-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <small>Sprawdź konsolę przeglądarki lub spróbuj ponownie.</small>
            </div>`;

        const errorDiv = container.querySelector('.chart-error');
        if (errorDiv) {
            errorDiv.style.cssText = `display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 250px; color: ${chartColors.danger}; text-align: center; padding: 1rem; border: 1px dashed ${chartColors.danger}; border-radius: 8px; background-color: ${chartColors.danger + '10'};`;
            errorDiv.querySelector('i').style.cssText = 'font-size: 2.5rem; margin-bottom: 0.8rem; opacity: 0.7;';
            errorDiv.querySelector('p').style.cssText = 'font-size: 1rem; margin-bottom: 0.5rem; font-weight: 500;';
            errorDiv.querySelector('small').style.cssText = 'opacity: 0.7; font-size: 0.8rem;';
        }
    } else {
        console.warn(`Nie znaleziono canvas o ID: ${canvasId} do wyświetlenia błędu.`);
    }
}

function destroyAllCharts() {
    const chartRefs = [compoundChart, investmentChart, savingsChart, loanChart, retirementChart, carLoanChart];
    chartRefs.forEach((chart, index) => {
        if (chart) {
            try { chart.destroy(); } catch (e) { /* console.warn(`Błąd niszczenia wykresu ${index}:`, e); */ }
        }
    });
    compoundChart = investmentChart = savingsChart = loanChart = retirementChart = carLoanChart = null;
}

window.updateCompoundChart = updateCompoundChart;
window.updateInvestmentChart = updateInvestmentChart;
window.updateSavingsChart = updateSavingsChart;
window.updateLoanChart = updateLoanChart;
window.updateRetirementChart = updateRetirementChart;
window.updateCarLoanChart = updateCarLoanChart;
window.destroyAllCharts = destroyAllCharts;
window.ensureChartJS = ensureChartJS;

console.log('Charts.js załadowany (finalna wersja dla stacked bar) - wszystkie funkcje wykresów dostępne globalnie.');

