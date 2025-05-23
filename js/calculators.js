// Kalkulatory finansowe - poprawione obliczenia matematyczne bez gigantycznych liczb

document.addEventListener('DOMContentLoaded', function () {
    console.log('Calculators.js inicjalizacja...');
    console.log('Calculators.js załadowany');
});

// Funkcje pomocnicze do walidacji i parsowania inputów
function getValidatedFloat(elementId, defaultValue, minVal, maxVal) {
    const element = document.getElementById(elementId);
    let value = defaultValue;
    if (element && element.value.trim() !== "") {
        const parsed = parseFloat(element.value);
        if (!isNaN(parsed) && isFinite(parsed)) {
            value = parsed;
        } else {
            console.warn(`Nieprawidłowa wartość dla ${elementId}: "${element.value}", używam domyślnej: ${defaultValue}`);
            if (element) element.value = defaultValue;
        }
    }
    value = Math.max(minVal, Math.min(value, maxVal));
    if (element && parseFloat(element.value) !== value && isFinite(value)) {
        if (String(element.value).trim() !== "" && !isNaN(parseFloat(element.value))) {
            // element.value = value; 
        }
    }
    return value;
}

function getValidatedInt(elementId, defaultValue, minVal, maxVal) {
    const element = document.getElementById(elementId);
    let value = defaultValue;
    if (element && element.value.trim() !== "") {
        const parsed = parseInt(element.value, 10);
        if (!isNaN(parsed) && isFinite(parsed)) {
            value = parsed;
        } else {
            console.warn(`Nieprawidłowa wartość dla ${elementId}: "${element.value}", używam domyślnej: ${defaultValue}`);
            if (element) element.value = defaultValue;
        }
    }
    value = Math.max(minVal, Math.min(value, maxVal));
    if (element && parseInt(element.value, 10) !== value && isFinite(value)) {
        if (String(element.value).trim() !== "" && !isNaN(parseInt(element.value, 10))) {
            // element.value = value;
        }
    }
    return value;
}


// KALKULATOR PROCENTU SKŁADANEGO
function calculateCompound() {
    console.log('=== OBLICZANIE PROCENTU SKŁADANEGO (główna funkcja) ===');

    try {
        const initialAmount = getValidatedFloat('initial-amount', 1000, 0, 1e12);
        const regularContribution = getValidatedFloat('monthly-contribution', 0, 0, 1e6);
        const annualRate = getValidatedFloat('interest-rate', 10, -99.99, 50);
        const years = getValidatedInt('time-period', 1, 1, 100);
        const compoundFrequency = getValidatedInt('compound-frequency', 1, 1, 365);
        const contributionFrequency = getValidatedInt('contribution-frequency', 12, 1, 12);

        console.log('Parametry wejściowe (po walidacji) dla calculateCompound:', {
            initialAmount, regularContribution, annualRate, years, compoundFrequency, contributionFrequency
        });

        const r_decimal = annualRate / 100;

        const chartData = generateCompoundChartData(initialAmount, regularContribution, r_decimal, compoundFrequency, contributionFrequency, years);

        if (!chartData || chartData.length === 0) {
            throw new Error("Nie udało się wygenerować danych dla wykresu.");
        }

        const lastChartPoint = chartData[chartData.length - 1];

        const futureValueFromChart = lastChartPoint.balance;
        const totalContributionsFromChart = lastChartPoint.initialPrincipal + lastChartPoint.regularContributions;
        const interestEarnedFromChart = lastChartPoint.interest;

        const roi = totalContributionsFromChart > 0 && isFinite(interestEarnedFromChart) && isFinite(totalContributionsFromChart)
            ? (interestEarnedFromChart / totalContributionsFromChart) * 100
            : 0;

        if (!isFinite(futureValueFromChart) || !isFinite(totalContributionsFromChart) || !isFinite(interestEarnedFromChart)) {
            console.error("Nieprawidłowe wyniki z danych wykresu (NaN/Infinity) w calculateCompound:",
                { futureValueFromChart, totalContributionsFromChart, interestEarnedFromChart });
            throw new Error('Wyniki z danych wykresu są nieprawidłowe (NaN/Infinity).');
        }
        if (Math.abs(futureValueFromChart) > 1e15) {
            console.warn("Wynik FV (z wykresu) przekracza 1E15 w calculateCompound.");
        }

        console.log('Wyniki obliczeń (na podstawie ostatniego punktu wykresu) w calculateCompound:', {
            futureValue: futureValueFromChart.toFixed(2),
            totalContributions: totalContributionsFromChart.toFixed(2),
            interestEarned: interestEarnedFromChart.toFixed(2),
            roi: roi.toFixed(2) + '%'
        });

        updateElement('final-amount', formatCurrency(futureValueFromChart));
        updateElement('total-contributions', formatCurrency(totalContributionsFromChart));
        updateElement('interest-earned', formatCurrency(interestEarnedFromChart));
        updateElement('roi-percentage', formatPercentage(roi));

        if (typeof updateCompoundChart === 'function') {
            updateCompoundChart(chartData, futureValueFromChart);
        } else {
            console.warn('updateCompoundChart nie jest dostępne w calculateCompound');
        }

        generateBreakdownTable(initialAmount, regularContribution, r_decimal, compoundFrequency, contributionFrequency, years);

        console.log('Obliczenia procentu składanego zakończone pomyślnie (wyniki z symulacji wykresu).');

    } catch (error) {
        console.error('Błąd w obliczeniach procentu składanego (główna funkcja):', error.message, error.stack);
        showCalculationError('compound', error.message);
    }
}

// KALKULATOR INWESTYCJI
function calculateInvestment() {
    console.log('=== OBLICZANIE INWESTYCJI ===');
    try {
        const initialAmount = getValidatedFloat('inv-initial', 50000, 0, 1e12);
        const monthlyAmount = getValidatedFloat('inv-monthly', 1000, 0, 1e6);
        const annualReturn = getValidatedFloat('inv-return', 8, -99.99, 50);
        const years = getValidatedInt('inv-years', 25, 1, 100);
        const inflationRate = getValidatedFloat('inflation-rate', 3, 0, 20);

        const r_inv = annualReturn / 100;
        const monthlyRateInv = r_inv / 12;
        const totalMonthsInv = years * 12;

        let nominalValueInitial = 0;
        if (initialAmount > 0) {
            const base_inv_init = 1 + monthlyRateInv;
            if (base_inv_init <= 0 && totalMonthsInv % 1 !== 0) nominalValueInitial = NaN;
            else if (base_inv_init < 0 && totalMonthsInv % 1 === 0) nominalValueInitial = initialAmount * Math.pow(base_inv_init, totalMonthsInv);
            else nominalValueInitial = initialAmount * Math.pow(Math.max(0, base_inv_init), totalMonthsInv);
        }

        let nominalValueContributions = 0;
        if (monthlyAmount > 0) {
            const base_inv_contrib = 1 + monthlyRateInv;
            if (Math.abs(monthlyRateInv) > 1e-9 && base_inv_contrib > 0) {
                const growthFactor = Math.pow(base_inv_contrib, totalMonthsInv) - 1;
                nominalValueContributions = monthlyAmount * (growthFactor / monthlyRateInv);
            } else if (base_inv_contrib <= 0 && totalMonthsInv % 1 !== 0) {
                nominalValueContributions = NaN;
            } else {
                nominalValueContributions = monthlyAmount * totalMonthsInv;
            }
        }
        const nominalValue = nominalValueInitial + nominalValueContributions;

        if (!isFinite(nominalValue)) throw new Error('Wartość nominalna jest nieprawidłowa (NaN/Infinity).');
        if (Math.abs(nominalValue) > 1e15) console.warn("Wynik FV inwestycji przekracza 1E15.");

        const inflationFactor = Math.pow(1 + inflationRate / 100, years);
        if (!isFinite(inflationFactor) || inflationFactor <= 0) throw new Error('Nieprawidłowy współczynnik inflacji.');
        const realValue = nominalValue / inflationFactor;
        if (!isFinite(realValue)) throw new Error('Wartość realna jest nieprawidłowa (NaN/Infinity).');

        const totalInvested = initialAmount + (monthlyAmount * totalMonthsInv);
        const nominalProfit = nominalValue - totalInvested;

        updateElement('inv-nominal', formatCurrency(nominalValue));
        updateElement('inv-real', formatCurrency(realValue));
        updateElement('inv-profit', formatCurrency(nominalProfit));

        const chartData = generateInvestmentChartData(initialAmount, monthlyAmount, monthlyRateInv, inflationRate / 100, years);
        if (typeof updateInvestmentChart === 'function') updateInvestmentChart(chartData);

    } catch (error) {
        console.error('Błąd w obliczeniach inwestycji:', error.message, error.stack);
        showCalculationError('investment', error.message);
    }
}

// KALKULATOR OSZCZĘDNOŚCI
function calculateSavings() {
    console.log('=== OBLICZANIE OSZCZĘDNOŚCI ===');
    try {
        const goal = getValidatedFloat('savings-goal', 100000, 1, 1e12);
        const current = getValidatedFloat('savings-current', 5000, 0, 1e12);
        const monthly = getValidatedFloat('savings-monthly', 800, 0, 1e6);
        const rate = getValidatedFloat('savings-rate', 4, 0, 30);

        if (goal <= current) {
            updateElement('savings-time', 'Cel już osiągnięty!');
            updateElement('savings-total', formatCurrency(current));
            updateElement('savings-interest', formatCurrency(0));
            if (typeof updateSavingsChart === 'function') updateSavingsChart(generateSavingsChartData(current, monthly, (rate / 100 / 12), goal));
            return;
        }

        const monthlyRate = rate / 100 / 12;
        const needed = goal - current;
        let timeToGoal;

        if (monthly <= 0 && monthlyRate <= 1e-9 && needed > 0) timeToGoal = Infinity;
        else if (monthly <= 0 && monthlyRate > 1e-9) {
            if (current <= 0 || (1 + monthlyRate) <= 0) timeToGoal = Infinity;
            else timeToGoal = Math.log(goal / current) / Math.log(1 + monthlyRate);
        } else if (Math.abs(monthlyRate) < 1e-9) timeToGoal = needed / monthly;
        else {
            const base_savings_nper = 1 + monthlyRate;
            if (base_savings_nper <= 0) timeToGoal = Infinity;
            else {
                const numerator = (goal * monthlyRate + monthly);
                const denominator = (current * monthlyRate + monthly);
                if (denominator <= 0 || numerator <= 0 || numerator / denominator <= 0) timeToGoal = Infinity;
                else timeToGoal = Math.log(numerator / denominator) / Math.log(base_savings_nper);
            }
        }

        const timeInYears = timeToGoal / 12;
        const totalContributions = current + (monthly * timeToGoal);
        const interestEarned = goal - totalContributions;

        if (!isFinite(timeToGoal) || timeToGoal > 720) updateElement('savings-time', 'Niemożliwe do osiągnięcia');
        else {
            const years_s = Math.floor(timeInYears);
            const months_s = Math.round((timeInYears % 1) * 12);
            updateElement('savings-time', `${years_s} lat ${months_s} miesięcy`);
        }
        updateElement('savings-total', isFinite(totalContributions) ? formatCurrency(totalContributions) : "N/A");
        updateElement('savings-interest', isFinite(interestEarned) ? formatCurrency(Math.max(0, interestEarned)) : "N/A");

        const chartData = generateSavingsChartData(current, monthly, monthlyRate, goal);
        if (typeof updateSavingsChart === 'function') updateSavingsChart(chartData);

    } catch (error) {
        console.error('Błąd w obliczeniach oszczędności:', error.message, error.stack);
        showCalculationError('savings', error.message);
    }
}

// KALKULATOR KREDYTU HIPOTECZNEGO
function calculateLoan() {
    console.log('=== OBLICZANIE KREDYTU HIPOTECZNEGO ===');
    try {
        const amount = getValidatedFloat('loan-amount', 300000, 1000, 1e7);
        const rate = getValidatedFloat('loan-rate', 6.5, 0.1, 30);
        const years = getValidatedInt('loan-years', 25, 1, 50);
        const type = document.getElementById('loan-type')?.value || 'equal';

        const monthlyRate = rate / 100 / 12;
        const totalMonths = years * 12;
        let monthlyPayment, totalCost, totalInterest;

        if (type === 'equal') {
            if (Math.abs(monthlyRate) > 1e-9 && (1 + monthlyRate) > 0) {
                const factor = Math.pow(1 + monthlyRate, totalMonths);
                if (!isFinite(factor)) throw new Error("Błąd współczynnika (kredyt).");
                monthlyPayment = amount * (monthlyRate * factor) / (factor - 1);
                if (!isFinite(monthlyPayment)) throw new Error("Błąd raty (kredyt).");
            } else if ((1 + monthlyRate) <= 0) throw new Error("Nieprawidłowa stopa (kredyt).");
            else monthlyPayment = amount / totalMonths;
            totalCost = monthlyPayment * totalMonths;
        } else {
            const capitalPayment = amount / totalMonths;
            let totalInterestSum = 0;
            let remainingCapital = amount;
            for (let m = 1; m <= totalMonths; m++) {
                totalInterestSum += remainingCapital * monthlyRate;
                remainingCapital -= capitalPayment;
            }
            monthlyPayment = capitalPayment + (amount * monthlyRate);
            totalCost = amount + totalInterestSum;
        }

        if (!isFinite(totalCost)) throw new Error("Błąd całkowitego kosztu (kredyt).");
        totalInterest = totalCost - amount;
        if (!isFinite(totalInterest)) throw new Error("Błąd odsetek (kredyt).");

        updateElement('loan-payment', formatCurrency(monthlyPayment));
        updateElement('loan-total', formatCurrency(totalCost));
        updateElement('loan-interest', formatCurrency(totalInterest));

        const chartData = generateLoanChartData(amount, monthlyRate, totalMonths, type);
        if (typeof updateLoanChart === 'function') updateLoanChart(chartData);
    } catch (error) {
        console.error('Błąd w obliczeniach kredytu:', error.message, error.stack);
        showCalculationError('loan', error.message);
    }
}

// KALKULATOR EMERYTURY
function calculateRetirement() {
    console.log('=== OBLICZANIE EMERYTURY ===');
    try {
        const currentAge = getValidatedInt('current-age', 30, 18, 80);
        const retirementAge = getValidatedInt('retirement-age', 65, currentAge + 1, 100);
        const currentSavings = getValidatedFloat('current-savings', 50000, 0, 1e12);
        const monthlyContribution = getValidatedFloat('monthly-retirement', 1000, 0, 1e6);
        const annualReturn = getValidatedFloat('retirement-return', 6, -99.99, 30);

        const yearsToRetirement = Math.max(0, retirementAge - currentAge);
        const monthlyRate = annualReturn / 100 / 12;
        const totalMonths = yearsToRetirement * 12;

        if (yearsToRetirement <= 0) {
            updateElement('retirement-capital', formatCurrency(currentSavings));
            updateElement('retirement-income', formatCurrency(currentSavings * 0.04 / 12));
            updateElement('years-to-retirement', 'Już na emeryturze');
            if (typeof updateRetirementChart === 'function') updateRetirementChart(generateRetirementChartData(currentSavings, monthlyContribution, monthlyRate, 0));
            return;
        }

        let retirementCapitalInitial = 0;
        if (currentSavings > 0) {
            const base_ret_init = 1 + monthlyRate;
            if (base_ret_init <= 0 && totalMonths % 1 !== 0) retirementCapitalInitial = NaN;
            else if (base_ret_init < 0 && totalMonths % 1 === 0) retirementCapitalInitial = currentSavings * Math.pow(base_ret_init, totalMonths);
            else retirementCapitalInitial = currentSavings * Math.pow(Math.max(0, base_ret_init), totalMonths);
        }

        let retirementCapitalContributions = 0;
        if (monthlyContribution > 0) {
            const base_ret_contrib = 1 + monthlyRate;
            if (Math.abs(monthlyRate) > 1e-9 && base_ret_contrib > 0) {
                const growthFactor = Math.pow(base_ret_contrib, totalMonths) - 1;
                retirementCapitalContributions = monthlyContribution * (growthFactor / monthlyRate);
            } else if (base_ret_contrib <= 0 && totalMonths % 1 !== 0) retirementCapitalContributions = NaN;
            else retirementCapitalContributions = monthlyContribution * totalMonths;
        }
        const retirementCapital = retirementCapitalInitial + retirementCapitalContributions;

        if (!isFinite(retirementCapital)) throw new Error('Kapitał emerytalny jest nieprawidłowy (NaN/Infinity).');
        if (Math.abs(retirementCapital) > 1e15) console.warn("Wynik kapitału emerytalnego przekracza 1E15.");

        const monthlyIncome = retirementCapital * 0.04 / 12;

        updateElement('retirement-capital', formatCurrency(retirementCapital));
        updateElement('retirement-income', formatCurrency(monthlyIncome));
        updateElement('years-to-retirement', `${yearsToRetirement} lat`);

        const chartData = generateRetirementChartData(currentSavings, monthlyContribution, monthlyRate, yearsToRetirement);
        if (typeof updateRetirementChart === 'function') updateRetirementChart(chartData);

    } catch (error) {
        console.error('Błąd w obliczeniach emerytury:', error.message, error.stack);
        showCalculationError('retirement', error.message);
    }
}

// KALKULATOR KREDYTU SAMOCHODOWEGO
function calculateCarLoan() {
    console.log('=== OBLICZANIE KREDYTU SAMOCHODOWEGO ===');
    try {
        const carPrice = getValidatedFloat('car-price', 80000, 1000, 1e7);
        const downPayment = getValidatedFloat('down-payment', 20000, 0, carPrice);
        const rate = getValidatedFloat('car-loan-rate', 8.5, 0.1, 30);
        const years = getValidatedInt('car-loan-years', 5, 1, 15);

        const loanAmount = carPrice - downPayment;
        const monthlyRate = rate / 100 / 12;
        const totalMonths = years * 12;

        if (loanAmount <= 0) {
            updateElement('car-monthly-payment', formatCurrency(0));
            updateElement('car-total-cost', formatCurrency(carPrice));
            updateElement('car-total-interest', formatCurrency(0));
            if (typeof updateCarLoanChart === 'function') updateCarLoanChart(generateCarLoanChartData(0, monthlyRate, totalMonths));
            return;
        }

        let monthlyPayment;
        if (Math.abs(monthlyRate) > 1e-9 && (1 + monthlyRate) > 0) {
            const factor = Math.pow(1 + monthlyRate, totalMonths);
            if (!isFinite(factor)) throw new Error("Błąd współczynnika (kredyt auto).");
            monthlyPayment = loanAmount * (monthlyRate * factor) / (factor - 1);
            if (!isFinite(monthlyPayment)) throw new Error("Błąd raty (kredyt auto).");
        } else if ((1 + monthlyRate) <= 0) throw new Error("Nieprawidłowa stopa (kredyt auto).");
        else monthlyPayment = loanAmount / totalMonths;

        const totalCost = downPayment + (monthlyPayment * totalMonths);
        const totalInterest = (monthlyPayment * totalMonths) - loanAmount;

        if (!isFinite(totalCost) || !isFinite(totalInterest)) throw new Error("Błąd kosztu/odsetek (kredyt auto).");

        updateElement('car-monthly-payment', formatCurrency(monthlyPayment));
        updateElement('car-total-cost', formatCurrency(totalCost));
        updateElement('car-total-interest', formatCurrency(totalInterest));

        const chartData = generateCarLoanChartData(loanAmount, monthlyRate, totalMonths);
        if (typeof updateCarLoanChart === 'function') updateCarLoanChart(chartData);
    } catch (error) {
        console.error('Błąd w obliczeniach kredytu samochodowego:', error.message, error.stack);
        showCalculationError('car-loan', error.message);
    }
}


// FUNKCJE GENEROWANIA DANYCH DLA WYKRESÓW - ZAKTUALIZOWANA generateCompoundChartData (v7.1)
function generateCompoundChartData(P_initial, PMT_deposit_amount, r_annual_decimal, n_compound_freq_ppy, cf_contrib_freq_ppy, t_total_years) {
    console.log('Generowanie danych wykresu procentu składanego (v7.1 - dla stacked bar)...');
    const data = [];
    const ratePerCompoundingPeriod = r_annual_decimal / n_compound_freq_ppy;

    let currentBalance = P_initial;
    let cumulativeRegularContributions = 0;
    let cumulativeInterest = 0;

    data.push({
        year: 0, month: 0,
        initialPrincipal: P_initial,
        regularContributions: 0,
        interest: 0,
        balance: P_initial
    });

    if (!isFinite(P_initial) || !isFinite(PMT_deposit_amount) || !isFinite(r_annual_decimal)) {
        console.error("Błąd w danych wejściowych do generateCompoundChartData (v7.1)");
        return data;
    }

    for (let year_idx = 1; year_idx <= t_total_years; year_idx++) {
        // POPRAWKA: Zmienna contributionsAlreadyMadeThisYearCount musi być zadeklarowana tutaj, aby była resetowana dla każdego roku
        let contributionsAlreadyMadeThisYearCount = 0;
        let interestThisYearSoFar = 0;

        for (let p_in_year = 1; p_in_year <= n_compound_freq_ppy; p_in_year++) {
            if (PMT_deposit_amount > 0 && cf_contrib_freq_ppy > 0) {
                for (let c_idx = 1; c_idx <= cf_contrib_freq_ppy; c_idx++) {
                    const compoundingPeriodWhenContributionIsDue = Math.ceil(c_idx * (n_compound_freq_ppy / cf_contrib_freq_ppy));
                    if (p_in_year === compoundingPeriodWhenContributionIsDue) {
                        if (contributionsAlreadyMadeThisYearCount < c_idx) { // Upewnij się, że ta wpłata nie została już dodana w tym roku
                            currentBalance += PMT_deposit_amount;
                            cumulativeRegularContributions += PMT_deposit_amount;
                            contributionsAlreadyMadeThisYearCount++;
                        }
                    }
                }
            }

            let interestThisCompoundingPeriod = 0;
            if (isFinite(currentBalance) && Math.abs(ratePerCompoundingPeriod) > 1e-12) {
                const baseForInterestCalc = 1 + ratePerCompoundingPeriod;
                if (baseForInterestCalc > 0) {
                    interestThisCompoundingPeriod = currentBalance * ratePerCompoundingPeriod;
                    currentBalance += interestThisCompoundingPeriod;
                    interestThisYearSoFar += interestThisCompoundingPeriod;
                } else if (baseForInterestCalc === 0) {
                    interestThisCompoundingPeriod = -currentBalance;
                    currentBalance = 0;
                    interestThisYearSoFar += interestThisCompoundingPeriod;
                } else {
                    interestThisCompoundingPeriod = currentBalance * ratePerCompoundingPeriod;
                    currentBalance += interestThisCompoundingPeriod;
                    interestThisYearSoFar += interestThisCompoundingPeriod;
                    if (!isFinite(currentBalance)) {
                        console.warn(`generateCompoundChartData: currentBalance stało się NaN/Infinity po naliczeniu odsetek z ujemną bazą. Rok ${year_idx}, Okres kap. ${p_in_year}`);
                        break;
                    }
                }
            } else if (!isFinite(currentBalance)) {
                console.warn(`generateCompoundChartData: currentBalance jest NaN/Infinity PRZED naliczeniem odsetek. Rok ${year_idx}, Okres kap. ${p_in_year}`);
                break;
            }
        }

        if (!isFinite(currentBalance)) {
            console.error(`generateCompoundChartData: Błąd krytyczny, currentBalance jest NaN/Infinity na koniec roku ${year_idx}. Przerywam dalsze generowanie danych.`);
            data.push({ year: year_idx, month: year_idx * 12, initialPrincipal: P_initial, regularContributions: cumulativeRegularContributions, interest: cumulativeInterest + interestThisYearSoFar, balance: NaN });
            break;
        }

        cumulativeInterest += interestThisYearSoFar;

        data.push({
            year: year_idx,
            month: year_idx * 12,
            initialPrincipal: P_initial,
            regularContributions: Math.min(cumulativeRegularContributions, 1e12),
            interest: Math.min(cumulativeInterest, 1e12),
            balance: Math.min(currentBalance, 1e12)
        });

        if (Math.abs(currentBalance) >= 1e12) {
            console.warn("Osiągnięto limit wartości dla danych wykresu (compound v7.1).");
            break;
        }
    }

    if (data.length > 0) {
        const lp = data[data.length - 1];
        console.log(`OSTATNI PUNKT (genCompChartData v7.1 - Rok ${lp.year}): Saldo=${isFinite(lp.balance) ? lp.balance.toFixed(0) : 'NaN'}, InitP=${isFinite(lp.initialPrincipal) ? lp.initialPrincipal.toFixed(0) : 'NaN'}, RegCont=${isFinite(lp.regularContributions) ? lp.regularContributions.toFixed(0) : 'NaN'}, Interest=${isFinite(lp.interest) ? lp.interest.toFixed(0) : 'NaN'}`);
    } else {
        console.warn("generateCompoundChartData v7.1 nie wygenerowało żadnych punktów danych poza startowym.");
    }
    return data;
}


function generateInvestmentChartData(initialAmount, monthlyAmount, monthlyRate, annualInflationRateForChart, years) {
    const data = [];
    let nominalBalance = initialAmount;
    const monthlyInflationRate = annualInflationRateForChart / 12;

    for (let month = 0; month <= years * 12; month++) {
        if (month > 0) {
            const base_inv_loop = 1 + monthlyRate;
            if (Math.abs(monthlyRate) < 0.5 && base_inv_loop > 0) {
                nominalBalance = nominalBalance * base_inv_loop + monthlyAmount;
            } else if (base_inv_loop <= 0) { nominalBalance = NaN; }
            else { nominalBalance += monthlyAmount; }

            if (!isFinite(nominalBalance) || Math.abs(nominalBalance) > 1e12) {
                nominalBalance = Math.min(nominalBalance, 1e12);
                if (isFinite(nominalBalance) && Math.abs(nominalBalance) >= 1e12) break;
                if (!isFinite(nominalBalance)) break;
            }
        }
        const realBalance = isFinite(nominalBalance) ? nominalBalance / Math.pow(1 + monthlyInflationRate, month) : NaN;
        const contributions = initialAmount + (monthlyAmount * month);
        data.push({ month, year: month / 12, nominal: nominalBalance, real: realBalance, contributions });
        if (!isFinite(nominalBalance)) break;
    }
    return data;
}

function generateSavingsChartData(current, monthly, monthlyRate, goal) {
    const data = [];
    let balance = current;
    let month = 0;
    while (balance < goal && month <= 720 && isFinite(balance)) {
        data.push({ month, year: month / 12, balance, goal });
        const base_sav_loop = 1 + monthlyRate;
        if (Math.abs(monthlyRate) < 0.5 && base_sav_loop > 0) balance = balance * base_sav_loop + monthly;
        else if (base_sav_loop <= 0) balance = NaN;
        else balance += monthly;
        month++;
        if (Math.abs(balance) > 1e12) {
            balance = Math.min(balance, 1e12);
            if (isFinite(balance) && Math.abs(balance) >= 1e12) break;
        }
        if (!isFinite(balance)) break;
    }
    data.push({ month, year: month / 12, balance: isFinite(balance) ? Math.min(balance, goal) : goal, goal });
    return data;
}

function generateLoanChartData(amount, monthlyRate, totalMonths, type) {
    const data = [];
    let remainingCapital = amount;
    for (let m = 0; m <= totalMonths; m++) {
        if (m === 0) { data.push({ month: 0, year: 0, remainingCapital: amount, capitalPayment: 0, interestPayment: 0, totalPayment: 0 }); continue; }
        let capP = 0, intP = 0, totP = 0;
        if (type === 'equal') {
            const base_loan_eq = 1 + monthlyRate;
            if (Math.abs(monthlyRate) > 1e-9 && base_loan_eq > 0) {
                const factor = Math.pow(base_loan_eq, totalMonths);
                if (!isFinite(factor)) { remainingCapital = NaN; break; }
                totP = amount * (monthlyRate * factor) / (factor - 1);
                if (!isFinite(totP)) { remainingCapital = NaN; break; }
                intP = remainingCapital * monthlyRate;
                capP = totP - intP;
            } else if (base_loan_eq <= 0) { remainingCapital = NaN; break; }
            else { capP = amount / totalMonths; totP = capP; }
        } else {
            capP = amount / totalMonths;
            intP = remainingCapital * monthlyRate;
            totP = capP + intP;
        }
        if (!isFinite(capP) || !isFinite(intP)) { remainingCapital = NaN; break; }
        remainingCapital -= capP;
        if (!isFinite(remainingCapital)) break;
        data.push({ month: m, year: m / 12, remainingCapital: Math.max(0, remainingCapital), capitalPayment: capP, interestPayment: intP, totalPayment: totP });
    }
    if (!isFinite(remainingCapital)) data.push({ month: totalMonths, year: totalMonths / 12, remainingCapital: NaN });
    return data;
}

function generateRetirementChartData(currentSavings, monthlyContribution, monthlyRate, years) {
    const data = [];
    let balance = currentSavings;
    for (let month = 0; month <= years * 12; month++) {
        if (month > 0) {
            const base_ret_loop = 1 + monthlyRate;
            if (Math.abs(monthlyRate) < 0.5 && base_ret_loop > 0) balance = balance * base_ret_loop + monthlyContribution;
            else if (base_ret_loop <= 0) balance = NaN;
            else balance += monthlyContribution;
            if (!isFinite(balance) || Math.abs(balance) > 1e12) {
                balance = Math.min(balance, 1e12);
                if (isFinite(balance) && Math.abs(balance) >= 1e12) break;
                if (!isFinite(balance)) break;
            }
        }
        const contributions = currentSavings + (monthlyContribution * month);
        const interest = balance - contributions;
        data.push({ month, year: month / 12, balance, contributions, interest: Math.max(0, isFinite(interest) ? Math.min(interest, 1e12) : NaN) });
        if (!isFinite(balance)) break;
    }
    return data;
}

function generateCarLoanChartData(amount, monthlyRate, totalMonths) {
    const data = [];
    let remainingCapital = amount;
    for (let m = 0; m <= totalMonths; m++) {
        if (m === 0) { data.push({ month: 0, year: 0, remainingCapital: amount }); continue; }
        let totP;
        const base_car_loan = 1 + monthlyRate;
        if (Math.abs(monthlyRate) > 1e-9 && base_car_loan > 0) {
            const factor = Math.pow(base_car_loan, totalMonths);
            if (!isFinite(factor)) { remainingCapital = NaN; break; }
            totP = amount * (monthlyRate * factor) / (factor - 1);
            if (!isFinite(totP)) { remainingCapital = NaN; break; }
        } else if (base_car_loan <= 0) { remainingCapital = NaN; break; }
        else { totP = amount / totalMonths; }
        const intP = remainingCapital * monthlyRate;
        const capP = totP - intP;
        if (!isFinite(capP) || !isFinite(intP)) { remainingCapital = NaN; break; }
        remainingCapital -= capP;
        if (!isFinite(remainingCapital)) break;
        data.push({ month: m, year: m / 12, remainingCapital: Math.max(0, remainingCapital) });
    }
    if (!isFinite(remainingCapital)) data.push({ month: totalMonths, year: totalMonths / 12, remainingCapital: NaN });
    return data;
}

// FUNKCJE POMOCNICZE
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        element.classList.remove('animate-countUp');
        void element.offsetWidth;
        element.classList.add('animate-countUp');
    } else {
        console.warn('Element nie znaleziony:', id);
    }
}

function formatCurrency(amount) {
    if (isNaN(amount) || !isFinite(amount)) return 'Błąd danych';
    const limitedAmount = Math.min(Math.abs(amount), 1e15);
    const sign = amount < 0 ? "-" : "";
    return sign + new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(limitedAmount));
}

function formatPercentage(percentage) {
    if (isNaN(percentage) || !isFinite(percentage)) return 'Błąd danych';
    const limitedPercentage = Math.min(Math.abs(percentage), 10000);
    const sign = percentage < 0 ? "-" : "";
    return sign + new Intl.NumberFormat('pl-PL', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(limitedPercentage / 100);
}

function generateBreakdownTable(initialAmount, regularContribution, annualRate, compoundFrequency, contributionFrequency, years) {
    const tbody = document.getElementById('breakdown-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const chartDataForTable = generateCompoundChartData(initialAmount, regularContribution, annualRate, compoundFrequency, contributionFrequency, years);
    const maxYearsInTable = Math.min(years, 15);

    for (let i = 1; i <= maxYearsInTable; i++) {
        const yearData = chartDataForTable.find(d => Math.floor(d.year) === i);
        if (!yearData || !isFinite(yearData.balance) || !isFinite(yearData.initialPrincipal) || !isFinite(yearData.regularContributions) || !isFinite(yearData.interest)) continue;

        const prevYearData = chartDataForTable.find(d => Math.floor(d.year) === (i - 1)) || chartDataForTable[0];
        if (!isFinite(prevYearData.balance) || !isFinite(prevYearData.initialPrincipal) || !isFinite(prevYearData.regularContributions) || !isFinite(prevYearData.interest)) continue;

        const yearlyRegularContributions = yearData.regularContributions - prevYearData.regularContributions;
        const yearlyInterest = yearData.interest - prevYearData.interest;

        if (!isFinite(yearlyRegularContributions) || !isFinite(yearlyInterest)) continue;

        const row = tbody.insertRow();
        row.innerHTML = `<td>Rok ${i}</td><td>${formatCurrency(yearlyRegularContributions)}</td><td>${formatCurrency(yearlyInterest)}</td><td>${formatCurrency(yearData.balance)}</td>`;
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        setTimeout(((r) => () => { r.style.transition = 'all 0.3s ease'; r.style.opacity = '1'; r.style.transform = 'translateY(0)'; })(row), i * 50);
    }
    if (years > maxYearsInTable) {
        const row = tbody.insertRow();
        row.innerHTML = `<td colspan="4" style="text-align: center; font-style: italic; color: #64748b;">... i ${years - maxYearsInTable} kolejnych lat</td>`;
    }
}

function showCalculationError(calculatorType, errorMessage) {
    console.error('Błąd kalkulatora', calculatorType + ':', errorMessage);
    const resultElements = document.querySelectorAll(`#${calculatorType} .result-value`);
    resultElements.forEach(element => {
        element.textContent = 'Błąd';
        element.style.color = '#ef4444';
        element.title = errorMessage;
    });
    showToast(`Błąd w obliczeniach: ${errorMessage}`, 'error');
}

function showToast(message, type) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; border-radius: 8px; color: white; font-weight: 500; z-index: 10001; transform: translateX(120%); opacity: 0; transition: transform 0.4s ease, opacity 0.4s ease; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px; word-wrap: break-word; background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#06b6d4'};`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.transform = 'translateX(0)'; toast.style.opacity = '1'; }, 100);
    setTimeout(() => { toast.style.transform = 'translateX(120%)'; toast.style.opacity = '0'; setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 400); }, 4000);
}

window.calculateCompound = calculateCompound;
window.calculateInvestment = calculateInvestment;
window.calculateSavings = calculateSavings;
window.calculateLoan = calculateLoan;
window.calculateRetirement = calculateRetirement;
window.calculateCarLoan = calculateCarLoan;

console.log('Calculators.js załadowany (v7.1 dla generateCompoundChartData) - wszystkie funkcje kalkulatorów dostępne globalnie');
