/* ====== CHART MANAGER MODULE ====== */

import { CHART_CONFIG, COLORS } from '../utils/Constants.js';

class ChartManager {
    constructor(app) {
        this.app = app;
        this.chartInstance = null;
        this.chartRetryCount = 0;
        this.maxRetries = CHART_CONFIG.MAX_RETRIES;
        this.currentPeriod = CHART_CONFIG.DEFAULT_PERIOD;
        this.customPeriod = null;
        this.isInitializing = false;
        this.chartInitialized = false; // Flag untuk track inisialisasi
    }

    saveChartConfig() {
        if (!this.chartInstance) return;

        console.log('💾 Saving chart configuration...');

        // Simpan hanya konfigurasi penting
        this.preservedChartConfig = {
            currentPeriod: this.currentPeriod,
            customPeriod: this.customPeriod,
            // Simpan data chart yang sederhana
            chartData: this.generateSimpleChartData(),
            lastUpdate: Date.now()
        };
    }

    // TAMBAHKAN method untuk generate data sederhana:
    generateSimpleChartData() {
        // Generate data chart tanpa menyimpan instance Chart.js
        const data = this.generateChartData();

        return {
            labels: data.labels,
            datasets: data.datasets.map(dataset => ({
                label: dataset.label,
                data: dataset.data,
                borderColor: dataset.borderColor,
                backgroundColor: dataset.backgroundColor
            }))
        };
    }

    // TAMBAHKAN method untuk restore dari config:
    restoreChartFromConfig() {
        if (!this.preservedChartConfig) {
            console.log('ℹ️ No preserved chart config found');
            return false;
        }

        console.log('🔄 Restoring chart from config...');

        const container = document.getElementById(this.chartContainerId);
        const canvas = document.getElementById(this.canvasId);

        if (!container || !canvas) {
            console.warn('⚠️ Chart container or canvas not found');
            return false;
        }

        try {
            // Restore period settings
            this.currentPeriod = this.preservedChartConfig.currentPeriod;
            this.customPeriod = this.preservedChartConfig.customPeriod;

            // Update chart dengan data yang disimpan
            this.updateChartWithPreservedData();

            console.log('✅ Chart restored from config');
            return true;

        } catch (error) {
            console.error('❌ Error restoring chart from config:', error);
            return false;
        }
    }

    // TAMBAHKAN method untuk update chart dengan data yang disimpan:
    updateChartWithPreservedData() {
        if (!this.preservedChartConfig || !this.chartInstance) return;

        try {
            // Update chart data
            this.chartInstance.data.labels = this.preservedChartConfig.chartData.labels;
            this.chartInstance.data.datasets = this.preservedChartConfig.chartData.datasets;

            // Update chart
            this.chartInstance.update('none');

        } catch (error) {
            console.error('Error updating chart with preserved data:', error);
            // Fallback: generate new data
            const newData = this.generateChartData();
            this.chartInstance.data = newData;
            this.chartInstance.update('none');
        }
    }

    renderInvestmentChart(data) {
        const canvas = document.getElementById('investmentChart');
        if (!canvas) return;

        // Destroy existing chart if any
        if (this.investmentChartInstance) {
            this.investmentChartInstance.destroy();
        }

        // Ensure Chart.js is loaded
        if (typeof Chart === 'undefined') {
            this.ensureChartJsLoaded().then(() => this.renderInvestmentChart(data));
            return;
        }

        const ctx = canvas.getContext('2d');
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#e5e7eb' : '#374151';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

        this.investmentChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Pokok Investasi',
                        data: data.invested,
                        backgroundColor: CHART_CONFIG.DEFAULT_COLORS.primary,
                        borderRadius: 4,
                        maxBarThickness: 32
                    },
                    {
                        label: 'Bunga / Return',
                        data: data.interest,
                        backgroundColor: CHART_CONFIG.DEFAULT_COLORS.savings,
                        borderRadius: 4,
                        maxBarThickness: 32
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                        titleColor: isDarkMode ? '#f3f4f6' : '#111827',
                        bodyColor: isDarkMode ? '#d1d5db' : '#4b5563',
                        borderColor: gridColor,
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false, color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        stacked: true,
                        grid: { color: gridColor, borderDash: [2, 4] },
                        ticks: {
                            color: textColor,
                            callback: (value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Jt`;
                                return value;
                            }
                        }
                    }
                },
                animation: {
                    y: {
                        duration: 1000,
                        from: 500
                    }
                }
            }
        });
    }

    async initializeChart() {
        if (this.app.state.activeTab !== 'dashboard') return;
        if (this.isInitializing) return;

        // If chart exists and is valid, just update it
        if (this.chartInstance && this.chartInstance.canvas && document.body.contains(this.chartInstance.canvas)) {
            this.updateChart();
            return;
        }

        this.isInitializing = true;

        try {
            console.log('📊 Initializing chart...');
            const container = document.getElementById('chartContainer');
            if (!container) {
                console.warn('❌ Chart container not found');
                return;
            }

            await this.ensureChartJsLoaded();

            const canvas = this.getOrCreateCanvas(container);
            this.createChartInstance(canvas);

            this.chartInitialized = true;
            this.dispatchChartReadyEvent();
            console.log('✅ Chart initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize chart:', error);
            this.showFallbackChart(error);
        } finally {
            this.isInitializing = false;
        }
    }

    ensureChartJsLoaded() {
        if (typeof Chart !== 'undefined') return Promise.resolve();
        if (this.chartReadyPromise) return this.chartReadyPromise;

        console.log('📦 Loading Chart.js...');
        this.chartReadyPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.async = true;
            script.onload = () => {
                console.log('✅ Chart.js loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Chart.js');
                reject(new Error('Failed to load Chart.js'));
            };
            document.head.appendChild(script);
        });
        return this.chartReadyPromise;
    }

    getOrCreateCanvas(container) {
        let canvas = container.querySelector('#financeChart');
        if (!canvas) {
            container.innerHTML = ''; // Clear fallback or placeholders
            canvas = document.createElement('canvas');
            canvas.id = 'financeChart';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            container.appendChild(canvas);
        }
        return canvas;
    }

    dispatchChartReadyEvent() {
        const event = new CustomEvent('chartReady', {
            detail: { chart: this.chartInstance }
        });
        document.dispatchEvent(event);
    }

    createChartInstance(canvas) {
        const ctx = canvas.getContext('2d');
        const data = this.generateChartData();

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: data,
            options: this.getChartOptions()
        });
    }

    // ====== CHART DATA GENERATION ======

    generateChartData() {
        let periodData;

        switch (this.currentPeriod) {
            case 'yearly':
                periodData = this.generateYearlyData();
                break;
            case 'custom':
                periodData = this.generateCustomData();
                break;
            case 'monthly':
            default:
                periodData = this.generateMonthlyData();
        }

        return {
            labels: periodData.labels,
            datasets: [
                {
                    label: 'Pendapatan',
                    data: periodData.income,
                    borderColor: CHART_CONFIG.DEFAULT_COLORS.income,
                    backgroundColor: this.hexToRgba(CHART_CONFIG.DEFAULT_COLORS.income, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: CHART_CONFIG.DEFAULT_COLORS.income,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Pengeluaran',
                    data: periodData.expenses,
                    borderColor: CHART_CONFIG.DEFAULT_COLORS.expenses,
                    backgroundColor: this.hexToRgba(CHART_CONFIG.DEFAULT_COLORS.expenses, 0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: CHART_CONFIG.DEFAULT_COLORS.expenses,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }
            ]
        };
    }

    generateMonthlyData() {
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const currentYear = new Date().getFullYear();

        const incomeData = new Array(12).fill(0);
        const expenseData = new Array(12).fill(0);

        // Aggregate data by month
        this.aggregateTransactionsByMonth(incomeData, 'income', currentYear);
        this.aggregateTransactionsByMonth(expenseData, 'expenses', currentYear);

        // Check if we have real data
        const hasRealData = incomeData.some(amount => amount > 0) || expenseData.some(amount => amount > 0);

        if (!hasRealData) {
            console.log('📊 No real data found, using sample data');
            return this.generateSampleData();
        }

        return { labels, income: incomeData, expenses: expenseData };
    }

    generateYearlyData() {
        const currentYear = new Date().getFullYear();
        const yearsCount = 5;
        const labels = [];

        for (let i = yearsCount - 1; i >= 0; i--) {
            labels.push((currentYear - i).toString());
        }

        const incomeData = new Array(yearsCount).fill(0);
        const expenseData = new Array(yearsCount).fill(0);

        this.aggregateTransactionsByYear(incomeData, 'income', currentYear, yearsCount);
        this.aggregateTransactionsByYear(expenseData, 'expenses', currentYear, yearsCount);

        return { labels, income: incomeData, expenses: expenseData };
    }

    generateCustomData() {
        console.log('📊 Generating custom data...', this.customPeriod);

        let startDate, endDate;

        // ✅ PERBAIKAN: Gunakan customPeriod jika ada
        if (this.customPeriod && this.customPeriod.startDate && this.customPeriod.endDate) {
            startDate = new Date(this.customPeriod.startDate);
            endDate = new Date(this.customPeriod.endDate);

            // Validasi tanggal
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn('⚠️ Invalid custom dates, using default');
                // Fallback ke default jika tanggal invalid
                endDate = new Date();
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 6);
            }
        } else {
            // Default ke last 6 months jika tidak ada customPeriod
            endDate = new Date();
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 6);
            console.log('📊 No custom period found, using default');
        }

        console.log('📅 Date range for custom data:', {
            start: startDate.toLocaleDateString('id-ID'),
            end: endDate.toLocaleDateString('id-ID'),
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        });

        const { groupBy = 'monthly' } = this.customPeriod || {};

        switch (groupBy) {
            case 'daily':
                return this.generateDailyData(startDate, endDate);
            case 'weekly':
                return this.generateWeeklyData(startDate, endDate);
            case 'yearly':
                return this.generateYearlyDataForRange(startDate, endDate);
            default:
                return this.generateMonthlyDataForRange(startDate, endDate);
        }
    }

    generateYearlyDataForRange(startDate, endDate) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        let yearStart = new Date(startDate.getFullYear(), 0, 1); // Mulai dari awal tahun
        let yearEnd = new Date(endDate.getFullYear(), 11, 31); // Akhir tahun

        // Jika range kurang dari 1 tahun, handle khusus
        if (endDate.getFullYear() === startDate.getFullYear()) {
            labels.push(startDate.getFullYear().toString());
            incomeData.push(this.getTransactionsForDateRange('income', startDate, endDate));
            expenseData.push(this.getTransactionsForDateRange('expenses', startDate, endDate));
            return { labels, income: incomeData, expenses: expenseData };
        }

        // Untuk multiple years
        for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
            labels.push(year.toString());

            const yearStartDate = new Date(year, 0, 1);
            const yearEndDate = new Date(year, 11, 31);

            // Adjust untuk tahun pertama dan terakhir
            const actualStart = year === startDate.getFullYear() ? startDate : yearStartDate;
            const actualEnd = year === endDate.getFullYear() ? endDate : yearEndDate;

            incomeData.push(this.getTransactionsForDateRange('income', actualStart, actualEnd));
            expenseData.push(this.getTransactionsForDateRange('expenses', actualStart, actualEnd));
        }

        return { labels, income: incomeData, expenses: expenseData };
    }

    // ====== DATA AGGREGATION HELPERS ======

    aggregateTransactionsByMonth(dataArray, type, year) {
        this.app.state.transactions[type].forEach(transaction => {
            try {
                const date = new Date(transaction.date);
                if (date.getFullYear() === year) {
                    const month = date.getMonth();
                    dataArray[month] += transaction.amount;
                }
            } catch (e) {
                console.warn('Invalid date in transaction:', transaction);
            }
        });
    }

    aggregateTransactionsByYear(dataArray, type, currentYear, yearsCount) {
        this.app.state.transactions[type].forEach(transaction => {
            try {
                const date = new Date(transaction.date);
                const year = date.getFullYear();
                const yearIndex = currentYear - year;

                if (yearIndex >= 0 && yearIndex < yearsCount) {
                    dataArray[yearsCount - 1 - yearIndex] += transaction.amount;
                }
            } catch (e) {
                console.warn('Invalid date in transaction:', transaction);
            }
        });
    }

    // ====== CUSTOM PERIOD DATA GENERATORS ======

    generateDailyData(startDate, endDate) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        let current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            labels.push(current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));

            const dayIncome = this.getTransactionsForDate('income', current);
            const dayExpense = this.getTransactionsForDate('expenses', current);

            incomeData.push(dayIncome);
            expenseData.push(dayExpense);

            current.setDate(current.getDate() + 1);
        }

        return { labels, income: incomeData, expenses: expenseData };
    }

    generateWeeklyData(startDate, endDate) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        let weekStart = new Date(startDate);
        let weekCount = 1;

        while (weekStart <= endDate) {
            labels.push(`Minggu ${weekCount}`);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const weekIncome = this.getTransactionsForDateRange('income', weekStart, weekEnd);
            const weekExpense = this.getTransactionsForDateRange('expenses', weekStart, weekEnd);

            incomeData.push(weekIncome);
            expenseData.push(weekExpense);

            weekStart.setDate(weekStart.getDate() + 7);
            weekCount++;
        }

        return { labels, income: incomeData, expenses: expenseData };
    }

    generateMonthlyDataForRange(startDate, endDate) {
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        let monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

        while (monthStart <= endDate) {
            const monthName = monthStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
            labels.push(monthName);

            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

            const monthIncome = this.getTransactionsForDateRange('income', monthStart, monthEnd);
            const monthExpense = this.getTransactionsForDateRange('expenses', monthStart, monthEnd);

            incomeData.push(monthIncome);
            expenseData.push(monthExpense);

            monthStart.setMonth(monthStart.getMonth() + 1);
        }

        return { labels, income: incomeData, expenses: expenseData };
    }

    // ====== HELPER METHODS ======

    getTransactionsForDate(type, date) {
        return this.app.state.transactions[type].reduce((sum, transaction) => {
            try {
                const transDate = new Date(transaction.date);
                if (transDate.toDateString() === date.toDateString()) {
                    return sum + transaction.amount;
                }
            } catch (e) {
                // Skip invalid dates
            }
            return sum;
        }, 0);
    }

    getTransactionsForDateRange(type, startDate, endDate) {
        return this.app.state.transactions[type].reduce((sum, transaction) => {
            try {
                const transDate = new Date(transaction.date);
                if (transDate >= startDate && transDate <= endDate) {
                    return sum + transaction.amount;
                }
            } catch (e) {
                // Skip invalid dates
            }
            return sum;
        }, 0);
    }

    generateSampleData() {
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        // Generate realistic sample data with growth trend
        const incomeData = labels.map((_, i) => {
            const base = 5000000;
            const growth = i * 400000;
            const random = Math.random() * 800000 - 400000;
            return Math.max(1000000, base + growth + random);
        });

        const expenseData = labels.map((_, i) => {
            const base = 3000000;
            const growth = i * 200000;
            const random = Math.random() * 500000 - 250000;
            return Math.max(500000, base + growth + random);
        });

        return { labels, income: incomeData, expenses: expenseData };
    }

    // ====== CHART CONTROLS ======

    setupChartControls() {
        const chartActions = document.querySelector('.chart-actions');
        if (!chartActions) return;

        // Remove old event listeners by cloning
        const newChartActions = chartActions.cloneNode(true);
        chartActions.parentNode.replaceChild(newChartActions, chartActions);

        // Add new event listeners
        document.querySelector('.chart-actions').addEventListener('click', (e) => {
            const btn = e.target.closest('.chart-btn');
            if (!btn) return;

            e.preventDefault();
            this.handleChartButtonClick(btn);
        });
    }

    handleChartButtonClick(button) {
        const period = button.dataset.period;

        // Update active button
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        // Handle custom period
        if (period === 'custom') {
            this.showCustomDateModal();
            return;
        }

        // Update chart
        this.currentPeriod = period;
        this.customPeriod = null;
        this.updateChart();

        this.app.uiManager.showNotification(`Chart diperbarui: Periode ${period}`, 'success');
    }

    updateChart() {
        if (!this.chartInstance) {
            this.initializeChart();
            return;
        }

        try {
            const newData = this.generateChartData();
            this.chartInstance.data = newData;
            this.chartInstance.update('none');
        } catch (error) {
            console.error('Error updating chart:', error);
            this.app.uiManager.showNotification('Gagal memperbarui chart', 'error');
        }
    }

    resizeChart() {
        if (this.chartInstance) {
            try {
                this.chartInstance.resize();
                this.chartInstance.update('none');
            } catch (error) {
                console.warn('Error resizing chart:', error);
            }
        }
    }

    // ====== CUSTOM PERIOD MODAL ======

    showCustomDateModal() {
        this.app.uiManager.openModal('customDateModal', {
            onOpen: () => this.setupCustomDateModal()
        });
    }

    setupCustomDateModal() {
        // Set default dates (last 6 months)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);

        const startInput = document.getElementById('customStartDate');
        const endInput = document.getElementById('customEndDate');
        const groupSelect = document.getElementById('customGroupBy');

        if (startInput) {
            startInput.value = this.formatDateForInput(startDate);
            startInput.min = '2000-01-01';
            startInput.max = this.formatDateForInput(endDate);
        }

        if (endInput) {
            endInput.value = this.formatDateForInput(endDate);
            endInput.min = '2000-01-01';
            endInput.max = this.formatDateForInput(new Date());
        }

        // Setup event listeners
        const applyBtn = document.getElementById('applyCustomFilter');
        const cancelBtn = document.getElementById('cancelCustomModal');

        if (applyBtn) {
            applyBtn.onclick = () => this.applyCustomFilter();
        }

        if (cancelBtn) {
            cancelBtn.onclick = () => this.app.uiManager.closeModal('customDateModal');
        }
    }

    applyCustomFilter() {
        const startDateStr = document.getElementById('customStartDate')?.value;
        const endDateStr = document.getElementById('customEndDate')?.value;
        const groupBy = document.getElementById('customGroupBy')?.value;

        console.log('🎯 Applying custom filter:', {
            startDateStr,
            endDateStr,
            groupBy
        });

        if (!startDateStr || !endDateStr) {
            this.app.uiManager.showNotification('Pilih tanggal mulai dan akhir', 'error');
            return;
        }

        // Parse tanggal
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Validasi tanggal
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            this.app.uiManager.showNotification('Format tanggal tidak valid', 'error');
            return;
        }

        if (startDate > endDate) {
            this.app.uiManager.showNotification('Tanggal mulai tidak boleh setelah tanggal akhir', 'error');
            return;
        }

        // ✅ PERBAIKAN: Simpan dengan format yang konsisten
        this.currentPeriod = 'custom';
        this.customPeriod = {
            startDate: startDateStr,  // Simpan sebagai string 'YYYY-MM-DD'
            endDate: endDateStr,      // Simpan sebagai string 'YYYY-MM-DD'
            groupBy: groupBy || 'monthly'
        };

        console.log('✅ Custom period set:', this.customPeriod);

        // Force update chart
        this.updateChart();

        // Update active button
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === 'custom') {
                btn.classList.add('active');
            }
        });

        // Format untuk notifikasi
        const formatter = new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        this.app.uiManager.closeModal('customDateModal');
        this.app.uiManager.showNotification(
            `Filter custom diterapkan: ${formatter.format(startDate)} - ${formatter.format(endDate)}`,
            'success'
        );
    }

    // ====== CHART OPTIONS ======

    getChartOptions() {
        const isDark = document.body.classList.contains('dark-mode');

        // Gunakan CSS variables untuk warna dinamis
        const rootStyles = getComputedStyle(document.documentElement);
        const gridColor = isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)';

        const textColor = isDark
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(0, 0, 0, 0.8)'; // Diperbaiki: lebih gelap untuk light mode

        const backgroundColor = isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(255, 255, 255, 0.95)';

        const titleColor = isDark
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(0, 0, 0, 0.9)';

        const bodyColor = isDark
            ? 'rgba(255, 255, 255, 0.7)'
            : 'rgba(0, 0, 0, 0.7)';

        // PERBAIKAN: Pastikan font size cukup besar untuk readability
        const isMobile = window.innerWidth < 768;
        const baseFontSize = isMobile ? 10 : 12;
        const labelFontSize = isMobile ? 9 : 11;

        // Responsive padding
        const chartPadding = isMobile ?
            { top: 10, right: 10, bottom: 20, left: 10 } :
            { top: 20, right: 20, bottom: 40, left: 20 };

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            size: baseFontSize,
                            family: 'Inter, sans-serif',
                            weight: '600'
                        },
                        padding: isMobile ? 10 : 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: backgroundColor,
                    titleColor: titleColor,
                    bodyColor: bodyColor,
                    titleFont: {
                        size: baseFontSize,
                        weight: '600'
                    },
                    bodyFont: {
                        size: baseFontSize
                    },
                    borderColor: 'rgba(67, 97, 238, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: isMobile ? 8 : 12,
                    boxPadding: isMobile ? 4 : 6,
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${this.app.calculator.formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: gridColor,
                        drawBorder: false,
                        drawTicks: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: labelFontSize,
                            family: 'Inter, sans-serif',
                            weight: '500'
                        },
                        padding: isMobile ? 4 : 8
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: true,
                        color: gridColor,
                        drawBorder: false,
                        drawTicks: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: labelFontSize,
                            family: 'Inter, sans-serif',
                            weight: '500'
                        },
                        padding: isMobile ? 4 : 8,
                        callback: (value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                            return value;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest',
                axis: 'x'
            },
            animation: {
                y: {
                    duration: 1500,
                    from: 500, // Drop from bottom effect
                    easing: 'easeOutQuart'
                },
                duration: CHART_CONFIG.ANIMATION_DURATION || 1000,
                easing: 'easeOutQuart',
                delay: 200
            },
            elements: {
                point: {
                    radius: isMobile ? 3 : 4,
                    hoverRadius: isMobile ? 4 : 6,
                    hoverBorderWidth: 2,
                    hoverBorderColor: '#ffffff'
                },
                line: {
                    tension: 0.3,
                    borderWidth: isMobile ? 2 : 3
                }
            },
            layout: {
                padding: chartPadding
            }
        };
    }

    // ====== ERROR HANDLING ======

    handleChartError(error) {
        console.error('❌ Chart error:', error);
        this.showFallbackChart(error);
    }



    showFallbackChart(error = null) {
        const container = document.getElementById('chartContainer');
        if (!container) return;

        const errorMessage = error ? `Error: ${error.message}` : 'Chart tidak tersedia';

        container.innerHTML = `
            <div class="fallback-chart">
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 3rem; margin-bottom: 15px; opacity: 0.7;">📊</div>
                    <div style="font-weight: 700; font-size: 1.25rem; margin-bottom: 8px;">
                        Visualisasi Data
                    </div>
                    <div style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">
                        ${errorMessage}
                    </div>
                    <div style="margin-top: 30px;">
                        ${this.renderSimplifiedChart()}
                    </div>
                    <button onclick="app.chartManager.initializeChart()" 
                            style="margin-top: 20px; padding: 8px 16px; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">
                        🔄 Coba Lagi
                    </button>
                </div>
            </div>
        `;
    }

    renderSimplifiedChart() {
        // Simple bar chart using HTML/CSS
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
        const incomeData = [5, 7, 8, 6, 9, 10];
        const expenseData = [3, 5, 6, 4, 7, 8];
        const maxValue = Math.max(...incomeData, ...expenseData);

        let html = '<div style="height: 200px; display: flex; align-items: flex-end; gap: 10px; justify-content: center;">';

        labels.forEach((label, index) => {
            const incomeHeight = (incomeData[index] / maxValue) * 150;
            const expenseHeight = (expenseData[index] / maxValue) * 150;

            html += `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="display: flex; align-items: flex-end; gap: 4px; height: 150px;">
                        <div style="width: 12px; height: ${incomeHeight}px; background: ${CHART_CONFIG.DEFAULT_COLORS.income}; border-radius: 3px;"></div>
                        <div style="width: 12px; height: ${expenseHeight}px; background: ${CHART_CONFIG.DEFAULT_COLORS.expenses}; border-radius: 3px;"></div>
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted);">${label}</div>
                </div>
            `;
        });

        html += '</div>';

        // Add legend
        html += `
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px; font-size: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: ${CHART_CONFIG.DEFAULT_COLORS.income}; border-radius: 2px;"></div>
                    <span style="color: var(--text-muted);">Pendapatan</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 12px; height: 12px; background: ${CHART_CONFIG.DEFAULT_COLORS.expenses}; border-radius: 2px;"></div>
                    <span style="color: var(--text-muted);">Pengeluaran</span>
                </div>
            </div>
        `;

        return html;
    }

    // ====== UTILITY METHODS ======



    destroyChart() {
        if (this.chartInstance) {
            try {
                this.chartInstance.destroy();
                this.chartInstance = null;
                this.chartInitialized = false;
                console.log('🗑️ Chart destroyed');
            } catch (error) {
                console.warn('⚠️ Error destroying chart:', error);
            }
        }
    }

    isChartValid() {
        if (!this.chartInstance) return false;

        try {
            // Cek jika canvas masih ada di DOM
            const canvas = document.getElementById('financeChart');
            if (!canvas) return false;

            // Cek jika chart masih bisa diakses
            return !!this.chartInstance.canvas;
        } catch (error) {
            return false;
        }
    }

    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

export default ChartManager;
