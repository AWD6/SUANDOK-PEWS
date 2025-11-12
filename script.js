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
    records: []
};

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

    document.getElementById('bp-input').addEventListener('input', (e) => {
        state.bloodPressure = e.target.value;
    });

    document.getElementById('spo2-input').addEventListener('input', (e) => {
        state.spo2 = e.target.value;
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

    document.querySelector('.btn-transfer').addEventListener('click', () => {
        const transferSection = document.getElementById('transfer-destination-section');
        if (transferSection.style.display === 'none') {
            transferSection.style.display = 'block';
        } else {
            saveRecord('Transfer');
        }
    });
    document.querySelector('.btn-reset').addEventListener('click', resetForm);
});

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

    // Update vital signs info in section headers and show input containers
    const ageGroup = ageGroups.find(a => a.id === ageId);
    if (ageGroup) {
        // Update cardiovascular header and show PR input
        const cardioHeader = document.querySelector('#cardiovascular-section .section-header h2');
        if (cardioHeader) {
            cardioHeader.innerHTML = `ระบบไหลเวียนโลหิต <span style="color: #2563eb; font-weight: 600; font-size: 0.9rem; margin-left: 0.5rem;">PR ปกติ : ${ageGroup.heartRate.min} - ${ageGroup.heartRate.max} ครั้ง/นาที</span>`;
        }

        // Show PR input container
        const prContainer = document.getElementById('pr-input-container');
        if (prContainer) {
            prContainer.style.display = 'flex';
        }

        // Update respiratory header and show RR input
        const respHeader = document.querySelector('#respiratory-section .section-header h2');
        if (respHeader) {
            respHeader.innerHTML = `ระบบทางเดินหายใจ <span style="color: #2563eb; font-weight: 600; font-size: 0.9rem; margin-left: 0.5rem;">RR ปกติ : ${ageGroup.respiratoryRate.min} - ${ageGroup.respiratoryRate.max} ครั้ง/นาที</span>`;
        }

        // Show RR input container
        const rrContainer = document.getElementById('rr-input-container');
        if (rrContainer) {
            rrContainer.style.display = 'flex';
        }

        // Add event listeners to vital signs inputs
        const prInput = document.getElementById('pr-input');
        const rrInput = document.getElementById('rr-input');

        if (prInput && !prInput.hasAttribute('data-listener')) {
            prInput.addEventListener('input', (e) => {
                state.prValue = e.target.value;
            });
            prInput.setAttribute('data-listener', 'true');
        }

        if (rrInput && !rrInput.hasAttribute('data-listener')) {
            rrInput.addEventListener('input', (e) => {
                state.rrValue = e.target.value;
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

    // Update nursing notes with recommendation based on score
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

function saveRecord(action) {
    if (!state.ageGroup) {
        document.getElementById('age-error').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        alert('กรุณาเลือกช่วงอายุผู้ป่วยก่อนทำการบันทึก');
        return;
    }

    const behavior = state.behaviorScore || 0;
    const cardiovascular = state.cardiovascularScore || 0;
    const respiratory = state.respiratoryScore || 0;
    const additional = state.additionalRisk ? 2 : 0;
    const total = behavior + cardiovascular + respiratory + additional;

    const locationValue = state.location === 'อื่นๆ' 
        ? `อื่นๆ: ${state.locationOther}` 
        : state.location;

    const transferValue = state.transferDestination === 'อื่นๆ'
        ? `อื่นๆ: ${state.transferDestinationOther}`
        : state.transferDestination;

    const record = {
        id: Date.now().toString(),
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
        transferDestination: action === 'Transfer' ? transferValue : '',
        prValue: state.prValue || 'ไม่ระบุ',
        rrValue: state.rrValue || 'ไม่ระบุ',
        temperature: state.temperature || 'ไม่ระบุ',
        pulse: state.pulse || 'ไม่ระบุ',
        rrVitalSign: state.rrVitalSign || 'ไม่ระบุ',
        bloodPressure: state.bloodPressure || 'ไม่ระบุ',
        spo2: state.spo2 || 'ไม่ระบุ',
        parentRecordId: state.parentRecordId,
        isReassessment: state.isReassessment,
        createdAt: new Date().toISOString()
    };

    state.records.unshift(record);
    saveRecords();
    renderRecords();
    alert(`บันทึกสำเร็จ\nบันทึกข้อมูลผู้ป่วย HN: ${record.hn} เรียบร้อยแล้ว`);
    resetForm();
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
    const container = document.getElementById('records-container');
    if (!state.records || state.records.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">ยังไม่มีประวัติการบันทึก</p>';
        return;
    }

    container.innerHTML = state.records.map((record, index) => {
        const ageGroup = ageGroups.find(a => a.id === record.ageGroup);
        const ageText = ageGroup ? `${ageGroup.name} (${ageGroup.ageRange})` : 'ไม่ระบุ';
        const isReassessment = record.isReassessment;
        const parentRecord = isReassessment ? state.records.find(r => r.id === record.parentRecordId) : null;

        let comparisonHTML = '';
        if (isReassessment && parentRecord) {
            comparisonHTML = `
                <div class="comparison-container">
                    <h4>📊 เปรียบเทียบผลการประเมิน</h4>
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>รายการ</th>
                                <th>ครั้งที่ 1<br/><small>${formatDateTime(parentRecord.createdAt)}</small></th>
                                <th>ครั้งที่ 2 (ประเมินซ้ำ)<br/><small>${formatDateTime(record.createdAt)}</small></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>คะแนนรวม</strong></td>
                                <td>${parentRecord.totalScore}</td>
                                <td class="${record.totalScore !== parentRecord.totalScore ? 'comparison-highlight' : ''}">${record.totalScore}</td>
                            </tr>
                            <tr>
                                <td>พฤติกรรม</td>
                                <td>${parentRecord.behaviorScore ?? '-'}</td>
                                <td class="${record.behaviorScore !== parentRecord.behaviorScore ? 'comparison-highlight' : ''}">${record.behaviorScore ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>ไหลเวียนโลหิต</td>
                                <td>${parentRecord.cardiovascularScore ?? '-'}</td>
                                <td class="${record.cardiovascularScore !== parentRecord.cardiovascularScore ? 'comparison-highlight' : ''}">${record.cardiovascularScore ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>ทางเดินหายใจ</td>
                                <td>${parentRecord.respiratoryScore ?? '-'}</td>
                                <td class="${record.respiratoryScore !== parentRecord.respiratoryScore ? 'comparison-highlight' : ''}">${record.respiratoryScore ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>Temp (°C)</td>
                                <td>${parentRecord.temperature}</td>
                                <td class="${record.temperature !== parentRecord.temperature ? 'comparison-highlight' : ''}">${record.temperature}</td>
                            </tr>
                            <tr>
                                <td>Pulse (bpm)</td>
                                <td>${parentRecord.pulse}</td>
                                <td class="${record.pulse !== parentRecord.pulse ? 'comparison-highlight' : ''}">${record.pulse}</td>
                            </tr>
                            <tr>
                                <td>RR (tpm)</td>
                                <td>${parentRecord.rrVitalSign}</td>
                                <td class="${record.rrVitalSign !== parentRecord.rrVitalSign ? 'comparison-highlight' : ''}">${record.rrVitalSign}</td>
                            </tr>
                            <tr>
                                <td>BP (mmHg)</td>
                                <td>${parentRecord.bloodPressure}</td>
                                <td class="${record.bloodPressure !== parentRecord.bloodPressure ? 'comparison-highlight' : ''}">${record.bloodPressure}</td>
                            </tr>
                            <tr>
                                <td>SpO₂ (%)</td>
                                <td>${parentRecord.spo2}</td>
                                <td class="${record.spo2 !== parentRecord.spo2 ? 'comparison-highlight' : ''}">${record.spo2}</td>
                            </tr>
                            <tr>
                                <td>การดำเนินการ</td>
                                <td>${parentRecord.action}</td>
                                <td class="${record.action !== parentRecord.action ? 'comparison-highlight' : ''}">${record.action}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        return `
            <div class="record-card">
                <div class="record-header">
                    <div>
                        <strong>HN:</strong> ${record.hn}
                        ${isReassessment ? '<span style="background: #fbbf24; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; margin-left: 0.5rem; font-size: 0.75rem; font-weight: 600;">ประเมินซ้ำ</span>' : ''}
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
                        <span class="detail-label">คะแนนพฤติกรรม:</span>
                        <span>${record.behaviorScore ?? '-'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">คะแนนไหลเวียนโลหิต:</span>
                        <span>${record.cardiovascularScore ?? '-'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">คะแนนทางเดินหายใจ:</span>
                        <span>${record.respiratoryScore ?? '-'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">PR:</span>
                        <span>${record.prValue}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">RR:</span>
                        <span>${record.rrValue}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Temp:</span>
                        <span>${record.temperature}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Pulse:</span>
                        <span>${record.pulse}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">RR (V/S):</span>
                        <span>${record.rrVitalSign}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">BP:</span>
                        <span>${record.bloodPressure}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">SpO₂:</span>
                        <span>${record.spo2}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ความเสี่ยงเพิ่มเติม:</span>
                        <span>${record.additionalRisk ? 'มี (+2)' : 'ไม่มี'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">คะแนนรวม:</span>
                        <span class="total-score-badge">${record.totalScore}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">การดำเนินการ:</span>
                        <span class="action-badge">${record.action}</span>
                    </div>
                    ${record.transferDestination ? `
                        <div class="detail-row">
                            <span class="detail-label">ส่งต่อไปยัง:</span>
                            <span>${record.transferDestination}</span>
                        </div>
                    ` : ''}
                    ${record.nursingNotes ? `
                        <div class="detail-row">
                            <span class="detail-label">บันทึกพยาบาล:</span>
                            <span>${record.nursingNotes}</span>
                        </div>
                    ` : ''}
                </div>

                ${comparisonHTML}

                ${!isReassessment ? `
                    <div style="margin-top: 1rem;">
                        <button class="reassess-btn" onclick="startReassessment('${record.id}')">
                            🔄 ประเมินซ้ำ
                        </button>
                    </div>
                ` : ''}
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

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Set reassessment state
    state.parentRecordId = recordId;
    state.isReassessment = true;

    // Pre-fill form with previous data
    state.hn = record.hn;
    state.location = record.location;
    state.ageGroup = record.ageGroup;

    document.getElementById('hn-input-top').value = record.hn;
    document.getElementById('location-select').value = record.location === 'อื่นๆ' ? record.location : (record.location || '');

    // Select age group
    selectAge(record.ageGroup);

    // Show reassessment indicator
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
    document.getElementById('transfer-destination-section').style.display = 'none';
    document.getElementById('additional-risk').checked = false;
    document.getElementById('age-error').style.display = 'none';

    // Clear reassessment indicator from title
    const formTitle = document.querySelector('h1');
    if (formTitle) {
        formTitle.innerHTML = formTitle.innerHTML.replace(/<span style="background: #fbbf24.*?<\/span>/, '');
    }

    // Reset PR and RR inputs
    const prInput = document.getElementById('pr-input');
    const rrInput = document.getElementById('rr-input');
    if (prInput) prInput.value = '';
    if (rrInput) rrInput.value = '';

    // Reset vital signs inputs
    document.getElementById('temp-input').value = '';
    document.getElementById('pulse-input').value = '';
    document.getElementById('rr-vs-input').value = '';
    document.getElementById('bp-input').value = '';
    document.getElementById('spo2-input').value = '';

    // Hide vital signs input containers
    const prContainer = document.getElementById('pr-input-container');
    const rrContainer = document.getElementById('rr-input-container');
    if (prContainer) prContainer.style.display = 'none';
    if (rrContainer) rrContainer.style.display = 'none';

    // Reset headers to default text
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

function renderRecords() {
    const container = document.getElementById('records-list');

    if (state.records.length === 0) {
        container.innerHTML = `
            <div class="empty-records">
                <div class="empty-icon">📋</div>
                <p class="empty-title">ยังไม่มีประวัติการบันทึก</p>
                <p class="empty-description">เมื่อคุณบันทึกข้อมูลผู้ป่วย ประวัติจะแสดงที่นี่</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    state.records.forEach(record => {
        const timestamp = new Date(record.createdAt).toLocaleString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const card = document.createElement('div');
        card.className = 'record-card';
        card.innerHTML = `
            <div class="record-header">
                <div>
                    <div class="record-timestamp">${timestamp}</div>
                    <div class="record-hn">HN: ${record.hn}</div>
                </div>
                <div class="record-actions">
                    <span class="action-badge ${record.action.toLowerCase()}">${record.action}</span>
                    <button class="delete-btn" onclick="deleteRecord('${record.id}')">🗑️</button>
                </div>
            </div>
            <div class="record-details">
                <div><strong>Location:</strong> ${record.location}</div>
                <div><strong>PEWS Score:</strong> <span style="color: #2563eb; font-weight: 600; font-size: 1rem;">${record.totalScore}</span></div>
                <div><strong>PR:</strong> ${record.prValue} ครั้ง/นาที</div>
                <div><strong>RR:</strong> ${record.rrValue} ครั้ง/นาที</div>
                <div><strong>อาการเปลี่ยนแปลง:</strong> ${record.symptomsChanged === 'yes' ? 'มี' : 'ไม่มี'}</div>
                ${record.transferDestination ? `<div><strong>ส่งต่อไปที่:</strong> ${record.transferDestination}</div>` : ''}
            </div>
            ${record.nursingNotes ? `<div class="record-notes"><strong>การพยาบาล:</strong> ${record.nursingNotes}</div>` : ''}
        `;
        container.appendChild(card);
    });
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
