
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

function saveRecord(action) {
    const hn = document.getElementById('hnInput').value.trim();
    const nursing = document.getElementById('nursing').value;
    const total = calculateTotal();

    const record = {
        id: Date.now().toString(),
        hn: hn || 'ไม่ระบุ',
        behaviorScore: scores.behavior ?? 0,
        cardiovascularScore: scores.cardiovascular ?? 0,
        respiratoryScore: scores.respiratory ?? 0,
        additionalRisk: scores.additionalRisk,
        totalScore: total,
        nursingNotes: nursing,
        symptomsChanged: symptomsChanged,
        action: action,
        createdAt: new Date().toISOString()
    };

    // ดึงข้อมูลเดิมจาก LocalStorage
    let records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    
    // เพิ่มข้อมูลใหม่
    records.unshift(record);
    
    // บันทึกกลับเข้า LocalStorage
    localStorage.setItem('pewsRecords', JSON.stringify(records));

    loadRecords();
    resetForm();
    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
}

function loadRecords() {
    const records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    displayRecords(records);
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
        const timestamp = new Date(record.createdAt).toLocaleString('th-TH', {
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
                    <div><strong>PEWS Score:</strong> <span style="color: #3b82f6; font-weight: 600;">${record.totalScore}</span></div>
                    <div><strong>อาการเปลี่ยนแปลง:</strong> ${record.symptomsChanged === 'yes' ? 'มี' : 'ไม่มี'}</div>
                </div>
                ${record.nursingNotes ? `
                    <div class="record-nursing">
                        <strong>การพยาบาล:</strong> ${record.nursingNotes}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function deleteRecord(id) {
    if (!confirm('ต้องการลบรายการนี้หรือไม่?')) return;

    let records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    records = records.filter(record => record.id !== id);
    localStorage.setItem('pewsRecords', JSON.stringify(records));

    loadRecords();
    alert('ลบรายการเรียบร้อยแล้ว');
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
