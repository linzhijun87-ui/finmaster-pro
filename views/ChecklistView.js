/* ====== CHECKLIST VIEW MODULE ====== */

class ChecklistView {
    constructor(app) {
        this.app = app;
    }

    // NEW ARCHITECTURE: Return HTML string only
    getHtml() {
        console.log('✅ Getting Checklist View HTML...');
        return this.getChecklistHTML();
    }

    // NEW ARCHITECTURE: Initialize after DOM injection
    afterRender() {
        console.log('✅ Checklist View rendered, initializing...');
        this.initialize();
    }

    // Legacy render support (deprecated)
    render() {
        console.warn('⚠️ using legacy render on ChecklistView');
        const html = this.getHtml();
        this.app.elements.mainContent.innerHTML = html;
        this.app.elements.mainContent.className = 'main-content checklist-view';
        setTimeout(() => this.afterRender(), 50);
    }

    getChecklistHTML() {
        const totalTasks = this.app.state.checklist.length;
        const completedTasks = this.app.state.checklist.filter(t => t.completed).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const remainingTasks = totalTasks - completedTasks;

        return `
            <div class="section-title">✅ Checklist Keuangan</div>
            
            <div class="stats-grid" style="margin-bottom: var(--space-6);">
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Total Tugas</div>
                            <div class="stat-value" id="totalTasksCount">${totalTasks}</div>
                        </div>
                        <div class="stat-icon">📋</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Selesai</div>
                            <div class="stat-value" id="completedTasksCount">${completedTasks}</div>
                        </div>
                        <div class="stat-icon">✅</div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div>
                            <div class="text-muted mb-2">Progress</div>
                            <div class="stat-value" id="tasksProgress">${progress}%</div>
                        </div>
                        <div class="stat-icon">📈</div>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions mb-6">
                <h3 class="section-title">Tambah Tugas Baru</h3>
                <div style="display: flex; gap: var(--space-4); margin-top: var(--space-4);">
                    <input type="text" id="newChecklistTask" placeholder="Masukkan tugas baru..." 
                        style="flex: 1; padding: var(--space-3) var(--space-4); border: 2px solid var(--border-color); border-radius: var(--radius-md);">
                    <button class="btn" id="addChecklistBtn">
                        <span>➕</span> Tambah
                    </button>
                </div>
            </div>
            
            <div class="activity-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
                    <h3 class="section-title">Daftar Tugas</h3>
                    <div class="text-muted" id="remainingTasksCount">
                        ${remainingTasks} tugas tersisa
                    </div>
                </div>
                
                <div id="checklistItems">
                    ${this.getChecklistItemsHTML()}
                </div>
                
                ${completedTasks > 0 ? this.getCompletedSectionHTML() : ''}
            </div>
            
            <!-- Quick Templates -->
            ${this.getTemplatesHTML()}
        `;
    }

    getChecklistItemsHTML() {
        const incompleteTasks = this.app.state.checklist.filter(task => !task.completed);

        if (incompleteTasks.length === 0) {
            return '<div class="text-center text-muted mt-6">Semua tugas selesai! 🎉</div>';
        }

        return incompleteTasks.map(task => `
            <div class="activity-item" data-task-id="${task.id}">
                <div class="activity-icon" style="cursor: pointer;" onclick="app.toggleChecklistTask(${task.id})">
                    ${task.completed ? '✅' : '⭕'}
                </div>
                <div class="activity-details">
                    <div class="activity-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                        ${task.task}
                    </div>
                    <div class="activity-meta">
                        <span>Created: ${this.app.uiManager.formatDate(task.created || new Date().toISOString())}</span>
                    </div>
                </div>
                <button class="btn-outline btn-delete btn-delete-sm" 
                        onclick="app.deleteChecklistTask(${task.id})">
                    Hapus
                </button>
            </div>
        `).join('');
    }

    getCompletedSectionHTML() {
        const completedTasks = this.app.state.checklist.filter(task => task.completed);

        const completedItemsHTML = completedTasks.map(task => `
            <div class="activity-item" style="opacity: 0.7;" data-task-id="${task.id}">
                <div class="activity-icon" style="cursor: pointer; background: var(--success);" onclick="app.toggleChecklistTask(${task.id})">
                    ✅
                </div>
                <div class="activity-details">
                    <div class="activity-title" style="text-decoration: line-through;">
                        ${task.task}
                    </div>
                    <div class="activity-meta">
                        <span>Selesai: ${this.app.uiManager.formatDate(task.completedAt || new Date().toISOString())}</span>
                    </div>
                </div>
                <button class="btn-outline" style="margin-left: auto; font-size: 0.875rem;" 
                        onclick="app.deleteChecklistTask(${task.id})">
                    Hapus
                </button>
            </div>
        `).join('');

        return `
            <div style="margin-top: var(--space-6);">
                <h4 style="margin-bottom: var(--space-4); color: var(--text-muted);">Tugas Selesai</h4>
                <div id="completedChecklistItems">
                    ${completedItemsHTML}
                </div>
            </div>
        `;
    }

    getTemplatesHTML() {
        return `
            <div class="activity-section mt-6">
                <h3 class="section-title">Template Cepat</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
                    <button class="btn-outline" onclick="app.addTemplateChecklist('Bulanan')">
                        📅 Tugas Bulanan
                    </button>
                    <button class="btn-outline" onclick="app.addTemplateChecklist('Mingguan')">
                        📆 Tugas Mingguan
                    </button>
                    <button class="btn-outline" onclick="app.addTemplateChecklist('Investasi')">
                        💰 Tugas Investasi
                    </button>
                    <button class="btn-outline" onclick="app.clearCompletedTasks()">
                        🗑️ Hapus Selesai
                    </button>
                </div>
            </div>
        `;
    }

    initialize() {
        // Add task button
        document.getElementById('addChecklistBtn')?.addEventListener('click', () => {
            this.addChecklistTask();
        });

        // Enter key support
        document.getElementById('newChecklistTask')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addChecklistTask();
            }
        });

        // Template buttons
        document.querySelectorAll('[onclick*="addTemplateChecklist"]').forEach(btn => {
            btn.onclick = (e) => {
                const type = e.target.textContent.includes('Bulanan') ? 'Bulanan' :
                    e.target.textContent.includes('Mingguan') ? 'Mingguan' : 'Investasi';
                this.addTemplateChecklist(type);
            };
        });

        // Clear completed tasks button
        document.querySelector('[onclick*="clearCompletedTasks"]')?.addEventListener('click', () => {
            this.clearCompletedTasks();
        });
    }

    addChecklistTask() {
        const input = document.getElementById('newChecklistTask');
        const task = input?.value.trim();

        if (!task) {
            this.app.uiManager.showNotification('Masukkan tugas terlebih dahulu', 'error');
            return;
        }

        this.app.addChecklistTask(task);
        input.value = '';
    }

    addTemplateChecklist(type) {
        const templates = {
            'Bulanan': [
                'Bayar tagihan listrik',
                'Bayar tagihan air',
                'Bayar internet/streaming',
                'Transfer tabungan bulanan',
                'Review budget bulan lalu'
            ],
            'Mingguan': [
                'Catat pengeluaran mingguan',
                'Transfer dana darurat',
                'Cek portofolio investasi',
                'Plan meal prep untuk hemat'
            ],
            'Investasi': [
                'Research saham baru',
                'Review reksadana',
                'Analisis return investasi',
                'Diversifikasi portofolio'
            ]
        };

        const tasks = templates[type] || [];
        let addedCount = 0;

        tasks.forEach(taskText => {
            // Check if task already exists
            if (!this.app.state.checklist.some(t => t.task === taskText)) {
                this.app.addChecklistTask(taskText);
                addedCount++;
            }
        });

        this.app.uiManager.showNotification(`✅ ${addedCount} tugas ${type} ditambahkan!`, 'success');
    }

    clearCompletedTasks() {
        const completedCount = this.app.state.checklist.filter(t => t.completed).length;

        if (completedCount === 0) {
            this.app.uiManager.showNotification('Tidak ada tugas selesai', 'info');
            return;
        }

        if (confirm(`Hapus ${completedCount} tugas yang sudah selesai?`)) {
            this.app.state.checklist = this.app.state.checklist.filter(t => !t.completed);
            this.app.dataManager.saveData(true);
            this.refresh();

            this.app.uiManager.showNotification(`${completedCount} tugas dihapus!`, 'success');
        }
    }

    refresh() {
        // Update checklist items
        const checklistItemsEl = document.getElementById('checklistItems');
        if (checklistItemsEl) {
            checklistItemsEl.innerHTML = this.getChecklistItemsHTML();
        }

        // Update completed section
        const completedSection = document.getElementById('completedChecklistItems');
        const completedTasks = this.app.state.checklist.filter(t => t.completed);

        if (completedTasks.length > 0) {
            if (!completedSection) {
                // Add completed section
                const completedHTML = this.getCompletedSectionHTML();
                checklistItemsEl.insertAdjacentHTML('afterend', completedHTML);
            } else {
                completedSection.innerHTML = completedTasks.map(task => `
                    <div class="activity-item" style="opacity: 0.7;" data-task-id="${task.id}">
                        <div class="activity-icon" style="cursor: pointer; background: var(--success);" onclick="app.toggleChecklistTask(${task.id})">
                            ✅
                        </div>
                        <div class="activity-details">
                            <div class="activity-title" style="text-decoration: line-through;">
                                ${task.task}
                            </div>
                            <div class="activity-meta">
                                <span>Selesai: ${this.app.uiManager.formatDate(task.completedAt || new Date().toISOString())}</span>
                            </div>
                        </div>
                        <button class="btn-outline" style="margin-left: auto; font-size: 0.875rem;" 
                                onclick="app.deleteChecklistTask(${task.id})">
                            Hapus
                        </button>
                    </div>
                `).join('');
            }
        } else {
            // Remove completed section if no completed tasks
            const completedSectionParent = document.getElementById('completedChecklistItems')?.parentElement;
            if (completedSectionParent) {
                completedSectionParent.remove();
            }
        }

        // Update stats
        this.updateStats();
    }

    updateStats() {
        const total = this.app.state.checklist.length;
        const completed = this.app.state.checklist.filter(t => t.completed).length;
        const remaining = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Update stat values
        const totalTasksEl = document.getElementById('totalTasksCount');
        const completedTasksEl = document.getElementById('completedTasksCount');
        const progressEl = document.getElementById('tasksProgress');
        const remainingTasksEl = document.getElementById('remainingTasksCount');

        if (totalTasksEl) totalTasksEl.textContent = total;
        if (completedTasksEl) completedTasksEl.textContent = completed;
        if (progressEl) progressEl.textContent = `${percentage}%`;
        if (remainingTasksEl) remainingTasksEl.textContent = `${remaining} tugas tersisa`;
    }
}

export default ChecklistView;