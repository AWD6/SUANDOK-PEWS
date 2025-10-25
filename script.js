const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJib2x0IiwicmVmIjoiMGVjOTBiNTdkNmU5NWZjYmRhMTk4MzJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODE1NzQsImV4cCI6MTc1ODg4MTU3NH0.9I8-U0x86Ak8t2DGaIk0HfvTSLsAyzdnz-Nw00mMkKw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let scores = {
    behavior: null,
    cardiovascular: null,
    respiratory: null,
    additionalRisk: false
};

let symptomsChanged = 'no';

function initializeApp() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    scoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.closest('.button-grid').dataset.category;
            const score = parseInt(this.dataset.score);

            const categoryButtons = this.closest('.button-grid').querySelectorAll('.score-btn');

            if (this.classList.contains('active')) {
                this.classList.remove('active');
                scores[category] = null;
            } else {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                scores[category] = score;
            }

            updateTotalScore();
        });
    });

    const additionalRiskCheckbox = document.getElementById('additionalRisk');
    additionalRiskCheckbox.addEventListener('change', function() {
        scores.additionalRisk = this.checked;
        updateTotalScore();
    });

    const symptomButtons = document.querySelectorAll('.symptom-btn');
    symptomButtons.forEach(button => {
        button.addEventListener('click', function() {
            symptomButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            symptomsChanged = this.dataset.value;
        });
    });

    updateTotalScore();
    loadRecords();
}

function calculateTotal() {
    const behaviorScore = scores.behavior ?? 0;
    const cardiovascularScore = scores.cardiovascular ?? 0;
    const respiratoryScore = scores.respiratory ?? 0;
    const additionalScore = scores.additionalRisk ? 2 : 0;
    return behaviorScore + cardiovascularScore + respiratoryScore + additionalScore;
}

function updateTotalScore() {
    const total = calculateTotal();
    document.getElementById('scoreValue').textContent = total;

    const totalScoreElement = document.getElementById('totalScore');
    const recommendationElement = document.getElementById('recommendation');

    totalScoreElement.classList.remove('level-low', 'level-medium', 'level-high');

    let recommendation = '';
    if (total <= 1) {
        totalScoreElement.classList.add('level-low');
        recommendation = 'เฝ้าระวัง ทุก 12 ชั่วโมง';
    } else if (total <= 3) {
        totalScoreElement.classList.add('level-medium');
        recommendation = 'เฝ้าระวัง ทุก 4 ชั่วโมง';
    } else {
        totalScoreElement.classList.add('level-high');
        recommendation = 'รายงานพยาบาล และพยาบาลประเมินซ้ำ';
    }

    recommendationElement.textContent = recommendation;
    document.getElementById('nursing').value = recommendation;
}

async function saveRecord(action) {
    const hn = document.getElementById('hnInput').value.trim();
    const nursing = document.getElementById('nursing').value;
    const total = calculateTotal();

    try {
        const { error } = await supabase.from('pews_records').insert({
            hn: hn || 'ไม่ระบุ',
            behavior_score: scores.behavior ?? 0,
            cardiovascular_score: scores.cardiovascular ?? 0,
            respiratory_score: scores.respiratory ?? 0,
            additional_risk: scores.additionalRisk,
            total_score: total,
            nursing_notes: nursing,
            symptoms_changed: symptomsChanged,
            action: action
        });

        if (error) throw error;

        await loadRecords();
        resetForm();
    } catch (error) {
        console.error('Error saving record:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
}

async function loadRecords() {
    try {
        const { data, error } = await supabase
            .from('pews_records')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        displayRecords(data || []);
    } catch (error) {
        console.error('Error loading records:', error);
    }
}

function displayRecords(records) {
    const recordsHistory = document.getElementById('recordsHistory');
    const recordsList = document.getElementById('recordsList');

    if (records.length === 0) {
        recordsHistory.style.display = 'none';
        return;
    }

    recordsHistory.style.display = 'block';

    recordsList.innerHTML = records.map(record => {
        const timestamp = new Date(record.timestamp).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `
            <div class="record-item">
                <div class="record-header">
                    <div class="record-info">
                        <div class="record-timestamp">${timestamp}</div>
                        <div class="record-hn">HN: ${record.hn}</div>
                    </div>
                    <div class="record-actions">
                        <div class="record-action action-${record.action.toLowerCase()}">${record.action}</div>
                        <button class="delete-btn" onclick="deleteRecord('${record.id}')">
                            <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="record-details">
                    <div><strong>PEWS Score:</strong> <span style="color: #3b82f6; font-weight: 600;">${record.total_score}</span></div>
                    <div><strong>อาการเปลี่ยนแปลง:</strong> ${record.symptoms_changed === 'yes' ? 'มี' : 'ไม่มี'}</div>
                </div>
                ${record.nursing_notes ? `
                    <div class="record-nursing">
                        <strong>การพยาบาล:</strong> ${record.nursing_notes}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function deleteRecord(id) {
    if (!confirm('ต้องการลบรายการนี้หรือไม่?')) return;

    try {
        const { error } = await supabase
            .from('pews_records')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await loadRecords();
    } catch (error) {
        console.error('Error deleting record:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
}

function resetForm() {
    scores = {
        behavior: null,
        cardiovascular: null,
        respiratory: null,
        additionalRisk: false
    };

    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('additionalRisk').checked = false;
    document.getElementById('hnInput').value = '';
    document.getElementById('nursing').value = '';

    const symptomButtons = document.querySelectorAll('.symptom-btn');
    symptomButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.symptom-btn[data-value="no"]').classList.add('active');
    symptomsChanged = 'no';

    updateTotalScore();
}

document.addEventListener('DOMContentLoaded', initializeApp);
