document.addEventListener('DOMContentLoaded', () => {

    // --- DATA ---
    // Source: INDEC IPC Nacional GBA. Values are percentage monthly inflation.
    // NOTE: This is a sample dataset. For a production app, this should be fetched from an API.
    const inflationData = {
        "201701": 1.6, "201702": 2.4, "201703": 2.3, "201704": 2.7, "201705": 1.4, "201706": 1.2, "201707": 1.7, "201708": 1.4, "201709": 1.9, "201710": 1.5, "201711": 1.4, "201712": 3.1,
        "201801": 1.8, "201802": 2.4, "201803": 2.3, "201804": 2.7, "201805": 2.1, "201806": 3.7, "201807": 3.1, "201808": 3.9, "201809": 6.5, "201810": 5.4, "201811": 3.2, "201812": 2.6,
        "201901": 2.9, "201902": 3.8, "201903": 4.7, "201904": 3.4, "201905": 3.1, "201906": 2.7, "201907": 2.2, "201908": 4.0, "201909": 5.9, "201910": 3.3, "201911": 4.3, "201912": 3.7,
        "202001": 2.3, "202002": 2.0, "202003": 3.3, "202004": 1.5, "202005": 1.5, "202006": 2.2, "202007": 1.9, "202008": 2.7, "202009": 2.8, "202010": 3.8, "202011": 3.2, "202012": 4.0,
        "202101": 4.0, "202102": 3.6, "202103": 4.8, "202104": 4.1, "202105": 3.3, "202106": 3.2, "202107": 3.0, "202108": 2.5, "202109": 3.5, "202110": 3.5, "202111": 2.5, "202112": 3.8,
        "202201": 3.9, "202202": 4.7, "202203": 6.7, "202204": 6.0, "202205": 5.1, "202206": 5.3, "202207": 7.4, "202208": 7.0, "202209": 6.2, "202210": 6.3, "202211": 4.9, "202212": 5.1,
        "202301": 6.0, "202302": 6.6, "202303": 7.7, "202304": 8.4, "202305": 7.8, "202306": 6.0, "202307": 6.3, "202308": 12.4, "202309": 12.7, "202310": 8.3, "202311": 12.8, "202312": 25.5,
        "202401": 20.6, "202402": 13.2, "202403": 11.0, "202404": 8.8, "202405": 4.2, "202406": 4.6, // Sample data for recent months
    };

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // --- DOM ELEMENTS ---
    const amountInput = document.getElementById('amount');
    const fromMonthSelect = document.getElementById('from-month');
    const fromYearSelect = document.getElementById('from-year');
    const toMonthSelect = document.getElementById('to-month');
    const toYearSelect = document.getElementById('to-year');
    const finalAmountDisplay = document.getElementById('final-amount');
    const cumulativeInflationDisplay = document.getElementById('cumulative-inflation');
    const monthlyAverageDisplay = document.getElementById('monthly-average');
    const annualAverageDisplay = document.getElementById('annual-average');
    const errorMessage = document.getElementById('error-message');

    // --- INITIALIZATION ---
    function setup() {
        const availableYears = [...new Set(Object.keys(inflationData).map(key => key.substring(0, 4)))].sort();

        // Populate year dropdowns
        populateSelect(fromYearSelect, availableYears);
        populateSelect(toYearSelect, availableYears);

        // Populate month dropdowns
        populateSelect(fromMonthSelect, months.map((m, i) => ({ value: i + 1, text: m })));
        populateSelect(toMonthSelect, months.map((m, i) => ({ value: i + 1, text: m })));
        
        // Set default dates
        fromYearSelect.value = "2023";
        fromMonthSelect.value = "1"; // January
        const lastYear = availableYears[availableYears.length - 1];
        const lastMonth = Math.max(...Object.keys(inflationData).filter(k => k.startsWith(lastYear)).map(k => parseInt(k.substring(4, 6))));
        toYearSelect.value = lastYear;
        toMonthSelect.value = lastMonth;

        // Add event listeners
        [amountInput, fromMonthSelect, fromYearSelect, toMonthSelect, toYearSelect].forEach(el => {
            el.addEventListener('change', calculate);
        });
        amountInput.addEventListener('keyup', calculate);

        // Initial calculation
        calculate();
    }

    function populateSelect(selectElement, options) {
        options.forEach(option => {
            const opt = document.createElement('option');
            if (typeof option === 'object') {
                opt.value = option.value;
                opt.textContent = option.text;
            } else {
                opt.value = option;
                opt.textContent = option;
            }
            selectElement.appendChild(opt);
        });
    }

    // --- CALCULATION LOGIC ---
    function calculate() {
        const initialAmount = parseFloat(amountInput.value) || 0;
        const fromYear = fromYearSelect.value;
        const fromMonth = String(fromMonthSelect.value).padStart(2, '0');
        const toYear = toYearSelect.value;
        const toMonth = String(toMonthSelect.value).padStart(2, '0');

        const startDateKey = `${fromYear}${fromMonth}`;
        const endDateKey = `${toYear}${toMonth}`;

        // Validation
        if (parseInt(startDateKey) > parseInt(endDateKey)) {
            errorMessage.classList.remove('hidden');
            clearResults();
            return;
        }
        errorMessage.classList.add('hidden');

        let currentValue = initialAmount;
        let monthsCount = 0;
        
        const sortedKeys = Object.keys(inflationData).sort();

        for (const key of sortedKeys) {
            if (key >= startDateKey && key <= endDateKey) {
                const monthlyRate = inflationData[key] / 100;
                currentValue *= (1 + monthlyRate);
                monthsCount++;
            }
        }
        
        if (monthsCount === 0) {
            // If the period is within the same month, no full month of inflation has passed.
            // Result is the same as the initial amount.
            updateDisplay(initialAmount, 0, 0, 0);
            return;
        }

        const cumulativeInflation = (currentValue / initialAmount) - 1;
        const monthlyAverage = (Math.pow(currentValue / initialAmount, 1 / monthsCount) - 1);
        const annualAverage = (Math.pow(1 + monthlyAverage, 12) - 1);

        updateDisplay(currentValue, cumulativeInflation, monthlyAverage, annualAverage);
    }

    // --- UI UPDATE ---
    function updateDisplay(finalAmount, cumulative, monthly, annual) {
        const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
        finalAmountDisplay.textContent = formatter.format(finalAmount);
        
        cumulativeInflationDisplay.textContent = `${(cumulative * 100).toFixed(2)}%`;
        monthlyAverageDisplay.textContent = `${(monthly * 100).toFixed(2)}%`;
        annualAverageDisplay.textContent = `${(annual * 100).toFixed(2)}%`;
    }
    
    function clearResults() {
        finalAmountDisplay.textContent = '-';
        cumulativeInflationDisplay.textContent = '-%';
        monthlyAverageDisplay.textContent = '-%';
        annualAverageDisplay.textContent = '-%';
    }

    // --- START THE APP ---
    setup();
});
