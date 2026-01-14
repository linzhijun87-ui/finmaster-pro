/* ====== SIMULATION VIEW MODULE ====== */

class SimulationView {
    constructor(app) {
        this.app = app;
    }

    render() {
        console.log('📈 Rendering Simulation View...');
        
        const html = this.getSimulationHTML();
        this.app.elements.mainContent.innerHTML = html;
        
        // Initialize after DOM is ready
        setTimeout(() => {
            this.initialize();
        }, 50);
    }

    getSimulationHTML() {
        return `
            <div class="section-title">📈 Simulasi Keuangan</div>
            
            <div class="dashboard-grid">
                <!-- Investment Calculator -->
                <div class="activity-section">
                    <h3 class="section-title">Kalkulator Investasi</h3>
                    <div style="padding: var(--space-4);">
                        <div class="form-group">
                            <label for="initialInvestment">Investasi Awal (Rp)</label>
                            <input type="number" id="initialInvestment" value="10000000" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="monthlyContribution">Kontribusi Bulanan (Rp)</label>
                            <input type="number" id="monthlyContribution" value="1000000" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="investmentPeriod">Jangka Waktu (tahun)</label>
                            <input type="number" id="investmentPeriod" value="10" min="1" max="50">
                        </div>
                        
                        <div class="form-group">
                            <label for="expectedReturn">Return Tahunan (%)</label>
                            <input type="number" id="expectedReturn" value="12" min="0" max="50" step="0.1">
                        </div>
                        
                        <button class="btn w-full" id="calculateInvestment">
                            🧮 Hitung Investasi
                        </button>
                        
                        <div id="investmentResult" style="margin-top: var(--space-6); display: none;">
                            <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg);">
                                <h4 style="margin-bottom: var(--space-4);">Hasil Simulasi</h4>
                                <div id="resultDetails"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Loan Calculator -->
                <div class="activity-section">
                    <h3 class="section-title">Kalkulator Pinjaman</h3>
                    <div style="padding: var(--space-4);">
                        <div class="form-group">
                            <label for="loanAmount">Jumlah Pinjaman (Rp)</label>
                            <input type="number" id="loanAmount" value="50000000" min="0">
                        </div>
                        
                        <div class="form-group">
                            <label for="loanTerm">Jangka Waktu (tahun)</label>
                            <input type="number" id="loanTerm" value="5" min="1" max="30">
                        </div>
                        
                        <div class="form-group">
                            <label for="interestRate">Bunga Tahunan (%)</label>
                            <input type="number" id="interestRate" value="8" min="0" max="30" step="0.1">
                        </div>
                        
                        <div class="form-group">
                            <label for="loanType">Jenis Pinjaman</label>
                            <select id="loanType">
                                <option value="flat">Flat Rate</option>
                                <option value="annuity">Anuitas</option>
                            </select>
                        </div>
                        
                        <button class="btn w-full" id="calculateLoan">
                            🧮 Hitung Pinjaman
                        </button>
                        
                        <div id="loanResult" style="margin-top: var(--space-6); display: none;">
                            <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg);">
                                <h4 style="margin-bottom: var(--space-4);">Detail Pinjaman</h4>
                                <div id="loanDetails"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Investment Scenarios -->
            ${this.getInvestmentScenariosHTML()}
            
            <!-- Investment Tips -->
            ${this.getInvestmentTipsHTML()}
        `;
    }

    getInvestmentScenariosHTML() {
        return `
            <div class="activity-section mt-6">
                <h3 class="section-title">Skenario Investasi Populer</h3>
                <div class="actions-grid" style="margin-top: var(--space-4);">
                    <button class="action-btn" onclick="app.loadInvestmentScenario('saving')">
                        <div class="action-icon">🏦</div>
                        <div style="font-weight: 600;">Tabungan Dana Darurat</div>
                        <div class="text-muted" style="font-size: 0.875rem;">6x pengeluaran bulanan</div>
                    </button>
                    
                    <button class="action-btn" onclick="app.loadInvestmentScenario('dp_rumah')">
                        <div class="action-icon">🏠</div>
                        <div style="font-weight: 600;">DP Rumah</div>
                        <div class="text-muted" style="font-size: 0.875rem;">20% dari harga rumah</div>
                    </button>
                    
                    <button class="action-btn" onclick="app.loadInvestmentScenario('pensiun')">
                        <div class="action-icon">👴</div>
                        <div style="font-weight: 600;">Dana Pensiun</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Persiapan masa tua</div>
                    </button>
                    
                    <button class="action-btn" onclick="app.loadInvestmentScenario('pendidikan')">
                        <div class="action-icon">🎓</div>
                        <div style="font-weight: 600;">Dana Pendidikan</div>
                        <div class="text-muted" style="font-size: 0.875rem;">Biaya kuliah anak</div>
                    </button>
                </div>
            </div>
        `;
    }

    getInvestmentTipsHTML() {
        return `
            <div class="activity-section mt-6">
                <h3 class="section-title">💡 Tips Investasi</h3>
                <div style="margin-top: var(--space-4);">
                    <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
                        <div style="font-weight: 600; margin-bottom: var(--space-2);">Mulai Sedini Mungkin</div>
                        <div style="color: var(--text-muted);">Compound interest bekerja paling baik dalam jangka panjang.</div>
                    </div>
                    
                    <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg); margin-bottom: var(--space-4);">
                        <div style="font-weight: 600; margin-bottom: var(--space-2);">Diversifikasi</div>
                        <div style="color: var(--text-muted);">Jangan taruh semua telur dalam satu keranjang.</div>
                    </div>
                    
                    <div style="background: var(--bg-surface); padding: var(--space-4); border-radius: var(--radius-lg);">
                        <div style="font-weight: 600; margin-bottom: var(--space-2);">Risk Management</div>
                        <div style="color: var(--text-muted);">Sesuaikan risiko dengan usia dan tujuan finansial.</div>
                    </div>
                </div>
            </div>
        `;
    }

    initialize() {
        // Investment calculator
        document.getElementById('calculateInvestment')?.addEventListener('click', () => {
            this.calculateInvestment();
        });
        
        // Loan calculator
        document.getElementById('calculateLoan')?.addEventListener('click', () => {
            this.calculateLoan();
        });
        
        // Investment scenarios
        document.querySelectorAll('[onclick*="loadInvestmentScenario"]').forEach(btn => {
            btn.onclick = (e) => {
                const scenarioType = e.target.closest('.action-btn').querySelector('div:nth-child(2)').textContent.includes('Dana Darurat') ? 'saving' :
                                   e.target.closest('.action-btn').querySelector('div:nth-child(2)').textContent.includes('DP Rumah') ? 'dp_rumah' :
                                   e.target.closest('.action-btn').querySelector('div:nth-child(2)').textContent.includes('Pensiun') ? 'pensiun' : 'pendidikan';
                this.loadInvestmentScenario(scenarioType);
            };
        });
    }

    calculateInvestment() {
        const initial = parseInt(document.getElementById('initialInvestment').value) || 0;
        const monthly = parseInt(document.getElementById('monthlyContribution').value) || 0;
        const years = parseInt(document.getElementById('investmentPeriod').value) || 1;
        const annualReturn = parseFloat(document.getElementById('expectedReturn').value) || 0;
        
        const monthlyReturn = annualReturn / 12 / 100;
        const months = years * 12;
        
        // Future value calculation
        let futureValue = initial * Math.pow(1 + monthlyReturn, months);
        
        // Add monthly contributions
        for (let i = 0; i < months; i++) {
            futureValue += monthly * Math.pow(1 + monthlyReturn, months - i - 1);
        }
        
        const totalContributions = initial + (monthly * months);
        const totalEarnings = futureValue - totalContributions;
        const roi = totalContributions > 0 ? (totalEarnings / totalContributions) * 100 : 0;
        
        // Display results
        const resultHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4);">
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Nilai Masa Depan</div>
                    <div style="font-weight: 700; font-size: 1.5rem; color: var(--success);">
                        ${this.app.calculator.formatCurrency(Math.round(futureValue))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Total Investasi</div>
                    <div style="font-weight: 700; font-size: 1.25rem;">
                        ${this.app.calculator.formatCurrency(totalContributions)}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Keuntungan</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">
                        ${this.app.calculator.formatCurrency(Math.round(totalEarnings))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">ROI</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--warning);">
                        ${Math.round(roi)}%
                    </div>
                </div>
            </div>
            
            <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-color);">
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                    <strong>Catatan:</strong> Perhitungan menggunakan asumsi return konsisten ${annualReturn}% per tahun. 
                    Hasil aktual mungkin berbeda tergantung kondisi pasar.
                </div>
            </div>
        `;
        
        document.getElementById('resultDetails').innerHTML = resultHTML;
        document.getElementById('investmentResult').style.display = 'block';
        
        this.app.uiManager.showNotification('Simulasi investasi selesai!', 'success');
    }

    calculateLoan() {
        const amount = parseInt(document.getElementById('loanAmount').value) || 0;
        const years = parseInt(document.getElementById('loanTerm').value) || 1;
        const annualRate = parseFloat(document.getElementById('interestRate').value) || 0;
        const type = document.getElementById('loanType').value;
        
        const months = years * 12;
        const monthlyRate = annualRate / 12 / 100;
        
        let monthlyPayment = 0;
        let totalPayment = 0;
        let totalInterest = 0;
        
        if (type === 'flat') {
            // Flat rate calculation
            totalInterest = amount * annualRate / 100 * years;
            totalPayment = amount + totalInterest;
            monthlyPayment = totalPayment / months;
        } else {
            // Annuity calculation
            monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                            (Math.pow(1 + monthlyRate, months) - 1);
            totalPayment = monthlyPayment * months;
            totalInterest = totalPayment - amount;
        }
        
        const effectiveRate = (totalInterest / amount * 100 / years).toFixed(1);
        
        const resultHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4);">
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Cicilan Bulanan</div>
                    <div style="font-weight: 700; font-size: 1.5rem; color: var(--danger);">
                        ${this.app.calculator.formatCurrency(Math.round(monthlyPayment))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Total Bayar</div>
                    <div style="font-weight: 700; font-size: 1.25rem;">
                        ${this.app.calculator.formatCurrency(Math.round(totalPayment))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Total Bunga</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--warning);">
                        ${this.app.calculator.formatCurrency(Math.round(totalInterest))}
                    </div>
                </div>
                
                <div style="text-align: center;">
                    <div style="font-size: 0.875rem; color: var(--text-muted);">Efektif Bunga</div>
                    <div style="font-weight: 700; font-size: 1.25rem; color: var(--primary);">
                        ${effectiveRate}%
                    </div>
                </div>
            </div>
            
            <div style="margin-top: var(--space-4);">
                <div style="font-size: 0.875rem; color: var(--text-muted);">
                    <strong>Perbandingan:</strong> Dengan bunga flat ${annualRate}%, total bunga yang dibayar adalah 
                    ${Math.round(totalInterest / amount * 100)}% dari pokok pinjaman.
                </div>
            </div>
        `;
        
        document.getElementById('loanDetails').innerHTML = resultHTML;
        document.getElementById('loanResult').style.display = 'block';
        
        this.app.uiManager.showNotification('Simulasi pinjaman selesai!', 'success');
    }

    loadInvestmentScenario(type) {
        const scenarios = {
            'saving': {
                initial: 0,
                monthly: Math.round(this.app.state.finances.expenses * 6 / 12), // 6 months expenses spread over 1 year
                years: 1,
                return: 5
            },
            'dp_rumah': {
                initial: 0,
                monthly: 3000000,
                years: 3,
                return: 8
            },
            'pensiun': {
                initial: 10000000,
                monthly: 2000000,
                years: 20,
                return: 10
            },
            'pendidikan': {
                initial: 5000000,
                monthly: 1500000,
                years: 10,
                return: 9
            }
        };
        
        const scenario = scenarios[type];
        if (!scenario) return;
        
        document.getElementById('initialInvestment').value = scenario.initial;
        document.getElementById('monthlyContribution').value = scenario.monthly;
        document.getElementById('investmentPeriod').value = scenario.years;
        document.getElementById('expectedReturn').value = scenario.return;
        
        this.app.uiManager.showNotification(`Skenario ${type} dimuat!`, 'success');
        
        // Auto calculate
        setTimeout(() => {
            this.calculateInvestment();
        }, 300);
    }

    refresh() {
        // Nothing to refresh in simulation view
    }
}

export default SimulationView;