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
        this.preloadChartJs();
    }

        // ====== PRELOAD CHART.JS ======
    preloadChartJs() {
        // Cek jika Chart.js sudah ada
        if (typeof Chart !== 'undefined') {
            console.log('✅ Chart.js already loaded');
            return;
        }
        
        // Cek jika sedang loading
        if (document.querySelector('script[src*="chart.js"]')) {
            console.log('📦 Chart.js is loading...');
            return;
        }
        
        // Preload Chart.js untuk performa lebih baik
        console.log('📦 Preloading Chart.js...');
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = 'https://cdn.jsdelivr.net/npm/chart.js';
        document.head.appendChild(link);
    }

    // ====== CHART INITIALIZATION ======
    
    initializeChart() {
        console.log('📊 Initializing chart...');
        
        this.chartRetryCount = 0;

        // Check if we're on dashboard
        if (this.app.state.activeTab !== 'dashboard') {
            console.log('ℹ️ Not on dashboard, skipping chart initialization');
            return;
        }
        
        // Check if chart container exists
        const container = document.getElementById('chartContainer');
        if (!container) {
            console.warn('⚠️ Chart container not found, retrying...');
            setTimeout(() => this.initializeChart(), 100);
            return;
        }
        this.destroyChart();
        
        // Try to initialize with retry logic
        this.tryInitializeChart();
    }

    tryInitializeChart() {
        this.chartRetryCount++;
        
        console.log(`🔄 Chart initialization attempt ${this.chartRetryCount}/${this.maxRetries}`);
        
        // Check if we're still on dashboard
        if (this.app.state.activeTab !== 'dashboard') {
            console.log('ℹ️ Switched away from dashboard, stopping chart initialization');
            return;
        }

        // Check if chart container exists
        const container = document.getElementById('chartContainer');
        if (!container) {
            console.error('❌ Chart container not found');
            this.scheduleRetry();
            return;
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded yet');
            
            if (this.chartRetryCount === 1) {
                this.loadChartJsDynamically();
            }
            this.scheduleRetry();
            return;
        }
        
        // Create or get canvas
        const canvas = this.prepareCanvas();
        if (!canvas) {
            this.scheduleRetry();
            return;
        }
        
        // Create chart instance
        try {
            this.createChartInstance(canvas);
            this.setupChartControls();
            console.log('✅ Chart initialized successfully');
            
            // Update container styling
            container.classList.remove('chart-placeholder');
            
            // Dispatch event untuk memberi tahu chart siap
            this.dispatchChartReadyEvent();

        } catch (error) {
            console.error('❌ Error creating chart:', error);
            this.handleChartError(error);
        }
    }

    // ====== EVENT DISPATCH ======
    dispatchChartReadyEvent() {
        const event = new CustomEvent('chartReady', {
            detail: { chart: this.chartInstance }
        });
        document.dispatchEvent(event);
    }

    prepareCanvas() {
        const container = document.getElementById('chartContainer');
        if (!container) return null;
        
        // Clear container
        container.innerHTML = '';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'financeChart';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        container.appendChild(canvas);
        
        return canvas;
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
        
        switch(this.currentPeriod) {
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
        // Default to last 6 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        
        const { groupBy = 'monthly' } = this.customPeriod || {};
        
        switch(groupBy) {
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
        const startDate = document.getElementById('customStartDate')?.value;
        const endDate = document.getElementById('customEndDate')?.value;
        const groupBy = document.getElementById('customGroupBy')?.value;
        
        if (!startDate || !endDate) {
            this.app.uiManager.showNotification('Pilih tanggal mulai dan akhir', 'error');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            this.app.uiManager.showNotification('Tanggal mulai tidak boleh setelah tanggal akhir', 'error');
            return;
        }
        
        // Update chart with custom period
        this.currentPeriod = 'custom';
        this.customPeriod = { startDate, endDate, groupBy };
        this.updateChart();
        
        // Update active button
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.period === 'custom') {
                btn.classList.add('active');
            }
        });
        
        this.app.uiManager.closeModal('customDateModal');
        this.app.uiManager.showNotification(`Chart custom diterapkan (${groupBy})`, 'success');
    }

    // ====== CHART OPTIONS ======
    
    getChartOptions() {
        const isDark = document.body.classList.contains('dark-mode');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
        const textColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)';
        
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: {
                            size: 12,
                            family: 'Inter, sans-serif',
                            weight: '600'
                        },
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    bodyColor: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
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
                        drawBorder: false
                    },
                    ticks: { 
                        color: textColor,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: { 
                        display: true, 
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        },
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
                duration: CHART_CONFIG.ANIMATION_DURATION,
                easing: 'easeOutQuart'
            },
            elements: {
                point: { 
                    radius: 4, 
                    hoverRadius: 6,
                    hoverBorderWidth: 2
                },
                line: { 
                    tension: 0.3,
                    borderWidth: 3
                }
            },
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 10,
                    left: 10
                }
            }
        };
    }

    // ====== ERROR HANDLING ======
    
    handleChartError(error) {
        console.error('❌ Chart error:', error);
        
        if (this.chartRetryCount < this.maxRetries) {
            const delay = 300 * this.chartRetryCount;
            console.log(`🔄 Retrying in ${delay}ms...`);
            setTimeout(() => this.tryInitializeChart(), delay);
        } else {
            this.showFallbackChart(error);
        }
    }

    scheduleRetry() {
        if (this.chartRetryCount >= this.maxRetries) {
            console.log('❌ Max retries reached, showing fallback');
            this.showFallbackChart();
            return;
        }
        
        // Delay yang meningkat secara eksponensial
        const delay = Math.min(300 * Math.pow(1.5, this.chartRetryCount), 3000);
        console.log(`🔄 Retrying in ${delay}ms...`);
        
        setTimeout(() => {
            // Cek apakah masih di dashboard sebelum retry
            if (this.app.state.activeTab === 'dashboard') {
                this.tryInitializeChart();
            }
        }, delay);
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
    
    loadChartJsDynamically() {
        // Cek jika sudah ada script
        if (document.querySelector('script[src*="chart.js"]')) {
            console.log('📦 Chart.js script already exists');
            return;
        }
        
        console.log('📦 Loading Chart.js dynamically...');
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log('✅ Chart.js loaded successfully');
            
            // Coba initialize chart setelah load
            setTimeout(() => {
                if (this.app.state.activeTab === 'dashboard') {
                    this.tryInitializeChart();
                }
            }, 100);
        };
        
        script.onerror = (error) => {
            console.error('❌ Failed to load Chart.js:', error);
            this.showFallbackChart(new Error('Failed to load Chart.js library'));
        };
        
        document.head.appendChild(script);
    }

    destroyChart() {
        if (this.chartInstance) {
            try {
                this.chartInstance.destroy();
                this.chartInstance = null;
                console.log('🗑️ Previous chart destroyed');
            } catch (error) {
                console.warn('⚠️ Error destroying chart:', error);
            }
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
