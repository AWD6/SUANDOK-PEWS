// Age groups data
const ageGroups = [
    {
        id: 'newborn',
        name: 'Newborn',
        ageRange: 'แรกเกิด-1 เดือน',
        heartRate: { min: 100, max: 180 },
        respiratoryRate: { min: 40, max: 60 }
    },
    {
        id: 'infant',
        name: 'Infant',
        ageRange: '1-12 เดือน',
        heartRate: { min: 100, max: 180 },
        respiratoryRate: { min: 35, max: 40 }
    },
    {
        id: 'toddler',
        name: 'Toddler',
        ageRange: '13 เดือน - 3 ปี',
        heartRate: { min: 70, max: 110 },
        respiratoryRate: { min: 25, max: 30 }
    },
    {
        id: 'preschool',
        name: 'Preschool',
        ageRange: '4-6 ปี',
        heartRate: { min: 70, max: 110 },
        respiratoryRate: { min: 21, max: 23 }
    },
    {
        id: 'schoolage',
        name: 'School age',
        ageRange: '7-12 ปี',
        heartRate: { min: 70, max: 110 },
        respiratoryRate: { min: 19, max: 21 }
    },
    {
        id: 'adolescent',
        name: 'Adolescent',
        ageRange: '13-19 ปี',
        heartRate: { min: 55, max: 90 },
        respiratoryRate: { min: 16, max: 18 }
    }
];

// Behavior options
const behaviorOptions = [
    { score: 0, label: "เล่นเหมาะสม" },
    { score: 1, label: "หลับ" },
    { score: 2, label: "ร้องไห้งอแง พักไม่ได้" },
    { score: 3, label: "ซึม/สับสน หรือ ตอบสนองต่อการกระตุ้นความปวดลดลง" }
];

// State
let state = {
    ageGroup: null,
    behaviorScore: null,
    cardiovascularScore: null,
    respiratoryScore: null,
    additionalRisk: false,
    hn: '',
    location: '',
    locationOther: '',
    nursingNotes: '',
    symptomsChanged: 'no',
    transferDestination: '',
    transferDestinationOther: '',
    prValue: '',
    rrValue: '',
    temperature: '',
    pulse: '',
    rrVitalSign: '',
    bloodPressure: '',
    spo2: '',
    parentRecordId: null,
    isReassessment: false,
    chdType: '',
    palsEnabled: false,
    records: []
};

// Flag สำหรับป้องกันการบันทึกซ้ำ
let isSavingRecord = false;
let lastSaveTime = 0;
const SAVE_COOLDOWN = 2000;
const submittedRecordIds = new Set(); 

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadRecords();
    renderAgeGrid();
    renderBehaviorGrid();
    renderCardiovascularGrid();
    renderRespiratoryGrid();
    updateTotalScore();
    renderRecords();

    // Event listeners
    document.getElementById('hn-input-top').addEventListener('input', (e) => {
        state.hn = e.target.value;
    });

    document.getElementById('location-select').addEventListener('change', (e) => {
        state.location = e.target.value;
        const otherInput = document.getElementById('location-other');
        if (e.target.value === 'อื่นๆ') {
            otherInput.style.display = 'block';
        } else {
            otherInput.style.display = 'none';
            state.locationOther = '';
            otherInput.value = '';
        }
    });

    document.getElementById('location-other').addEventListener('input', (e) => {
        state.locationOther = e.target.value;
    });

    document.getElementById('nursing-notes').addEventListener('input', (e) => {
        state.nursingNotes = e.target.value;
    });

    // Transfer destination dropdown handler
    document.getElementById('transfer-destination-select').addEventListener('change', (e) => {
        state.transferDestination = e.target.value;
        const otherInput = document.getElementById('transfer-destination-other');
        if (e.target.value === 'อื่นๆ') {
            otherInput.style.display = 'block';
        } else {
            otherInput.style.display = 'none';
            state.transferDestinationOther = '';
            otherInput.value = '';
        }
    });

    document.getElementById('transfer-destination-other').addEventListener('input', (e) => {
        state.transferDestinationOther = e.target.value;
    });

    // Vital signs event listeners
    document.getElementById('temp-input').addEventListener('input', (e) => {
        state.temperature = e.target.value;
    });
    document.getElementById('pulse-input').addEventListener('input', (e) => {
        state.pulse = e.target.value;
    });
    document.getElementById('rr-vs-input').addEventListener('input', (e) => {
        state.rrVitalSign = e.target.value;
    });

    // BP input with auto-formatting
    const bpInput = document.getElementById('bp-input');
    bpInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d]/g, ''); 

        if (value.length >= 4) {
            let formatted = '';

            if (value.length === 4) {
                formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
            } else if (value.length === 5) {
                formatted = value.slice(0, 3) + '/' + value.slice(3, 5);
            } else if (value.length >= 6) {
                formatted = value.slice(0, 3) + '/' + value.slice(3, 6);
            } else {
                formatted = value; 
            }

            e.target.value = formatted;
            state.bloodPressure = formatted;
        } else {
            e.target.value = value;
            state.bloodPressure = value;
        }
    });

    document.getElementById('spo2-input').addEventListener('input', (e) => {
        state.spo2 = e.target.value;
        checkCyanoticCHDCondition();
    });

    document.getElementById('additional-risk').addEventListener('change', (e) => {
        state.additionalRisk = e.target.checked;
        updateTotalScore();
    });

    document.querySelectorAll('.symptom-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.symptom-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.symptomsChanged = this.dataset.value;
        });
    });

    document.querySelector('.btn-transfer').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isSavingRecord) {
            return;
        }
        
        if (!state.transferDestination) {
            alert('กรุณาเลือกสถานที่ส่งต่อ');
        } else {
            saveRecord('Transfer');
        }
    });

    document.querySelector('.btn-reset').addEventListener('click', resetForm);

    const palsBtn = document.getElementById('pals-button');
    if (palsBtn) {
        palsBtn.addEventListener('click', () => {
            state.palsEnabled = !state.palsEnabled;
            if (state.palsEnabled) {
                palsBtn.classList.add('active');
            } else {
                palsBtn.classList.remove('active');
            }
        });
    }

    // CHD Modal handlers
    document.getElementById('chd-btn').addEventListener('click', () => {
        document.getElementById('chd-modal').style.display = 'flex';
    });

    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('chd-modal').style.display = 'none';
    });

    document.querySelectorAll('.chd-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const chdType = this.dataset.chd;
            state.chdType = chdType;

            const chdSelected = document.getElementById('chd-selected');
            const displayText = chdType === 'acyanotic' ? 'Acyanotic CHD' : 'Cyanotic CHD';
            const icon = chdType === 'acyanotic' ? '○' : '●';

            chdSelected.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.25rem;">${icon}</span>
                    <span style="font-weight: 600;">${displayText}</span>
                    <button onclick="clearCHD()" style="margin-left: auto; padding: 0.25rem 0.5rem; background: #ef4444; color: white; border: none; border-radius: 0.25rem; cursor: pointer; font-size: 0.75rem;">ยกเลิก</button>
                </div>
            `;
            chdSelected.style.display = 'block';
            document.getElementById('chd-modal').style.display = 'none';
            checkCyanoticCHDCondition();
        });
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('chd-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

function clearCHD() {
    state.chdType = '';
    document.getElementById('chd-selected').style.display = 'none';
    checkCyanoticCHDCondition();
}

function checkCyanoticCHDCondition() {
    const spo2 = parseFloat(state.spo2);
    const isCyanotic = state.chdType === 'cyanotic';

    if (isCyanotic && spo2 > 0 && spo2 < 75) {
        const behavior = state.behaviorScore || 0;
        const cardiovascular = state.cardiovascularScore || 0;
        const respiratory = state.respiratoryScore || 0;
        const additional = state.additionalRisk ? 2 : 0;
        const currentTotal = behavior + cardiovascular + respiratory + additional;
        const finalTotal = currentTotal + 4;

        const totalScoreDisplay = document.getElementById('total-score-display');
        const recommendation = finalTotal >= 4 ? 'ส่งต่อ ER โดยด่วน' : getRecommendation(finalTotal);
        const riskLevel = finalTotal >= 4 ? 'high' : getRiskLevel(finalTotal);

        totalScoreDisplay.className = `total-score ${riskLevel}`;
        totalScoreDisplay.innerHTML = `
            <div class="total-score-header">
                ⚠ คะแนนรวม: <span class="total-score-number">${finalTotal}</span>
            </div>
            <div class="total-score-recommendation">${recommendation}</div>
            <div style="margin-top: 0.75rem; padding: 0.75rem; background: #fee2e2; border: 2px solid #ef4444; border-radius: 0.5rem; font-size: 0.875rem; color: #991b1b;">
                🚨 <strong>ตรวจพบ: Cyanotic CHD + SpO₂ < 75%</strong><br/>
                <div style="margin-top: 0.5rem; padding: 0.5rem; background: white; border-radius: 0.25rem; font-family: monospace;">
                    พฤติกรรม: ${behavior} + ไหลเวียน: ${cardiovascular} + หายใจ: ${respiratory}${additional > 0 ? ` + เสี่ยง: ${additional}` : ''} = ${currentTotal}<br/>
                    <strong style="color: #dc2626;">+ Cyanotic CHD bonus: +4</strong><br/>
                    <strong style="font-size: 1.1rem; color: #dc2626;">รวมทั้งหมด = ${finalTotal} คะแนน</strong>
                </div>
                ${finalTotal >= 4 ? '<strong style="color: #dc2626;">⚠️ ต้องส่งต่อ ER โดยด่วน!</strong>' : ''}
            </div>
        `;
        document.getElementById('nursing-notes').value = recommendation;
        state.nursingNotes = recommendation;
    } else {
        updateTotalScore();
    }
}

function renderAgeGrid() {
    const grid = document.getElementById('age-grid');
    grid.innerHTML = '';
    ageGroups.forEach(age => {
        const button = document.createElement('button');
        button.className = 'age-button';
        button.innerHTML = `
            <div class="age-name">${age.name}</div>
            <div class="age-range">${age.ageRange}</div>
        `;
        button.addEventListener('click', () => selectAge(age.id));
        grid.appendChild(button);
    });
}

function selectAge(ageId) {
    state.ageGroup = ageId;
    document.getElementById('age-error').style.display = 'none';
    document.querySelectorAll('.age-button').forEach((btn, index) => {
        btn.classList.toggle('selected', ageGroups[index].id === ageId);
    });

    const ageGroup = ageGroups.find(a => a.id === ageId);
    if (ageGroup) {
        const cardioHeader = document.querySelector('#cardiovascular-section .section-header h2');
        if (cardioHeader) {
            cardioHeader.innerHTML = `ระบบไหลเวียนโลหิต <span style="color: #2563eb; font-weight: 600; font-size: 0.9rem; margin-left: 0.5rem;">PR ปกติ : ${ageGroup.heartRate.min} - ${ageGroup.heartRate.max} ครั้ง/นาที</span>`;
        }

        const prContainer = document.getElementById('pr-input-container');
        if (prContainer) {
            prContainer.style.display = 'flex';
        }

        const respHeader = document.querySelector('#respiratory-section .section-header h2');
        if (respHeader) {
            respHeader.innerHTML = `ระบบทางเดินหายใจ <span style="color: #2563eb; font-weight: 600; font-size: 0.9rem; margin-left: 0.5rem;">RR ปกติ : ${ageGroup.respiratoryRate.min} - ${ageGroup.respiratoryRate.max} ครั้ง/นาที</span>`;
        }

        const rrContainer = document.getElementById('rr-input-container');
        if (rrContainer) {
            rrContainer.style.display = 'flex';
        }

        const prInput = document.getElementById('pr-input');
        const rrInput = document.getElementById('rr-input');
        if (prInput && !prInput.hasAttribute('data-listener')) {
            prInput.addEventListener('input', (e) => {
                state.prValue = e.target.value;
                const pulseInput = document.getElementById('pulse-input');
                if (pulseInput) {
                    pulseInput.value = e.target.value;
                    state.pulse = e.target.value;
                }
            });
            prInput.setAttribute('data-listener', 'true');
        }

        if (rrInput && !rrInput.hasAttribute('data-listener')) {
            rrInput.addEventListener('input', (e) => {
                state.rrValue = e.target.value;
                const rrVsInput = document.getElementById('rr-vs-input');
                if (rrVsInput) {
                    rrVsInput.value = e.target.value;
                    state.rrVitalSign = e.target.value;
                }
            });
            rrInput.setAttribute('data-listener', 'true');
        }
    }

    renderCardiovascularGrid();
    renderRespiratoryGrid();
}

function renderBehaviorGrid() {
    const grid = document.getElementById('behavior-grid');
    grid.innerHTML = '';
    behaviorOptions.forEach(option => {
        const button = document.createElement('button');
        button.className = 'score-button';
        button.innerHTML = `
            <div class="score-label">${option.label}</div>
            <div class="score-value">${option.score}</div>
        `;
        button.addEventListener('click', () => selectBehavior(option.score));
        grid.appendChild(button);
    });
}

function selectBehavior(score) {
    state.behaviorScore = state.behaviorScore === score ? null : score;
    document.querySelectorAll('#behavior-grid .score-button').forEach((btn, index) => {
        btn.classList.toggle('selected', behaviorOptions[index].score === state.behaviorScore);
    });
    updateTotalScore();
}

function renderCardiovascularGrid() {
    const grid = document.getElementById('cardiovascular-grid');
    const warning = document.getElementById('cardiovascular-warning');
    if (!state.ageGroup) {
        warning.style.display = 'block';
        grid.innerHTML = '';
        return;
    }

    warning.style.display = 'none';
    const ageDetails = ageGroups.find(a => a.id === state.ageGroup);
    const max = ageDetails.heartRate.max;
    const min = ageDetails.heartRate.min;

    const options = [
        { score: 0, label: "ผิวสีชมพูดี หรือ CRT 1-2 วินาที" },
        { score: 1, label: "ผิวสีซีด หรือ CRT 3 วินาที" },
        { score: 2, label: `ผิวสีเทา หรือ CRT 4 วินาที หรือ ชีพจร ≥${max + 20} ครั้ง/นาที` },
        { score: 3, label: `ผิวสีเทาและตัวลาย หรือ CRT ≥5 วินาที หรือ ชีพจร ≥${max + 30} ครั้ง/นาที หรือ ชีพจร ≤${min - 10} ครั้ง/นาที` }
    ];
    grid.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'score-button';
        button.innerHTML = `
            <div class="score-label">${option.label}</div>
            <div class="score-value">${option.score}</div>
        `;
        button.addEventListener('click', () => selectCardiovascular(option.score));
        if (state.cardiovascularScore === option.score) {
            button.classList.add('selected');
        }
        grid.appendChild(button);
    });
}

function selectCardiovascular(score) {
    state.cardiovascularScore = state.cardiovascularScore === score ? null : score;
    renderCardiovascularGrid();
    updateTotalScore();
}

function renderRespiratoryGrid() {
    const grid = document.getElementById('respiratory-grid');
    const warning = document.getElementById('respiratory-warning');
    if (!state.ageGroup) {
        warning.style.display = 'block';
        grid.innerHTML = '';
        return;
    }

    warning.style.display = 'none';
    const ageDetails = ageGroups.find(a => a.id === state.ageGroup);
    const max = ageDetails.respiratoryRate.max;
    const min = ageDetails.respiratoryRate.min;

    const options = [
        { score: 0, label: "อยู่ในช่วงค่าปกติ/ไม่มี retraction" },
        { score: 1, label: `หายใจ ≥${max + 10} ครั้ง/นาที หรือ มี retraction หรือ FiO₂ ≥30% หรือ O₂ ≥4 LPM` },
        { score: 2, label: `หายใจ ≥${max + 20} ครั้ง/นาที และมี retraction หรือ FiO₂ ≥40% หรือ O₂ ≥6 LPM` },
        { score: 3, label: `หายใจ ≤${min - 5} ครั้ง/นาที + retraction + grunting หรือ FiO₂ ≥50% หรือ O₂ ≥8 LPM` }
    ];

    grid.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'score-button';
        button.innerHTML = `
            <div class="score-label">${option.label}</div>
            <div class="score-value">${option.score}</div>
        `;
        button.addEventListener('click', () => selectRespiratory(option.score));
        if (state.respiratoryScore === option.score) {
            button.classList.add('selected');
        }
        grid.appendChild(button);
    });
}

function selectRespiratory(score) {
    state.respiratoryScore = state.respiratoryScore === score ? null : score;
    renderRespiratoryGrid();
    updateTotalScore();
}

function updateTotalScore() {
    const behavior = state.behaviorScore || 0;
    const cardiovascular = state.cardiovascularScore || 0;
    const respiratory = state.respiratoryScore || 0;
    const additional = state.additionalRisk ? 2 : 0;
    const total = behavior + cardiovascular + respiratory + additional;

    const display = document.getElementById('total-score-display');
    const recommendation = getRecommendation(total);
    const riskLevel = getRiskLevel(total);

    display.className = `total-score ${riskLevel}`;
    display.innerHTML = `
        <div class="total-score-header">
            ⚠ คะแนนรวม: <span class="total-score-number">${total}</span>
        </div>
        <div class="total-score-recommendation">${recommendation}</div>
    `;
    document.getElementById('nursing-notes').value = recommendation;
    state.nursingNotes = recommendation;
}

function getRiskLevel(score) {
    if (score <= 1) return 'low';
    if (score === 2) return 'medium';
    if (score === 3) return 'orange';
    return 'high';
}

function getRecommendation(score) {
    if (score <= 1) return 'รับบริการตามปกติ';
    if (score === 2) return 'ติดตาม และ ประเมินอาการ ทุก 1-2 ชั่วโมง';
    if (score === 3) return 'ให้ผู้ป่วยได้รับการประเมินโดยแพทย์ ภายใน 30 นาที';
    if (score >= 4) return 'ส่งต่อ ER';
    return 'รับบริการตามปกติ';
}

// ---------------------------------------------------------
// ฟังก์ชันส่งข้อมูลไป Google Form (แก้ไขให้ส่งค่าแทนว่าง)
// ---------------------------------------------------------
async function submitToGoogleForm(record) {
    if (submittedRecordIds.has(record.id)) {
        return;
    }

    const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScfBir96VFdMNbhFrTx294HIbHky2YBxHs2bzWPn2WCI4krNQ/formResponse';
    const formData = new FormData();

    // ฟังก์ชันนี้สำคัญมาก: ถ้าค่าเป็นว่าง/null/undefined ให้ส่ง "-" แทน
    // เพื่อป้องกัน Google Form ปฏิเสธรับข้อมูลกรณีเป็น Required Field
    const safeText = (val) => {
        if (val === undefined || val === null || String(val).trim() === '') {
            return '-'; 
        }
        return String(val);
    };

    formData.append('entry.1499630260', safeText(record.hn));               
    formData.append('entry.2111986384', safeText(record.location));         
    formData.append('entry.1151417469', safeText(record.ageGroup));         
    formData.append('entry.1622795877', safeText(record.totalScore));       

    const vitalSigns = `Temp: ${record.temperature || '-'}°C, PR: ${record.pulse || '-'} bpm, RR: ${record.rrVitalSign || '-'} tpm, BP: ${record.bloodPressure || '-'} mmHg, SpO₂: ${record.spo2 || '-'}%`;
    formData.append('entry.876819797', vitalSigns);                         

    const scoreDetails = `พฤติกรรม: ${safeText(record.behaviorScore)}, ไหลเวียน: ${safeText(record.cardiovascularScore)}, หายใจ: ${safeText(record.respiratoryScore)}, เสี่ยง: ${record.additionalRisk ? 'มี' : 'ไม่มี'}`;
    formData.append('entry.1330529947', scoreDetails);                      

    formData.append('entry.813541969', safeText(record.chdType));           
    formData.append('entry.1654799629', record.palsEnabled ? 'เปิดใช้งาน' : 'ไม่เปิดใช้งาน'); 
    
    // จุดเสี่ยง: ถ้า Nursing Note ว่าง ให้ส่งขีด
    formData.append('entry.725936751', safeText(record.nursingNotes));      
    formData.append('entry.877422297', safeText(record.transferDestination));
    formData.append('entry.179224501', new Date(record.createdAt).toLocaleString('th-TH')); 
    formData.append('entry.2125384468', record.isReassessment ? 'ใช่' : 'ไม่'); 

    console.log(`📤 กำลังส่งข้อมูล ID: ${record.id} ไป Google Form...`);
    submittedRecordIds.add(record.id);
    
    try {
        await fetch(GOOGLE_FORM_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });
        console.log(`✅ ส่งข้อมูล ID: ${record.id} สำเร็จ`);
    } catch (error) {
        console.error('❌ Error sending to Google Form:', error);
        submittedRecordIds.delete(record.id);
    }
}

async function saveRecord(action) {
    const now = Date.now();
    if (now - lastSaveTime < SAVE_COOLDOWN) return;
    if (isSavingRecord) return;

    if (!state.ageGroup) {
        document.getElementById('age-error').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert('กรุณาเลือกช่วงอายุผู้ป่วยก่อนทำการบันทึก');
        return;
    }

    // ล็อกปุ่มทันทีป้องกันกดเบิ้ล
    isSavingRecord = true;
    lastSaveTime = now;

    const transferBtn = document.querySelector('.btn-transfer');
    const originalBtnText = transferBtn ? transferBtn.innerHTML : ''; 

    if (transferBtn) {
        transferBtn.disabled = true;
        transferBtn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> กำลังส่ง...';
        transferBtn.style.opacity = '0.7';
        transferBtn.style.cursor = 'not-allowed';
        
        if (!document.getElementById('temp-spin-style')) {
            const style = document.createElement('style');
            style.id = 'temp-spin-style';
            style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }
    }

    try {
        const behavior = state.behaviorScore || 0;
        const cardiovascular = state.cardiovascularScore || 0;
        const respiratory = state.respiratoryScore || 0;
        const additional = state.additionalRisk ? 2 : 0;
        let total = behavior + cardiovascular + respiratory + additional;

        const spo2 = parseFloat(state.spo2);
        const isCyanotic = state.chdType === 'cyanotic';
        if (isCyanotic && spo2 > 0 && spo2 < 75) {
            total += 4;
        }

        const locationValue = state.location === 'อื่นๆ' ? `อื่นๆ: ${state.locationOther}` : state.location;
        const transferValue = state.transferDestination === 'อื่นๆ' ? `อื่นๆ: ${state.transferDestinationOther}` : state.transferDestination;
        
        const recordId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const record = {
            id: recordId,
            hn: state.hn.trim() || 'ไม่ระบุ',
            location: locationValue || 'ไม่ระบุ',
            ageGroup: state.ageGroup,
            behaviorScore: behavior,
            cardiovascularScore: cardiovascular,
            respiratoryScore: respiratory,
            additionalRisk: state.additionalRisk,
            totalScore: total,
            nursingNotes: state.nursingNotes,
            symptomsChanged: state.symptomsChanged,
            action: action,
            transferDestination: transferValue || '',
            prValue: state.prValue || 'ไม่ระบุ',
            rrValue: state.rrValue || 'ไม่ระบุ',
            temperature: state.temperature || '',
            pulse: state.pulse || '',
            rrVitalSign: state.rrVitalSign || '',
            bloodPressure: state.bloodPressure || '',
            spo2: state.spo2 || '',
            chdType: state.chdType || '',
            palsEnabled: state.palsEnabled,
            parentRecordId: state.parentRecordId,
            isReassessment: state.isReassessment,
            createdAt: new Date().toISOString()
        };

        state.records.unshift(record);
        saveRecords();
        renderRecords();
        
        // ส่งข้อมูล
        await submitToGoogleForm(record);
        
        alert(`บันทึกสำเร็จ\nบันทึกข้อมูลผู้ป่วย HN: ${record.hn} เรียบร้อยแล้ว`);
        resetForm();

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการบันทึก:', error);
        alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง');
    } finally {
        if (transferBtn) {
            transferBtn.disabled = false;
            transferBtn.innerHTML = originalBtnText;
            transferBtn.style.opacity = '1';
            transferBtn.style.cursor = 'pointer';
        }

        setTimeout(() => {
            isSavingRecord = false;
        }, 1500);
    }
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function renderRecords() {
    const container = document.getElementById('records-list');
    if (!state.records || state.records.length === 0) {
        container.innerHTML = `
            <div class="empty-records">
                <div class="empty-icon">📋</div>
                <p class="empty-title">ยังไม่มีประวัติการบันทึก</p>
                <p class="empty-description">เมื่อคุณบันทึกข้อมูลผู้ป่วย ประวัติจะแสดงที่นี่</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.records.map((record) => {
        const ageGroup = ageGroups.find(a => a.id === record.ageGroup);
        const ageText = ageGroup ? `${ageGroup.name} (${ageGroup.ageRange})` : 'ไม่ระบุ';
        const isReassessment = record.isReassessment;
        const parentRecord = isReassessment ? state.records.find(r => r.id === record.parentRecordId) : null;

        let comparisonHTML = '';
        if (isReassessment && parentRecord) {
            comparisonHTML = `
                <div class="comparison-container">
                    <h4>📊 เปรียบเทียบผลการประเมิน</h4>
                    <div class="comparison-grid">
                        <div class="comparison-column">
                            <div class="comparison-header">
                                <span class="comparison-badge">1</span>
                                <div>
                                    <div class="comparison-title">ครั้งที่ 1</div>
                                    <div class="comparison-time">${formatDateTime(parentRecord.createdAt)}</div>
                                </div>
                            </div>
                            <div class="comparison-data">
                                <div class="data-item">
                                    <span class="data-label">คะแนนรวม</span>
                                    <span class="data-value score-value">${parentRecord.totalScore}</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">Temp</span>
                                    <span class="data-value">${parentRecord.temperature} °C</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">PR</span>
                                    <span class="data-value">${parentRecord.pulse} bpm</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">RR</span>
                                    <span class="data-value">${parentRecord.rrVitalSign} tpm</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">BP</span>
                                    <span class="data-value">${parentRecord.bloodPressure}</span>
                                </div>
                                <div class="data-item">
                                    <span class="data-label">SpO₂</span>
                                    <span class="data-value">${record.spo2}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="comparison-arrow">→</div>

                        <div class="comparison-column highlight">
                            <div class="comparison-header">
                                <span class="comparison-badge">2</span>
                                <div>
                                    <div class="comparison-title">ครั้งที่ 2 (ประเมินซ้ำ)</div>
                                    <div class="comparison-time">${formatDateTime(record.createdAt)}</div>
                                </div>
                            </div>
                            <div class="comparison-data">
                                <div class="data-item ${record.totalScore !== parentRecord.totalScore ? 'changed' : ''}">
                                    <span class="data-label">คะแนนรวม</span>
                                    <span class="data-value score-value">${record.totalScore}</span>
                                </div>
                                <div class="data-item ${record.temperature !== parentRecord.temperature ? 'changed' : ''}">
                                    <span class="data-label">Temp</span>
                                    <span class="data-value">${record.temperature} °C</span>
                                </div>
                                <div class="data-item ${record.pulse !== parentRecord.pulse ? 'changed' : ''}">
                                    <span class="data-label">PR</span>
                                    <span class="data-value">${record.pulse} bpm</span>
                                </div>
                                <div class="data-item ${record.rrVitalSign !== parentRecord.rrVitalSign ? 'changed' : ''}">
                                    <span class="data-label">RR</span>
                                    <span class="data-value">${record.rrVitalSign} tpm</span>
                                </div>
                                <div class="data-item ${record.bloodPressure !== parentRecord.bloodPressure ? 'changed' : ''}">
                                    <span class="data-label">BP</span>
                                    <span class="data-value">${record.bloodPressure}</span>
                                </div>
                                <div class="data-item ${record.spo2 !== parentRecord.spo2 ? 'changed' : ''}">
                                    <span class="data-label">SpO₂</span>
                                    <span class="data-value">${record.spo2}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        const riskLevel = getRiskLevel(record.totalScore);
        const scoreColorClass = riskLevel === 'low' ? 'score-green' :
                                riskLevel === 'medium' ? 'score-yellow' :
                                riskLevel === 'orange' ? 'score-orange' : 'score-red';

        return `
            <div class="record-card">
                <div class="record-header">
                    <div>
                        <strong>HN:</strong> ${record.hn}
                        ${isReassessment ? '<span class="reassessment-badge">ประเมินซ้ำ</span>' : ''}
                    </div>
                    <div class="record-date">${formatDateTime(record.createdAt)}</div>
                </div>

                <div class="record-details">
                    <div class="detail-row">
                        <span class="detail-label">สถานที่:</span>
                        <span>${record.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ช่วงอายุ:</span>
                        <span>${ageText}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">คะแนนรวม:</span>
                        <span class="total-score-badge ${scoreColorClass}">${record.totalScore}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">การดำเนินการ:</span>
                        <span class="action-badge">${record.action}</span>
                    </div>
                    ${record.nursingNotes ? `
                    <div class="detail-row">
                        <span class="detail-label">การพยาบาล:</span>
                        <span>${record.nursingNotes}</span>
                    </div>
                    ` : ''}
                    ${record.transferDestination ? `
                    <div class="detail-row">
                        <span class="detail-label">ส่งต่อไปที่:</span>
                        <span class="transfer-badge">${record.transferDestination}</span>
                    </div>
                    ` : ''}
                    ${record.chdType ? `
                    <div class="detail-row">
                        <span class="detail-label">CHD:</span>
                        <span class="chd-badge">${record.chdType === 'acyanotic' ? '○ Acyanotic CHD' : '● Cyanotic CHD'}</span>
                    </div>
                    ` : ''}
                    ${record.palsEnabled ? `
                    <div class="detail-row">
                        <span class="detail-label">PALS:</span>
                        <span class="pals-badge">PALS</span>
                    </div>
                    ` : ''}
                </div>

                <div class="vital-signs-summary">
                    <h4>📊 สัญญาณชีพที่ประเมิน</h4>
                    <div class="vital-signs-summary-grid">
                        <div class="vital-summary-item">
                            <span class="vital-summary-label">Temp:</span>
                            <span class="vital-summary-value">${record.temperature} °C</span>
                        </div>
                        <div class="vital-summary-item">
                            <span class="vital-summary-label">PR:</span>
                            <span class="vital-summary-value">${record.pulse} bpm</span>
                        </div>
                        <div class="vital-summary-item">
                            <span class="vital-summary-label">RR:</span>
                            <span class="vital-summary-value">${record.rrVitalSign} tpm</span>
                        </div>
                        <div class="vital-summary-item">
                            <span class="vital-summary-label">BP:</span>
                            <span class="vital-summary-value">${record.bloodPressure} mmHg</span>
                        </div>
                        <div class="vital-summary-item">
                            <span class="vital-summary-label">SpO₂:</span>
                            <span class="vital-summary-value">${record.spo2}%</span>
                        </div>
                    </div>
                </div>

                ${comparisonHTML}

                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    ${!isReassessment ? `
                        <button class="reassess-btn" onclick="startReassessment('${record.id}')">
                            🔄 ประเมินซ้ำ
                        </button>
                    ` : ''}
                    <button class="delete-btn" onclick="deleteRecord('${record.id}')">
                        🗑️ ลบ
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function startReassessment(recordId) {
    const record = state.records.find(r => r.id === recordId);
    if (!record) {
        alert('ไม่พบข้อมูลการบันทึก');
        return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    state.parentRecordId = recordId;
    state.isReassessment = true;

    state.hn = record.hn;
    state.location = record.location;
    state.ageGroup = record.ageGroup;

    document.getElementById('hn-input-top').value = record.hn;
    document.getElementById('location-select').value = record.location.includes('อื่นๆ') ? 'อื่นๆ' : record.location;

    selectAge(record.ageGroup);

    const formTitle = document.querySelector('h1');
    if (formTitle && !formTitle.innerHTML.includes('ประเมินซ้ำ')) {
        formTitle.innerHTML = formTitle.innerHTML + ' <span style="background: #fbbf24; color: white; padding: 0.25rem 0.75rem; border-radius: 0.5rem; margin-left: 0.5rem; font-size: 1rem;">กำลังประเมินซ้ำ</span>';
    }

    alert(`กำลังประเมินซ้ำสำหรับ HN: ${record.hn}\nกรุณากรอกข้อมูลใหม่และบันทึก`);
}

function resetForm() {
    state.ageGroup = null;
    state.behaviorScore = null;
    state.cardiovascularScore = null;
    state.respiratoryScore = null;
    state.additionalRisk = false;
    state.hn = '';
    state.location = '';
    state.locationOther = '';
    state.nursingNotes = '';
    state.symptomsChanged = 'no';
    state.transferDestination = '';
    state.transferDestinationOther = '';
    state.prValue = '';
    state.rrValue = '';
    state.temperature = '';
    state.pulse = '';
    state.rrVitalSign = '';
    state.bloodPressure = '';
    state.spo2 = '';
    state.chdType = '';
    state.palsEnabled = false;
    state.parentRecordId = null;
    state.isReassessment = false;

    document.getElementById('hn-input-top').value = '';
    document.getElementById('location-select').value = '';
    document.getElementById('location-other').value = '';
    document.getElementById('location-other').style.display = 'none';
    document.getElementById('nursing-notes').value = '';
    document.getElementById('transfer-destination-select').value = '';
    document.getElementById('transfer-destination-other').value = '';
    document.getElementById('transfer-destination-other').style.display = 'none';
    document.getElementById('additional-risk').checked = false;
    document.getElementById('age-error').style.display = 'none';

    const formTitle = document.querySelector('h1');
    if (formTitle) {
        formTitle.innerHTML = formTitle.innerHTML.replace(/<span style="background: #fbbf24.*?<\/span>/, '');
    }

    const prInput = document.getElementById('pr-input');
    const rrInput = document.getElementById('rr-input');
    if (prInput) prInput.value = '';
    if (rrInput) rrInput.value = '';

    document.getElementById('temp-input').value = '';
    document.getElementById('pulse-input').value = '';
    document.getElementById('rr-vs-input').value = '';
    document.getElementById('bp-input').value = '';
    document.getElementById('spo2-input').value = '';

    document.getElementById('chd-selected').style.display = 'none';

    const palsBtn = document.getElementById('pals-button');
    if (palsBtn) {
        palsBtn.classList.remove('active');
    }

    const prContainer = document.getElementById('pr-input-container');
    const rrContainer = document.getElementById('rr-input-container');
    if (prContainer) prContainer.style.display = 'none';
    if (rrContainer) rrContainer.style.display = 'none';

    const cardioHeader = document.querySelector('#cardiovascular-section .section-header h2');
    if (cardioHeader) {
        cardioHeader.innerHTML = 'ระบบไหลเวียนโลหิต';
    }

    const respHeader = document.querySelector('#respiratory-section .section-header h2');
    if (respHeader) {
        respHeader.innerHTML = 'ระบบทางเดินหายใจ';
    }

    document.querySelectorAll('.symptom-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === 'no');
    });

    document.querySelectorAll('.age-button').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.score-button').forEach(btn => btn.classList.remove('selected'));

    updateTotalScore();
}

function deleteRecord(id) {
    if (confirm('ต้องการลบรายการนี้หรือไม่?')) {
        state.records = state.records.filter(r => r.id !== id);
        saveRecords();
        renderRecords();
        alert('ลบสำเร็จ');
    }
}

function loadRecords() {
    const saved = localStorage.getItem('pewsRecords');
    if (saved) {
        try {
            state.records = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading records:', e);
        }
    }
}

function saveRecords() {
    localStorage.setItem('pewsRecords', JSON.stringify(state.records));
}
