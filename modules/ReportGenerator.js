/* ====== REPORT GENERATOR MODULE ====== */

import { COLORS, CHART_CONFIG } from '../utils/Constants.js';

class ReportGenerator {
    constructor(app) {
        this.app = app;
        this.pdfLoading = false;
    }

    // ====== REPORT GENERATION METHODS ======

    generatePrintableReport() {
        console.log('📄 Generating printable report...');

        try {
            const reportDate = new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const printWindow = window.open('', '_blank');

            const reportHTML = this.getReportHTML(reportDate);
            printWindow.document.write(reportHTML);
            printWindow.document.close();

            this.app.uiManager.showNotification('✅ Laporan siap dicetak!', 'success');

        } catch (error) {
            console.error('❌ Error generating printable report:', error);
            this.app.uiManager.showNotification('Gagal membuat laporan printable', 'error');
        }
    }

    getReportHTML(reportDate) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laporan Keuangan - ${reportDate}</title>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        @page {
                            size: A4;
                            margin: 0.5in;
                        }
                        .print-actions { display: none !important; }
                        body { 
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                    
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        padding: 20px;
                        max-width: 1000px;
                        margin: 0 auto;
                    }
                    
                    .no-print { display: none !important; }
                    
                    h1, h2, h3 { 
                        color: #2d3748;
                        margin-top: 30px;
                        margin-bottom: 15px;
                    }
                    
                    h1 { 
                        font-size: 28px; 
                        border-bottom: 3px solid ${COLORS.primary};
                        padding-bottom: 10px;
                    }
                    
                    h2 { 
                        font-size: 22px; 
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 8px;
                    }
                    
                    .summary-grid { 
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin: 25px 0;
                    }
                    
                    .summary-card {
                        border: 1px solid #e2e8f0;
                        border-radius: 10px;
                        padding: 20px;
                        text-align: center;
                        background: #f8fafc;
                    }
                    
                    .summary-value {
                        font-size: 24px;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                        font-size: 14px;
                        page-break-inside: avoid;
                    }
                    
                    th {
                        background-color: #f1f5f9 !important;
                        font-weight: 600;
                        text-align: left;
                    }
                    
                    th, td {
                        border: 1px solid #e2e8f0;
                        padding: 12px 15px;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8fafc;
                    }
                    
                    .footer {
                        margin-top: 50px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                        text-align: center;
                        font-size: 12px;
                        color: #718096;
                    }
                    
                    @media screen and (max-width: 768px) {
                        .summary-grid {
                            grid-template-columns: repeat(2, 1fr);
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-actions no-print" style="margin-bottom: 30px; text-align: center;">
                    <button onclick="window.print()" style="
                        background: ${COLORS.primary};
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        margin: 0 10px;
                    ">
                        🖨️ Cetak Laporan
                    </button>
                    <button onclick="window.close()" style="
                        background: #718096;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        margin: 0 10px;
                    ">
                        ✖️ Tutup
                    </button>
                </div>
                
                <div class="report-content">
                    ${this.getReportHeaderHTML(reportDate)}
                    ${this.getSummaryHTML()}
                    ${this.getRecentTransactionsHTML()}
                    ${this.getGoalsHTML()}
                    ${this.getFooterHTML()}
                </div>
                
                <script>
                    // Auto print after load
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                </script>
            </body>
            </html>
        `;
    }

    getReportHeaderHTML(reportDate) {
        return `
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
                <h1>📊 LAPORAN KEUANGAN</h1>
                <div style="color: #718096; font-size: 16px; margin-top: 10px;">
                    <div>Tanggal: <strong>${reportDate}</strong></div>
                    <div>User: <strong>${this.app.state.user.name}</strong></div>
                </div>
            </div>
        `;
    }

    getSummaryHTML() {
        const savingsRate = this.calculateSavingsRate();

        return `
            <!-- Summary Section -->
            <div>
                <h2>📈 RINGKASAN FINANSIAL</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <div style="font-size: 14px; color: #718096;">TOTAL PENDAPATAN</div>
                        <div class="summary-value" style="color: ${COLORS.success};">
                            ${this.app.calculator.formatCurrency(this.app.state.finances.income)}
                        </div>
                        <div style="font-size: 12px; color: ${COLORS.success};">
                            ${this.app.state.transactions.income.length} transaksi
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <div style="font-size: 14px; color: #718096;">TOTAL PENGELUARAN</div>
                        <div class="summary-value" style="color: ${COLORS.danger};">
                            ${this.app.calculator.formatCurrency(this.app.state.finances.expenses)}
                        </div>
                        <div style="font-size: 12px; color: ${COLORS.danger};">
                            ${this.app.state.transactions.expenses.length} transaksi
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <div style="font-size: 14px; color: #718096;">TOTAL TABUNGAN</div>
                        <div class="summary-value" style="color: ${COLORS.primary};">
                            ${this.app.calculator.formatCurrency(this.app.state.finances.savings)}
                        </div>
                        <div style="font-size: 12px; color: ${COLORS.primary};">
                            ${savingsRate}% dari pendapatan
                        </div>
                    </div>
                    
                    <div class="summary-card">
                        <div style="font-size: 14px; color: #718096;">SALDO AKHIR</div>
                        <div class="summary-value" style="color: #7209b7;">
                            ${this.app.calculator.formatCurrency(this.app.state.finances.balance)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getRecentTransactionsHTML() {
        const recentTransactions = this.getRecentTransactions();

        let tableRows = '';
        if (recentTransactions.length === 0) {
            tableRows = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #718096;">Belum ada transaksi</td></tr>';
        } else {
            tableRows = recentTransactions.map(t => `
                <tr>
                    <td>${this.app.uiManager.formatDate(t.date)}</td>
                    <td>${t.type}</td>
                    <td>${this.app.uiManager.getCategoryName(t.category)}</td>
                    <td>${t.name}</td>
                    <td style="text-align: right; color: ${t.type === 'Pendapatan' ? COLORS.success : COLORS.danger};">
                        ${t.type === 'Pendapatan' ? '+' : '-'} ${this.app.calculator.formatCurrency(t.amount)}
                    </td>
                </tr>
            `).join('');
        }

        return `
            <!-- Recent Transactions -->
            <div style="margin-top: 50px;">
                <h2>💸 TRANSAKSI TERBARU</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Tipe</th>
                            <th>Kategori</th>
                            <th>Deskripsi</th>
                            <th style="text-align: right;">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    getGoalsHTML() {
        if (this.app.state.goals.length === 0) return '';

        const goalsRows = this.app.state.goals.map(goal => `
            <tr>
                <td>${goal.name}</td>
                <td>${this.app.calculator.formatCurrency(goal.target)}</td>
                <td>${this.app.calculator.formatCurrency(goal.current)}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${goal.progress}%; height: 100%; background: ${COLORS.primary};"></div>
                        </div>
                        <span>${goal.progress}%</span>
                    </div>
                </td>
                <td>${this.app.uiManager.formatDate(goal.deadline)}</td>
            </tr>
        `).join('');

        return `
            <!-- Goals Section -->
            <div style="margin-top: 50px;">
                <h2>🎯 TARGET FINANSIAL</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Nama Target</th>
                            <th>Target</th>
                            <th>Terkumpul</th>
                            <th>Progress</th>
                            <th>Deadline</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${goalsRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    getFooterHTML() {
        return `
            <!-- Footer -->
            <div class="footer">
                <p>📄 Laporan ini dibuat otomatis oleh <strong>Financial Masterplan PRO v2.0</strong></p>
                <p>© ${new Date().getFullYear()} • financialmasterplan.com</p>
            </div>
        `;
    }

    getRecentTransactions() {
        return [
            ...this.app.state.transactions.income.map(t => ({ ...t, type: 'Pendapatan' })),
            ...this.app.state.transactions.expenses.map(t => ({ ...t, type: 'Pengeluaran' }))
        ]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 15);
    }

    calculateSavingsRate() {
        if (this.app.state.finances.income === 0) return 0;
        const rate = (this.app.state.finances.savings / this.app.state.finances.income) * 100;
        return Math.round(rate * 10) / 10;
    }

    // ====== PDF GENERATION ======

    generateProfessionalPDF() {
        this.app.uiManager.showNotification('Membuat laporan PDF...', 'info');

        if (typeof jspdf === 'undefined') {
            this.loadPDFLibrary(() => {
                try {
                    this.createPDF();
                } catch (error) {
                    console.warn('Complex PDF failed, trying simple version:', error);
                    this.generateSimplePDF();
                }
            });
            return;
        }

        try {
            this.createPDF();
        } catch (error) {
            console.warn('Complex PDF failed, trying simple version:', error);
            this.generateSimplePDF();
        }
    }

    createPDF() {
        try {
            if (typeof jspdf === 'undefined') {
                throw new Error('jsPDF belum dimuat. Silakan coba lagi.');
            }

            // Handle different module loading scenarios
            const jsPDF = window.jspdf ? window.jspdf.jsPDF : (jspdf.jsPDF || jspdf);
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 15;
            let yPos = margin;

            // Header
            this.renderPDFHeader(doc, pageWidth, margin, yPos);
            yPos = 45;

            // Executive Summary
            yPos = this.renderPDFSummary(doc, pageWidth, margin, yPos);

            // Key Metrics
            yPos = this.renderPDFMetrics(doc, pageWidth, margin, yPos);

            // Recent Transactions
            yPos = this.renderPDFTransactions(doc, pageWidth, pageHeight, margin, yPos);

            // Goals Progress
            yPos = this.renderPDFGoals(doc, pageWidth, pageHeight, margin, yPos);

            // Footer
            this.renderPDFFooter(doc, pageWidth, pageHeight);

            // Save PDF
            const fileName = `Laporan_Keuangan_${this.app.state.user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.app.uiManager.showNotification('✅ Laporan PDF berhasil dibuat!', 'success');

        } catch (error) {
            console.error('Error creating PDF:', error);
            this.app.uiManager.showNotification(`Gagal membuat PDF: ${error.message}`, 'error');

            setTimeout(() => {
                this.generateSimpleReport();
            }, 1000);
        }
    }

    renderPDFHeader(doc, pageWidth, margin, yPos) {
        doc.setFillColor(67, 97, 238);
        doc.rect(0, 0, pageWidth, 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN KEUANGAN', pageWidth / 2, 12, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleDateString('id-ID', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })} ${new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        })}`, pageWidth / 2, 18, { align: 'center' });

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.text(`User: ${this.app.state.user.name}`, margin, 35);
        doc.text(`Status: ${this.app.state.user.isPremium ? 'PREMIUM' : 'STANDARD'}`,
            pageWidth - margin, 35, { align: 'right' });
    }

    renderPDFSummary(doc, pageWidth, margin, yPos) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN FINANSIAL', margin, yPos);
        yPos += 10;

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 35);

        const boxWidth = pageWidth - 2 * margin;
        const columnWidth = boxWidth / 4;

        // Income
        doc.setTextColor(6, 214, 160);
        doc.setFontSize(16);
        doc.text(String(this.app.calculator.formatCurrency(this.app.state.finances.income)),
            margin + columnWidth * 0.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Total Pendapatan', margin + columnWidth * 0.5, yPos + 17, { align: 'center' });

        // Expenses
        doc.setTextColor(239, 35, 60);
        doc.setFontSize(16);
        doc.text(String(this.app.calculator.formatCurrency(this.app.state.finances.expenses)),
            margin + columnWidth * 1.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Total Pengeluaran', margin + columnWidth * 1.5, yPos + 17, { align: 'center' });

        // Savings
        doc.setTextColor(67, 97, 238);
        doc.setFontSize(16);
        doc.text(String(this.app.calculator.formatCurrency(this.app.state.finances.savings)),
            margin + columnWidth * 2.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Total Tabungan', margin + columnWidth * 2.5, yPos + 17, { align: 'center' });

        // Savings Rate
        const savingsRate = this.calculateSavingsRate();
        doc.setTextColor(114, 9, 183);
        doc.setFontSize(14);
        doc.text(`${savingsRate}%`, margin + columnWidth * 3.5, yPos + 12, { align: 'center' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Rasio Tabungan', margin + columnWidth * 3.5, yPos + 17, { align: 'center' });

        return yPos + 45;
    }

    renderPDFMetrics(doc, pageWidth, margin, yPos) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('METRIK UTAMA', margin, yPos);
        yPos += 8;

        const metrics = [
            {
                label: 'Income Growth',
                value: `${this.calculateIncomeGrowth()}%`,
                color: { r: 6, g: 214, b: 160 }
            },
            {
                label: 'Expense Ratio',
                value: `${this.calculateExpenseRatio()}%`,
                color: { r: 239, g: 35, b: 60 }
            },
            {
                label: 'Financial Health',
                value: this.calculateFinancialHealth(),
                color: { r: 67, g: 97, b: 238 }
            },
            {
                label: 'Transactions',
                value: String(this.app.state.transactions.income.length + this.app.state.transactions.expenses.length),
                color: { r: 247, g: 37, b: 133 }
            }
        ];

        metrics.forEach((metric, index) => {
            const x = margin + (index % 2) * 90;
            const y = yPos + Math.floor(index / 2) * 15;

            doc.setTextColor(metric.color.r, metric.color.g, metric.color.b);
            doc.setFontSize(10);
            doc.text(String(metric.value), x, y);

            doc.setFontSize(7);
            doc.setTextColor(100, 116, 139);
            doc.text(metric.label, x, y + 4);
        });

        return yPos + 40;
    }

    renderPDFTransactions(doc, pageWidth, pageHeight, margin, yPos) {
        // Check if new page needed
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('TRANSAKSI TERBARU', margin, yPos);
        yPos += 8;

        // Table header
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');

        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Tanggal', margin + 2, yPos + 5);
        doc.text('Deskripsi', margin + 30, yPos + 5);
        doc.text('Kategori', margin + 90, yPos + 5);
        doc.text('Jumlah', pageWidth - margin - 20, yPos + 5, { align: 'right' });

        yPos += 9;

        // Recent transactions
        const recentTransactions = this.getRecentTransactionsForPDF();

        recentTransactions.forEach((transaction, index) => {
            if (yPos > pageHeight - 15) {
                doc.addPage();
                yPos = margin + 8;

                // Header again on new page
                doc.setFillColor(241, 245, 249);
                doc.rect(margin, yPos - 8, pageWidth - 2 * margin, 7, 'F');
                doc.setFontSize(9);
                doc.setTextColor(71, 85, 105);
                doc.text('Tanggal', margin + 2, yPos - 3);
                doc.text('Deskripsi', margin + 30, yPos - 3);
                doc.text('Kategori', margin + 90, yPos - 3);
                doc.text('Jumlah', pageWidth - margin - 20, yPos - 3, { align: 'right' });
            }

            // Alternate row colors
            if (index % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
            }

            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);

            // Date
            const date = new Date(transaction.date);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}`;
            doc.text(String(formattedDate), margin + 2, yPos + 4);

            // Description
            const description = transaction.name.length > 25
                ? transaction.name.substring(0, 22) + '...'
                : transaction.name;
            doc.text(String(description), margin + 30, yPos + 4);

            // Category
            const categoryName = this.app.uiManager.getCategoryName(transaction.category);
            doc.text(String(categoryName), margin + 90, yPos + 4);

            // Amount with color
            const amount = this.app.calculator.formatCurrency(transaction.amount);
            if (transaction.type === 'income') {
                doc.setTextColor(6, 214, 160);
            } else {
                doc.setTextColor(239, 35, 60);
            }
            doc.text(String(`${transaction.type === 'income' ? '+' : '-'} ${amount}`),
                pageWidth - margin - 2, yPos + 4, { align: 'right' });

            yPos += 6;
        });

        return yPos + 10;
    }

    renderPDFGoals(doc, pageWidth, pageHeight, margin, yPos) {
        if (this.app.state.goals.length > 0 && yPos < pageHeight - 50) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('PROGRESS TARGET', margin, yPos);
            yPos += 8;

            this.app.state.goals.slice(0, 3).forEach((goal, index) => {
                if (yPos > pageHeight - 20) {
                    doc.addPage();
                    yPos = margin;
                }

                // Goal name
                doc.setFontSize(9);
                doc.setTextColor(30, 41, 59);
                doc.text(String(goal.name), margin, yPos);

                // Progress bar background
                doc.setDrawColor(226, 232, 240);
                doc.setLineWidth(0.5);
                doc.rect(margin, yPos + 2, 80, 4);

                // Progress bar fill
                doc.setFillColor(67, 97, 238);
                doc.rect(margin, yPos + 2, 80 * (goal.progress / 100), 4, 'F');

                // Progress text
                const progressText = `${goal.progress}% • ${this.app.calculator.formatCurrency(goal.current)} / ${this.app.calculator.formatCurrency(goal.target)}`;
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text(String(progressText), margin + 85, yPos + 5);

                // Deadline
                const deadlineText = `Deadline: ${this.app.uiManager.formatDate(goal.deadline)}`;
                doc.text(String(deadlineText), margin, yPos + 12);

                yPos += 20;
            });
        }

        return yPos;
    }

    renderPDFFooter(doc, pageWidth, pageHeight) {
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);

            // Page number
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Footer text
            doc.text('Financial Masterplan PRO • www.financialmasterplan.com',
                pageWidth / 2, pageHeight - 5, { align: 'center' });
        }
    }

    getRecentTransactionsForPDF() {
        return [
            ...this.app.state.transactions.income.map(t => ({ ...t, type: 'income' })),
            ...this.app.state.transactions.expenses.map(t => ({ ...t, type: 'expense' }))
        ]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 20);
    }

    generateSimplePDF() {
        try {
            if (typeof jspdf === 'undefined') {
                this.loadPDFLibrary(() => this.generateSimplePDF());
                return;
            }

            const doc = new jspdf.jsPDF();

            // Title
            doc.setFontSize(20);
            doc.text('LAPORAN KEUANGAN', 105, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 20, 30);
            doc.text(`User: ${this.app.state.user.name}`, 20, 37);

            // Financial Summary
            doc.setFontSize(16);
            doc.text('Ringkasan Finansial', 20, 50);

            doc.setFontSize(12);
            doc.text(`Total Pendapatan: ${this.app.calculator.formatCurrency(this.app.state.finances.income)}`, 30, 60);
            doc.text(`Total Pengeluaran: ${this.app.calculator.formatCurrency(this.app.state.finances.expenses)}`, 30, 67);
            doc.text(`Total Tabungan: ${this.app.calculator.formatCurrency(this.app.state.finances.savings)}`, 30, 74);
            doc.text(`Rasio Tabungan: ${this.calculateSavingsRate()}%`, 30, 81);

            // Recent Transactions
            doc.setFontSize(16);
            doc.text('Transaksi Terbaru', 20, 95);

            let yPos = 105;
            const recentTransactions = this.getRecentTransactionsForPDF();

            doc.setFontSize(10);
            recentTransactions.forEach((t, i) => {
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 20;
                }

                const date = new Date(t.date).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit'
                });

                doc.text(`${date} ${t.name.substring(0, 30)}`, 20, yPos);
                doc.text(`${t.type === 'income' ? '+' : '-'} ${this.app.calculator.formatCurrency(t.amount)}`, 180, yPos, { align: 'right' });
                yPos += 7;
            });

            // Footer
            doc.setFontSize(8);
            doc.text('Dibuat oleh Financial Masterplan PRO', 105, 290, { align: 'center' });

            // Save
            const fileName = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            this.app.uiManager.showNotification('✅ Laporan PDF sederhana berhasil dibuat!', 'success');

        } catch (error) {
            console.error('Error in generateSimplePDF:', error);
            this.app.uiManager.showNotification('Gagal membuat PDF, mencoba format lain...', 'warning');
            this.generateSimpleReport();
        }
    }

    // ====== UTILITY METHODS ======

    loadPDFLibrary(callback) {
        this.app.uiManager.showNotification('Memuat library PDF...', 'info');

        if (window.pdfLoading) {
            setTimeout(() => {
                if (typeof jspdf !== 'undefined') {
                    callback();
                } else {
                    this.loadPDFLibrary(callback);
                }
            }, 500);
            return;
        }

        window.pdfLoading = true;

        if (document.querySelector('script[src*="jspdf"]')) {
            setTimeout(() => {
                if (typeof jspdf !== 'undefined') {
                    window.pdfLoading = false;
                    callback();
                } else {
                    this.loadPDFLibrary(callback);
                }
            }, 300);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.integrity = 'sha512-qZvrmS2ekKPF2mSznTQsxqPgnpkI4DNTlrdUmTzrDgektczlKNRRhy5X5AAOnx5S09ydFYWWNSfcEqDTTHgtNA==';
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            console.log('✅ jsPDF loaded successfully');
            window.pdfLoading = false;

            setTimeout(() => {
                if (typeof jspdf !== 'undefined') {
                    this.app.uiManager.showNotification('Library PDF siap!', 'success');
                    callback();
                } else {
                    this.app.uiManager.showNotification('Gagal memuat library PDF', 'error');
                    this.generateSimpleReport();
                }
            }, 100);
        };

        script.onerror = (error) => {
            console.error('❌ Failed to load jsPDF:', error);
            window.pdfLoading = false;
            this.app.uiManager.showNotification('Gagal memuat library PDF, menggunakan format sederhana', 'warning');

            setTimeout(() => {
                this.generateSimpleReport();
            }, 500);
        };

        document.head.appendChild(script);
    }

    generateSimpleReport() {
        console.log('📝 Generating simple text report...');

        try {
            const reportDate = new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            let reportText = '';
            reportText += '='.repeat(50) + '\n';
            reportText += 'LAPORAN KEUANGAN\n';
            reportText += '='.repeat(50) + '\n';
            reportText += `Tanggal : ${reportDate}\n`;
            reportText += `User    : ${this.app.state.user.name}\n`;
            reportText += `Status  : ${this.app.state.user.isPremium ? 'PREMIUM' : 'STANDARD'}\n`;
            reportText += '-'.repeat(50) + '\n\n';

            // Financial Summary
            reportText += 'RINGKASAN FINANSIAL\n';
            reportText += '-'.repeat(30) + '\n';
            reportText += `Total Pendapatan : ${this.app.calculator.formatCurrency(this.app.state.finances.income)}\n`;
            reportText += `Total Pengeluaran: ${this.app.calculator.formatCurrency(this.app.state.finances.expenses)}\n`;
            reportText += `Total Tabungan   : ${this.app.calculator.formatCurrency(this.app.state.finances.savings)}\n`;
            reportText += `Rasio Tabungan   : ${this.calculateSavingsRate()}%\n`;
            reportText += `Kesehatan Finansial: ${this.calculateFinancialHealth()}\n\n`;

            // Metrics
            reportText += 'METRIK UTAMA\n';
            reportText += '-'.repeat(30) + '\n';
            reportText += `Pertumbuhan Pendapatan: ${this.calculateIncomeGrowth()}%\n`;
            reportText += `Rasio Pengeluaran: ${this.calculateExpenseRatio()}%\n`;
            reportText += `Total Transaksi: ${this.app.state.transactions.income.length + this.app.state.transactions.expenses.length}\n\n`;

            // Recent Transactions
            reportText += 'TRANSAKSI TERBARU (10 terakhir)\n';
            reportText += '-'.repeat(50) + '\n';

            const recentTransactions = this.getRecentTransactionsForPDF().slice(0, 10);

            if (recentTransactions.length === 0) {
                reportText += 'Belum ada transaksi.\n';
            } else {
                recentTransactions.forEach(t => {
                    const date = new Date(t.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short'
                    });
                    const typeStr = t.type === 'income' ? 'PENDAPATAN' : 'PENGELUARAN';
                    reportText += `${date.padEnd(8)} ${typeStr.padEnd(12)} ${t.name.substring(0, 25).padEnd(27)} ${(t.type === 'income' ? '+' : '-') + this.app.calculator.formatCurrency(t.amount).padStart(15)}\n`;
                });
            }

            reportText += '\n';

            // Goals
            if (this.app.state.goals.length > 0) {
                reportText += 'TARGET FINANSIAL\n';
                reportText += '-'.repeat(50) + '\n';

                this.app.state.goals.forEach((goal, index) => {
                    reportText += `${index + 1}. ${goal.name}\n`;
                    reportText += `   Target    : ${this.app.calculator.formatCurrency(goal.target)}\n`;
                    reportText += `   Terkumpul : ${this.app.calculator.formatCurrency(goal.current)} (${goal.progress}%)\n`;
                    reportText += `   Deadline  : ${this.app.uiManager.formatDate(goal.deadline)}\n`;
                    reportText += `   ${'█'.repeat(Math.floor(goal.progress / 5))}${'░'.repeat(20 - Math.floor(goal.progress / 5))} ${goal.progress}%\n\n`;
                });
            }

            // Footer
            reportText += '='.repeat(50) + '\n';
            reportText += 'Dibuat oleh Financial Masterplan PRO v2.0\n';
            reportText += `© ${new Date().getFullYear()} - financialmasterplan.com\n`;
            reportText += '='.repeat(50) + '\n';

            // Create and download text file
            const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Keuangan_${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.app.uiManager.showNotification('✅ Report teks berhasil dibuat!', 'success');

        } catch (error) {
            console.error('Error generating simple report:', error);
            this.app.uiManager.showNotification('Gagal membuat report sederhana', 'error');
        }
    }

    calculateIncomeGrowth() {
        if (this.app.state.transactions.income.length < 2) return 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const getQuarterTotal = (monthOffset) => {
            let total = 0;
            for (let i = 0; i < 3; i++) {
                const targetMonth = currentMonth - monthOffset - i;
                const targetYear = currentYear - (targetMonth < 0 ? 1 : 0);
                const actualMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;

                total += this.app.state.transactions.income.reduce((sum, transaction) => {
                    try {
                        const date = new Date(transaction.date);
                        if (date.getMonth() === actualMonth && date.getFullYear() === targetYear) {
                            return sum + transaction.amount;
                        }
                    } catch (e) { }
                    return sum;
                }, 0);
            }
            return total;
        };

        const currentQuarter = getQuarterTotal(0);
        const previousQuarter = getQuarterTotal(3);

        if (previousQuarter === 0) return 100;

        const growth = ((currentQuarter - previousQuarter) / previousQuarter) * 100;
        return Math.round(growth * 10) / 10;
    }

    calculateExpenseRatio() {
        if (this.app.state.finances.income === 0) return 0;
        const ratio = (this.app.state.finances.expenses / this.app.state.finances.income) * 100;
        return Math.round(ratio * 10) / 10;
    }

    calculateFinancialHealth() {
        const savingsRate = this.calculateSavingsRate();
        const expenseRatio = this.calculateExpenseRatio();

        if (savingsRate >= 20 && expenseRatio <= 60) return 'EXCELLENT';
        if (savingsRate >= 15 && expenseRatio <= 70) return 'GOOD';
        if (savingsRate >= 10 && expenseRatio <= 80) return 'FAIR';
        if (savingsRate >= 5 && expenseRatio <= 90) return 'NEEDS IMPROVEMENT';
        return 'CRITICAL';
    }

    // ====== EXPORT METHODS ======

    exportData(format = 'json') {
        switch (format) {
            case 'json':
                this.exportToJSON();
                break;
            case 'csv':
                this.exportToCSV();
                break;
            case 'pdf':
                this.generateProfessionalPDF();
                break;
        }
    }

    exportToJSON() {
        const dataStr = JSON.stringify(this.app.state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `financial-data-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.app.uiManager.showNotification('✅ Data berhasil diexport ke JSON!', 'success');
    }

    exportToCSV() {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";

            // Header
            csvContent += "Tipe,Nama,Jumlah,Kategori,Tanggal,ID\n";

            // Income transactions
            this.app.state.transactions.income.forEach(transaction => {
                const row = [
                    'Income',
                    `"${transaction.name}"`,
                    transaction.amount,
                    transaction.category,
                    transaction.date,
                    transaction.id
                ].join(',');
                csvContent += row + "\n";
            });

            // Expense transactions
            this.app.state.transactions.expenses.forEach(transaction => {
                const row = [
                    'Expense',
                    `"${transaction.name}"`,
                    transaction.amount,
                    transaction.category,
                    transaction.date,
                    transaction.id
                ].join(',');
                csvContent += row + "\n";
            });

            // Goals
            csvContent += "\n\nGOALS\n";
            csvContent += "Nama,Target,Terkumpul,Progress,Deadline,ID\n";
            this.app.state.goals.forEach(goal => {
                const row = [
                    `"${goal.name}"`,
                    goal.target,
                    goal.current,
                    `${goal.progress}%`,
                    goal.deadline,
                    goal.id
                ].join(',');
                csvContent += row + "\n";
            });

            // Checklist
            csvContent += "\n\nCHECKLIST\n";
            csvContent += "Task,Completed,CreatedAt,ID\n";
            this.app.state.checklist.forEach(task => {
                const row = [
                    `"${task.task}"`,
                    task.completed ? 'Yes' : 'No',
                    task.created || '',
                    task.id
                ].join(',');
                csvContent += row + "\n";
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `financial-data-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.app.uiManager.showNotification('✅ Data berhasil diexport ke CSV!', 'success');

        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.app.uiManager.showNotification('Gagal export ke CSV', 'error');
        }
    }
}

export default ReportGenerator;