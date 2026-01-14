/* ====== INCOME VIEW MODULE ====== */

class IncomeView {
    constructor(app) {
        this.app = app;
    }

    render() {
        console.log('💰 Rendering Income View...');
        
        const html = this.getIncomeHTML();
        this.app.elements.mainContent.innerHTML = html;
        
        // Initialize after DOM is ready
        setTimeout(() => {
            this.initialize();
        }, 50);
    }

    getIncomeHTML() {
        const totalIncome = this.app.calculator.formatCurrency(this.app.state.finances.income);
        const transactionCount = this.app.state.transactions.income.length;
        const avgMonthly = Math.round(this.app.state.finances.income / 12);
        const largestSource = this.getLargestSource();
        
        return `
            <div class="section-title">💰 Pendapatan</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
                <div>
                    <div style="font-size: 2rem; font-weight: 700; color: var(--success);">
                        ${totalIncome}
                    </div>
                    <div class="text-muted">Total pendapatan bulan ini</div>
                </div>
                <button class="btn" id="addIncomeBtn">
                    <span>➕</span> Tambah Pendapatan
                </button>
            </div>
            
            <div class="stats-grid" style="margin-bottom: var(--space-6);">
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Rata-rata Bulanan</div>
                            <div class="stat-value">${this.app.calculator.formatCurrency(avgMonthly)}</div>
                        </div>
                        <div class="stat-icon">📅</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Sumber Terbesar</div>
                            <div class="stat-value" id="largestSource">${largestSource}</div>
                        </div>
                        <div class="stat-icon">🏷️</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Transaksi</div>
                            <div class="stat-value">${transactionCount}</div>
                        </div>
                        <div class="stat-icon">📝</div>
                    </div>
                </div>
            </div>
            
            <div class="activity-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 class="section-title">Daftar Pendapatan</h3>
                    <div class="text-muted">${transactionCount} transaksi</div>
                </div>
                
                <div id="incomeList">
                    ${this.getIncomeListHTML()}
                </div>
            </div>
            
            <!-- Income Analysis -->
            ${this.getIncomeAnalysisHTML()}
        `;
    }

    getIncomeListHTML() {
        if (this.app.state.transactions.income.length === 0) {
            return '<div class="text-center text-muted mt-6">Belum ada pendapatan</div>';
        }
        
        return this.app.state.transactions.income.map(income => `
            <div class="activity-item income-activity" data-income-id="${income.id}">
                <div class="activity-icon">💰</div>
                <div class="activity-details">
                    <div class="activity-title">${income.name}</div>
                    <div class="activity-meta">
                        <span>${this.app.uiManager.formatDate(income.date)}</span>
                        <span>•</span>
                        <span>${this.app.uiManager.getCategoryName(income.category)}</span>
                    </div>
                </div>
                <div class="activity-amount" style="color: var(--success);">
                    + ${this.app.calculator.formatCurrency(income.amount)}
                </div>
                <button class="btn-outline" style="margin-left: var(--space-2); font-size: 0.875rem;" 
                        onclick="handleDeleteTransaction('income', ${income.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }

    getIncomeAnalysisHTML() {
        const incomeAnalysis = this.getIncomeAnalysis();
        const monthlyStats = this.getMonthlyStats();
        
        return `
            <div class="dashboard-grid mt-6">
                <div class="activity-section">
                    <h3 class="section-title">Analisis Sumber Pendapatan</h3>
                    <div id="incomeAnalysis" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">
                        ${incomeAnalysis}
                    </div>
                </div>
                
                <div class="activity-section">
                    <h3 class="section-title">Statistik Bulanan</h3>
                    <div style="padding: var(--space-4);">
                        ${monthlyStats}
                    </div>
                </div>
            </div>
        `;
    }

    getLargestSource() {
        const sourceTotals = {};
        
        this.app.state.transactions.income.forEach(income => {
            sourceTotals[income.category] = (sourceTotals[income.category] || 0) + income.amount;
        });
        
        let largestSource = '-';
        let largestAmount = 0;
        
        for (const [category, amount] of Object.entries(sourceTotals)) {
            if (amount > largestAmount) {
                largestAmount = amount;
                largestSource = this.app.uiManager.getCategoryName(category);
            }
        }
        
        return largestSource;
    }

    getIncomeAnalysis() {
        if (this.app.state.transactions.income.length === 0) {
            return '<div class="text-center text-muted">Tidak ada data untuk dianalisis</div>';
        }
        
        // Group by category
        const categories = {};
        this.app.state.transactions.income.forEach(item => {
            categories[item.category] = (categories[item.category] || 0) + item.amount;
        });
        
        let analysisHTML = '<div style="width: 100%;">';
        for (const [category, amount] of Object.entries(categories)) {
            const percentage = Math.round((amount / this.app.state.finances.income) * 100);
            analysisHTML += `
                <div style="margin-bottom: var(--space-3);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span>${this.app.uiManager.getCategoryName(category)}</span>
                        <span style="font-weight: 600;">${percentage}%</span>
                    </div>
                    <div style="height: 8px; background: var(--bg-surface); border-radius: var(--radius-full); overflow: hidden;">
                        <div style="width: ${percentage}%; height: 100%; background: var(--success); border-radius: var(--radius-full);"></div>
                    </div>
                    <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 2px;">
                        ${this.app.calculator.formatCurrency(amount)}
                    </div>
                </div>
            `;
        }
        analysisHTML += '</div>';
        
        return analysisHTML;
    }

    getMonthlyStats() {
        // Group by month
        const monthlyStats = {};
        this.app.state.transactions.income.forEach(item => {
            const date = new Date(item.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyStats[monthYear] = (monthlyStats[monthYear] || 0) + item.amount;
        });
        
        if (Object.keys(monthlyStats).length === 0) {
            return '<div class="text-center text-muted">Tidak ada data bulanan</div>';
        }
        
        let statsHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-4);">';
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        for (const [monthYear, amount] of Object.entries(monthlyStats)) {
            const [year, month] = monthYear.split('-');
            const monthName = months[parseInt(month) - 1];
            statsHTML += `
                <div style="text-align: center; padding: var(--space-3); background: var(--bg-surface); border-radius: var(--radius-lg);">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">${monthName} ${year}</div>
                    <div style="font-weight: 700; color: var(--success); margin-top: 4px;">${this.app.calculator.formatCurrency(amount)}</div>
                </div>
            `;
        }
        
        statsHTML += '</div>';
        return statsHTML;
    }

    initialize() {
        // Add income button
        document.getElementById('addIncomeBtn')?.addEventListener('click', () => {
            this.app.uiManager.openModal('addIncomeModal');
        });
        
        // Setup delete handlers
        this.setupDeleteHandlers();
    }

    setupDeleteHandlers() {
        // Handlers are attached via onclick in the HTML
    }

    refresh() {
        const incomeListEl = document.getElementById('incomeList');
        if (incomeListEl) {
            incomeListEl.innerHTML = this.getIncomeListHTML();
        }
        
        const largestSourceEl = document.getElementById('largestSource');
        if (largestSourceEl) {
            largestSourceEl.textContent = this.getLargestSource();
        }
        
        // Update income analysis
        const incomeAnalysisEl = document.getElementById('incomeAnalysis');
        if (incomeAnalysisEl) {
            incomeAnalysisEl.innerHTML = this.getIncomeAnalysis();
        }
        
        // Update transaction count
        const transactionCountEl = document.querySelector('.activity-section .text-muted');
        if (transactionCountEl) {
            transactionCountEl.textContent = `${this.app.state.transactions.income.length} transaksi`;
        }
    }
}

export default IncomeView;