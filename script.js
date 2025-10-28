
// Data structure for vital signs reference
const vitalSignsReference = {
    newborn: {
        hr: { min: 100, max: 180 },
        rr: { min: 30, max: 60 }
    },
    infant: {
        hr: { min: 100, max: 160 },
        rr: { min: 30, max: 60 }
    },
    child: {
        hr: { min: 80, max: 140 },
        rr: { min: 20, max: 40 }
    },
    older: {
        hr: { min: 70, max: 120 },
        rr: { min: 15, max: 30 }
    }
};

// State management
let state = {
    ageGroup: null,
    scores: {
        behavior: null,
        cardiovascular: null,
        respiratory: null,
        additionalRisk: 0
    },
    patientInfo: {
        hn: '',
        an: '',
        name: ''
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadRecords();
});

function setupEventListeners() {
    // Age selection
    document.querySelectorAll('.age-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectAge(this.dataset.age);
        });
    });

    // Behavior scoring
    document.querySelectorAll('[data-category="behavior"]').forEach(btn => {
        btn.addEventListener('click', function() {
            selectScore('behavior', parseInt(this.dataset.score));
        });
    });

    // Additional risk checkboxes
    ['postOp', 'chronicDisease', 'trauma'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateAdditionalRisk);
    });

    // Save and reset buttons
    document.getElementById('saveBtn').addEventListener('click', saveRecord);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
}

function selectAge(ageGroup) {
    state.ageGroup = ageGroup;
    
    // Update UI
    document.querySelectorAll('.age-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.age === ageGroup);
    });

    // Generate cardiovascular buttons
    generateCardiovascularButtons(ageGroup);
    generateRespiratoryButtons(ageGroup);
    
    updateTotalScore();
}

function generateCardiovascularButtons(ageGroup) {
    const container = document.getElementById('cardiovascularButtons');
    const ref = vitalSignsReference[ageGroup];
    
    container.innerHTML = `
        <button class="score-btn" data-category="cardiovascular" data-score="0">
            0 - HR ${ref.hr.min}-${ref.hr.max}, Pink, CRT 1-2 sec
        </button>
        <button class="score-btn" data-category="cardiovascular" data-score="1">
            1 - HR ${ref.hr.min - 20}-${ref.hr.min - 1} หรือ ${ref.hr.max + 1}-${ref.hr.max + 20}, Pale/mottled, CRT 3 sec
        </button>
        <button class="score-btn" data-category="cardiovascular" data-score="2">
            2 - HR ${ref.hr.min - 40}-${ref.hr.min - 21} หรือ ${ref.hr.max + 21}-${ref.hr.max + 40}, Gray/Mottled, CRT 4 sec
        </button>
        <button class="score-btn" data-category="cardiovascular" data-score="3">
            3 - HR <${ref.hr.min - 40} หรือ >${ref.hr.max + 40}, Gray/Mottled, CRT ≥5 sec
        </button>
    `;

    container.querySelectorAll('.score-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectScore('cardiovascular', parseInt(this.dataset.score));
        });
    });
}

function generateRespiratoryButtons(ageGroup) {
    const container = document.getElementById('respiratoryButtons');
    const ref = vitalSignsReference[ageGroup];
    
    container.innerHTML = `
        <button class="score-btn" data-category="respiratory" data-score="0">
            0 - RR ${ref.rr.min}-${ref.rr.max}, ไม่มี recession, SpO₂ >95% ใน room air
        </button>
        <button class="score-btn" data-category="respiratory" data-score="1">
            1 - RR ${ref.rr.min - 10}-${ref.rr.min - 1} หรือ ${ref.rr.max + 1}-${ref.rr.max + 10}, มี recession, SpO₂ >95% ใน O₂
        </button>
        <button class="score-btn" data-category="respiratory" data-score="2">
            2 - RR ${ref.rr.min - 20}-${ref.rr.min - 11} หรือ ${ref.rr.max + 11}-${ref.rr.max + 20}, มี recession + grunting, SpO₂ 90-95%
        </button>
        <button class="score-btn" data-category="respiratory" data-score="3">
            3 - RR <${ref.rr.min - 20} หรือ >${ref.rr.max + 20} หรือ Apnea, SpO₂ <90%
        </button>
    `;

    container.querySelectorAll('.score-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectScore('respiratory', parseInt(this.dataset.score));
        });
    });
}

function selectScore(category, score) {
    state.scores[category] = score;
    
    // Update UI
    document.querySelectorAll(`[data-category="${category}"]`).forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.score) === score);
    });
    
    updateTotalScore();
}

function updateAdditionalRisk() {
    const postOp = document.getElementById('postOp').checked ? 2 : 0;
    const chronicDisease = document.getElementById('chronicDisease').checked ? 2 : 0;
    const trauma = document.getElementById('trauma').checked ? 2 : 0;
    
    state.scores.additionalRisk = postOp + chronicDisease + trauma;
    updateTotalScore();
}

function updateTotalScore() {
    const { behavior, cardiovascular, respiratory, additionalRisk } = state.scores;
    
    const total = (behavior || 0) + (cardiovascular || 0) + (respiratory || 0) + additionalRisk;
    
    document.getElementById('totalScore').textContent = total;
    
    let level, recommendation, color;
    if (total === 0) {
        level = 'ปกติ';
        recommendation = 'ไม่ต้องดำเนินการพิเศษ';
        color = '#10b981';
    } else if (total <= 2) {
        level = 'Low Risk';
        recommendation = 'ติดตามอาการทุก 4-6 ชั่วโมง';
        color = '#f59e0b';
    } else if (total <= 4) {
        level = 'Medium Risk';
        recommendation = 'แจ้งแพทย์และติดตามอาการทุก 2-4 ชั่วโมง';
        color = '#ef4444';
    } else {
        level = 'High Risk';
        recommendation = 'แจ้งแพทย์ทันทีและพิจารณาย้าย ICU';
        color = '#dc2626';
    }
    
    document.getElementById('scoreLevel').textContent = level;
    document.getElementById('recommendation').textContent = recommendation;
    document.querySelector('.total-score-card').style.background = 
        `linear-gradient(135deg, ${color} 0%, ${adjustColor(color, -20)} 100%)`;
}

function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

function saveRecord() {
    const hn = document.getElementById('hn').value.trim();
    const an = document.getElementById('an').value.trim();
    const name = document.getElementById('patientName').value.trim();
    
    if (!hn || !name) {
        alert('กรุณากรอก HN และชื่อ-สกุล');
        return;
    }
    
    if (!state.ageGroup) {
        alert('กรุณาเลือกช่วงอายุ');
        return;
    }
    
    const record = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        hn,
        an,
        name,
        ageGroup: state.ageGroup,
        scores: { ...state.scores },
        totalScore: (state.scores.behavior || 0) + (state.scores.cardiovascular || 0) + 
                   (state.scores.respiratory || 0) + state.scores.additionalRisk
    };
    
    const records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    records.unshift(record);
    localStorage.setItem('pewsRecords', JSON.stringify(records));
    
    alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    loadRecords();
}

function loadRecords() {
    const records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    const container = document.getElementById('recordsList');
    
    if (records.length === 0) {
        container.innerHTML = '<div class="empty-records">ยังไม่มีข้อมูลการบันทึก</div>';
        return;
    }
    
    container.innerHTML = records.map(record => {
        const date = new Date(record.timestamp);
        const dateStr = date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="record-item">
                <div class="record-header">
                    <span class="record-hn">HN: ${record.hn} - ${record.name}</span>
                    <span class="record-time">${dateStr}</span>
                </div>
                <div class="record-score">คะแนนรวม: ${record.totalScore}</div>
            </div>
        `;
    }).join('');
}

function resetForm() {
    if (!confirm('ต้องการรีเซ็ตฟอร์มใช่หรือไม่?')) {
        return;
    }
    
    state = {
        ageGroup: null,
        scores: {
            behavior: null,
            cardiovascular: null,
            respiratory: null,
            additionalRisk: 0
        },
        patientInfo: {
            hn: '',
            an: '',
            name: ''
        }
    };
    
    document.getElementById('hn').value = '';
    document.getElementById('an').value = '';
    document.getElementById('patientName').value = '';
    
    document.querySelectorAll('.age-btn, .score-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    document.getElementById('cardiovascularButtons').innerHTML = '';
    document.getElementById('respiratoryButtons').innerHTML = '';
    
    updateTotalScore();
}
