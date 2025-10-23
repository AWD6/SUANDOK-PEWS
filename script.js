let scores = {
    behavior: 0,
    cardiovascular: 0,
    respiratory: 0,
    additionalRisk: false
};

let records = [];

function initializeApp() {
    const scoreButtons = document.querySelectorAll('.score-btn');
    scoreButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            const score = parseInt(this.dataset.score);

            document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
                btn.classList.remove('active');
            });

            this.classList.add('active');
            scores[category] = score;
            updateTotalScore();
        });
    });

    const additionalRiskCheckbox = document.getElementById('additionalRisk');
    additionalRiskCheckbox.addEventListener('change', function() {
        scores.additionalRisk = this.checked;
        updateTotalScore();
    });

    updateTotalScore();
}

function updateTotalScore() {
    const total = scores.behavior + scores.cardiovascular + scores.respiratory + (scores.additionalRisk ? 2 : 0);

    document.getElementById('scoreValue').textContent = total;

    const totalScoreElement = document.getElementById('totalScore');
    const recommendationElement = document.getElementById('recommendation');

    totalScoreElement.classList.remove('level-low', 'level-medium', 'level-high');

    if (total <= 1) {
        totalScoreElement.classList.add('level-low');
        recommendationElement.textContent = 'เฝ้าระวัง ทุก 12 ชั่วโมง';
    } else if (total <= 3) {
        totalScoreElement.classList.add('level-medium');
        recommendationElement.textContent = 'เฝ้าระวัง ทุก 4 ชั่วโมง';
    } else {
        totalScoreElement.classList.add('level-high');
        recommendationElement.textContent = 'รายงานพยาบาล และพยาบาลประเมินซ้ำ';
    }
}

function saveRecord(action) {
    const nursing = document.getElementById('nursing').value;
    const symptomsChangedRadio = document.querySelector('input[name="symptomsChanged"]:checked');
    const symptomsChanged = symptomsChangedRadio ? symptomsChangedRadio.value : 'no';

    const total = scores.behavior + scores.cardiovascular + scores.respiratory + (scores.additionalRisk ? 2 : 0);

    const record = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        score: total,
        nursing: nursing,
        symptomsChanged: symptomsChanged,
        action: action
    };

    records.unshift(record);
    displayRecords();
    resetForm();
}

function displayRecords() {
    const recordsHistory = document.getElementById('recordsHistory');
    const recordsList = document.getElementById('recordsList');

    if (records.length === 0) {
        recordsHistory.style.display = 'none';
        return;
    }

    recordsHistory.style.display = 'block';

    recordsList.innerHTML = records.map(record => `
        <div class="record-item">
            <div class="record-header">
                <div class="record-timestamp">${record.timestamp}</div>
                <div class="record-action action-${record.action.toLowerCase()}">${record.action}</div>
            </div>
            <div class="record-details">
                <div><strong>PEWS Score:</strong> ${record.score}</div>
                <div><strong>อาการเปลี่ยนแปลง:</strong> ${record.symptomsChanged === 'yes' ? 'มี' : 'ไม่มี'}</div>
            </div>
            ${record.nursing ? `<div class="record-nursing"><strong>การพยาบาล:</strong> ${record.nursing}</div>` : ''}
        </div>
    `).join('');
}

function resetForm() {
    scores = {
        behavior: 0,
        cardiovascular: 0,
        respiratory: 0,
        additionalRisk: false
    };

    document.querySelectorAll('.score-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById('additionalRisk').checked = false;
    document.getElementById('nursing').value = '';
    document.querySelector('input[name="symptomsChanged"][value="no"]').checked = true;

    updateTotalScore();
}

document.addEventListener('DOMContentLoaded', initializeApp);
