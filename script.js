
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
        heartRate: { min: 60, max: 100 },
        respiratoryRate: { min: 18, max: 20 }
    },
    {
        id: 'adolescent',
        name: 'Adolescent',
        ageRange: '13-18 ปี',
        heartRate: { min: 60, max: 100 },
        respiratoryRate: { min: 12, max: 16 }
    }
];

// Scoring options
const behaviorScores = [
    { score: 0, label: 'Playing/appropriate' },
    { score: 1, label: 'Sleeping' },
    { score: 2, label: 'Irritable' },
    { score: 3, label: 'Lethargic/confused\nReduced response to pain' }
];

const cardiovascularScores = [
    { score: 0, label: 'Pink\nCRT 1-2 sec' },
    { score: 1, label: 'Pale\nCRT 3 sec' },
    { score: 2, label: 'Grey\nCRT 4 sec\nTachycardia 10-20 above normal' },
    { score: 3, label: 'Grey and mottled\nCRT ≥ 5 sec\nTachycardia 20 above normal\nBradycardia' }
];

const respiratoryScores = [
    { score: 0, label: 'Within normal parameters\nNo recession or tracheal tug' },
    { score: 1, label: '10 above normal parameters\nUsing accessory muscles\nRecession\n30+ % FiO₂ or 4+ L/min' },
    { score: 2, label: '20 above normal parameters\nRecession\nTracheal tug\n40+ % FiO₂ or 6+ L/min' },
    { score: 3, label: '5 below normal parameters\n20 above normal parameters\nRecession and tracheal tug\n50+ % FiO₂ or 8+ L/min' }
];

// State
let state = {
    hn: '',
    location: '',
    locationOther: '',
    selectedAge: null,
    chdType: '',
    temperature: '',
    pulse: '',
    rrVitalSign: '',
    bloodPressure: '',
    spo2: '',
    behaviorScore: null,
    cardiovascularScore: null,
    respiratoryScore: null,
    additionalRisk: false,
    palsEnabled: false,
    nursingNotes: '',
    transferDestination: '',
    totalScore: 0
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderAgeGroups();
    renderScoreOptions();
    setupEventListeners();
    loadRecords();
    updateTotalScore();
});

// Render age groups
function renderAgeGroups() {
    const grid = document.getElementById('age-group-grid');
    grid.innerHTML = ageGroups.map(age => `
        <div class="age-group-card" data-age="${age.id}">
            <div class="age-group-name">${age.name}</div>
            <div class="age-group-range">${age.ageRange}</div>
        </div>
    `).join('');
}

// Render score options
function renderScoreOptions() {
    const behaviorGrid = document.getElementById('behavior-grid');
    behaviorGrid.innerHTML = behaviorScores.map(option => `
        <div class="score-card" data-category="behavior" data-score="${option.score}">
            <div class="score-label">${option.label}</div>
            <div class="score-number">${option.score}</div>
        </div>
    `).join('');

    const cardioGrid = document.getElementById('cardiovascular-grid');
    cardioGrid.innerHTML = cardiovascularScores.map(option => `
        <div class="score-card" data-category="cardiovascular" data-score="${option.score}">
            <div class="score-label">${option.label}</div>
            <div class="score-number">${option.score}</div>
        </div>
    `).join('');

    const respGrid = document.getElementById('respiratory-grid');
    respGrid.innerHTML = respiratoryScores.map(option => `
        <div class="score-card" data-category="respiratory" data-score="${option.score}">
            <div class="score-label">${option.label}</div>
            <div class="score-number">${option.score}</div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // HN input
    document.getElementById('hn-input').addEventListener('input', (e) => {
        state.hn = e.target.value;
    });

    // Location
    document.getElementById('location-input').addEventListener('change', (e) => {
        state.location = e.target.value;
        const otherInput = document.getElementById('location-other');
        if (e.target.value === 'อื่นๆ') {
            otherInput.style.display = 'block';
        } else {
            otherInput.style.display = 'none';
            state.locationOther = '';
        }
    });

    document.getElementById('location-other').addEventListener('input', (e) => {
        state.locationOther = e.target.value;
    });

    // Age groups
    document.querySelectorAll('.age-group-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.age-group-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedAge = card.dataset.age;
        });
    });

    // CHD button
    document.getElementById('chd-button').addEventListener('click', () => {
        document.getElementById('chd-dialog').style.display = 'flex';
    });

    document.getElementById('chd-dialog-close').addEventListener('click', () => {
        document.getElementById('chd-dialog').style.display = 'none';
    });

    document.querySelectorAll('.chd-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.chdType = btn.dataset.type;
            document.getElementById('chd-type-display').textContent = 
                btn.dataset.type === 'acyanotic' ? 'Acyanotic CHD' : 'Cyanotic CHD';
            document.getElementById('chd-selected').style.display = 'flex';
            document.getElementById('chd-dialog').style.display = 'none';
        });
    });

    document.getElementById('chd-clear').addEventListener('click', () => {
        state.chdType = '';
        document.getElementById('chd-selected').style.display = 'none';
    });

    // Vital signs
    document.getElementById('temp').addEventListener('input', (e) => {
        state.temperature = e.target.value;
    });
    document.getElementById('pulse').addEventListener('input', (e) => {
        state.pulse = e.target.value;
    });
    document.getElementById('rr').addEventListener('input', (e) => {
        state.rrVitalSign = e.target.value;
    });
    document.getElementById('bp').addEventListener('input', (e) => {
        state.bloodPressure = e.target.value;
    });
    document.getElementById('spo2').addEventListener('input', (e) => {
        state.spo2 = e.target.value;
    });

    // Score cards
    document.querySelectorAll('.score-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            const score = parseInt(card.dataset.score);
            
            document.querySelectorAll(`.score-card[data-category="${category}"]`).forEach(c => {
                c.classList.remove('selected');
            });
            card.classList.add('selected');
            
            if (category === 'behavior') state.behaviorScore = score;
            if (category === 'cardiovascular') state.cardiovascularScore = score;
            if (category === 'respiratory') state.respiratoryScore = score;
            
            updateTotalScore();
        });
    });

    // Additional risk
    document.getElementById('additional-risk').addEventListener('change', (e) => {
        state.additionalRisk = e.target.checked;
        updateTotalScore();
    });

    // PALS button
    document.getElementById('pals-button').addEventListener('click', (e) => {
        state.palsEnabled = !state.palsEnabled;
        e.target.classList.toggle('active');
        updateTotalScore();
    });

    // Notes
    document.getElementById('nursing-notes').addEventListener('input', (e) => {
        state.nursingNotes = e.target.value;
    });

    document.getElementById('transfer-destination').addEventListener('input', (e) => {
        state.transferDestination = e.target.value;
    });

    // Submit
    document.getElementById('submit-button').addEventListener('click', submitRecord);
}

// Update total score
function updateTotalScore() {
    let total = 0;
    
    if (state.behaviorScore !== null) total += state.behaviorScore;
    if (state.cardiovascularScore !== null) total += state.cardiovascularScore;
    if (state.respiratoryScore !== null) total += state.respiratoryScore;
    if (state.additionalRisk) total += 2;
    if (state.palsEnabled) total += 2;
    
    state.totalScore = total;
    
    const scoreDisplay = document.getElementById('total-score-display');
    const scoreValue = document.getElementById('score-value');
    const riskLevel = document.getElementById('risk-level');
    
    scoreValue.textContent = total;
    
    scoreDisplay.classList.remove('low', 'medium', 'high');
    if (total <= 2) {
        scoreDisplay.classList.add('low');
        riskLevel.textContent = 'Risk Level: Low';
    } else if (total <= 4) {
        scoreDisplay.classList.add('medium');
        riskLevel.textContent = 'Risk Level: Medium';
    } else {
        scoreDisplay.classList.add('high');
        riskLevel.textContent = 'Risk Level: High';
    }
}

// Submit record
async function submitRecord() {
    const record = {
        timestamp: new Date().toISOString(),
        ...state
    };
    
    // Save to localStorage
    const records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    records.unshift(record);
    localStorage.setItem('pewsRecords', JSON.stringify(records));
    
    // Submit to Google Form
    try {
        const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScfBir96VFdMNbhFrTx294HIbHky2YBxHs2bzWPn2WCI4krNQ/formResponse';
        const formData = new URLSearchParams();
        
        // Field 1: HN
        formData.append('entry.1151417469', state.hn || '-');
        
        // Field 2: Combined data
        const locationValue = state.location === 'อื่นๆ' ? state.locationOther || state.location : state.location;
        const allDataParts = [];
        allDataParts.push(`Location: ${locationValue}`);
        
        if (state.selectedAge) {
            const ageGroup = ageGroups.find(a => a.id === state.selectedAge);
            allDataParts.push(`Age Group: ${ageGroup.name}`);
        }
        
        allDataParts.push(`Total PEWS Score: ${state.totalScore}`);
        allDataParts.push(`PALS: ${state.palsEnabled ? 'Enabled' : 'Disabled'}`);
        
        const vitals = [];
        if (state.temperature) vitals.push(`Temp: ${state.temperature}C`);
        if (state.pulse) vitals.push(`PR: ${state.pulse}`);
        if (state.rrVitalSign) vitals.push(`RR: ${state.rrVitalSign}`);
        if (state.bloodPressure) vitals.push(`BP: ${state.bloodPressure}`);
        if (state.spo2) vitals.push(`SpO2: ${state.spo2}%`);
        if (vitals.length > 0) {
            allDataParts.push(`Vital Signs: ${vitals.join(', ')}`);
        }
        
        const scores = [];
        if (state.behaviorScore !== null) scores.push(`Behavior: ${state.behaviorScore}`);
        if (state.cardiovascularScore !== null) scores.push(`Cardio: ${state.cardiovascularScore}`);
        if (state.respiratoryScore !== null) scores.push(`Resp: ${state.respiratoryScore}`);
        if (scores.length > 0) {
            allDataParts.push(`Component Scores: ${scores.join(', ')}`);
        }
        
        if (state.additionalRisk) allDataParts.push('Additional Risk: Yes');
        if (state.chdType) allDataParts.push(`CHD Type: ${state.chdType === 'acyanotic' ? 'Acyanotic' : 'Cyanotic'}`);
        if (state.nursingNotes) allDataParts.push(`Nursing Notes: ${state.nursingNotes}`);
        if (state.transferDestination) allDataParts.push(`Transfer Destination: ${state.transferDestination}`);
        
        formData.append('entry.876819797', allDataParts.join(' | '));
        
        await fetch(formUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString()
        });
        
        alert('บันทึกข้อมูลสำเร็จ!');
    } catch (error) {
        console.error('Error submitting to Google Form:', error);
        alert('บันทึกข้อมูลในเครื่องสำเร็จ (ไม่สามารถส่งไป Google Form ได้)');
    }
    
    loadRecords();
    resetForm();
}

// Load records
function loadRecords() {
    const records = JSON.parse(localStorage.getItem('pewsRecords') || '[]');
    const recordsList = document.getElementById('records-list');
    const recordsSection = document.getElementById('records-section');
    
    if (records.length === 0) {
        recordsSection.style.display = 'none';
        return;
    }
    
    recordsSection.style.display = 'block';
    recordsList.innerHTML = records.slice(0, 10).map(record => {
        const date = new Date(record.timestamp);
        const timeStr = date.toLocaleString('th-TH');
        
        return `
            <div class="record-card">
                <div class="record-header">
                    <div class="record-time">${timeStr}</div>
                    <div class="record-score" style="color: ${record.totalScore <= 2 ? '#16a34a' : record.totalScore <= 4 ? '#d97706' : '#dc2626'}">${record.totalScore}</div>
                </div>
                <div class="record-data">
                    <div class="data-item">
                        <span class="data-label">HN</span>
                        <span class="data-value">${record.hn || '-'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Location</span>
                        <span class="data-value">${record.location === 'อื่นๆ' ? record.locationOther : record.location || '-'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">Temp</span>
                        <span class="data-value">${record.temperature || '-'} °C</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">PR</span>
                        <span class="data-value">${record.pulse || '-'} bpm</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">RR</span>
                        <span class="data-value">${record.rrVitalSign || '-'} tpm</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">BP</span>
                        <span class="data-value">${record.bloodPressure || '-'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-label">SpO₂</span>
                        <span class="data-value">${record.spo2 || '-'} %</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Reset form
function resetForm() {
    state = {
        hn: '',
        location: '',
        locationOther: '',
        selectedAge: null,
        chdType: '',
        temperature: '',
        pulse: '',
        rrVitalSign: '',
        bloodPressure: '',
        spo2: '',
        behaviorScore: null,
        cardiovascularScore: null,
        respiratoryScore: null,
        additionalRisk: false,
        palsEnabled: false,
        nursingNotes: '',
        transferDestination: '',
        totalScore: 0
    };
    
    document.getElementById('hn-input').value = '';
    document.getElementById('location-input').value = '';
    document.getElementById('location-other').value = '';
    document.getElementById('location-other').style.display = 'none';
    document.querySelectorAll('.age-group-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('chd-selected').style.display = 'none';
    document.getElementById('temp').value = '';
    document.getElementById('pulse').value = '';
    document.getElementById('rr').value = '';
    document.getElementById('bp').value = '';
    document.getElementById('spo2').value = '';
    document.querySelectorAll('.score-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('additional-risk').checked = false;
    document.getElementById('pals-button').classList.remove('active');
    document.getElementById('nursing-notes').value = '';
    document.getElementById('transfer-destination').value = '';
    
    updateTotalScore();
}
