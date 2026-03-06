/* --- ALL JAVASCRIPT LOGIC --- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function initDOM() {
    const grid = document.getElementById('dram-grid');
    for(let i=0; i<16; i++) {
        let cell = document.createElement('div');
        cell.className = 'g-cell'; cell.id = `gc-${i}`; cell.innerText = rand(10, 99);
        grid.appendChild(cell);
    }
    const svg = document.getElementById('nn-svg');
    const inY = ['17%', '39%', '61%', '83%'];
    const outY = ['28%', '50%', '72%'];
    for(let i=0; i<4; i++) {
        for(let j=0; j<3; j++) {
            let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '30%'); line.setAttribute('y1', inY[i]);
            line.setAttribute('x2', '70%'); line.setAttribute('y2', outY[j]);
            line.setAttribute('class', 'svg-line'); line.id = `line-${i}-${j}`;
            svg.appendChild(line);
        }
    }
}

function initChart() {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    Chart.defaults.color = '#8b949e';
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                'WTM (AND+CSA+CPA)', 'MBE-R2', 'MBE-R4 + GPC', 'MBE-R4 Multiplier',
                'Approx. Multiplier', 'MBE-R8+Comp+CLA', 'MBE-R8 + GPC', 'MBE-R8 Multiplier',
                'MBE-R4 (PP Gen)', 'MBE-R8 (PP Gen)', 'MBE-R4+Comp+CPA', 'WTM (AND+CSA)'
            ],
            datasets: [
                {
                    label: 'Power (µW)',
                    data: [50.2, 22.2, 47.93, 32.8, 47.9, 419, 233.25, 196.7, 11.4, 9.47, 264, 65],
                    backgroundColor: 'rgba(255, 0, 128, 0.8)', 
                    borderColor: '#ff0080',
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y'
                },
                {
                    label: 'Area (µm²)',
                    data: [1650, 1145.16, 3623.04, 1223, 1260.72, 3404.88, 4670.28, 2023.92, 244.8, 96.84, 8337.96, 1740],
                    backgroundColor: 'rgba(0, 255, 204, 0.8)', 
                    borderColor: '#00ffcc',
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(17, 17, 17, 0.95)', titleColor: '#00ffcc',
                    bodyColor: '#ffffff', borderColor: '#30363d', borderWidth: 1, padding: 12
                },
                legend: { position: 'top', labels: { color: '#ffffff', usePointStyle: true, boxWidth: 8 } }
            },
            scales: {
                x: { grid: { color: '#30363d', drawBorder: false }, ticks: { maxRotation: 45, minRotation: 45 } },
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Power (µW)', color: '#ff0080' }, grid: { color: '#30363d', drawBorder: false } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Area (µm²)', color: '#00ffcc' }, grid: { drawOnChartArea: false } }
            }
        }
    });
}

async function runSimulation() {
    const packet = document.getElementById('packet');
    const explainer = document.getElementById('explainer');
    
    const nodes = {
        input: document.getElementById('n-input'), tile: document.getElementById('n-tile'),
        conv: document.getElementById('n-conv'), pool: document.getElementById('n-pool'), 
        fc: document.getElementById('n-fc'), out: document.getElementById('n-out')
    };
    const panels = { 
        input: document.getElementById('pe-input'), tile: document.getElementById('pe-tile'), 
        conv: document.getElementById('pe-conv'), pool: document.getElementById('pe-pool'), 
        fc: document.getElementById('pe-fc'), out: document.getElementById('pe-out') 
    };

    // Reset UI
    document.querySelectorAll('.math-node').forEach(n => n.classList.remove('pulse', 'pulse-win'));
    document.querySelectorAll('.svg-line').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.g-cell').forEach(c => c.classList.remove('fetch', 'reuse'));
    for(let i=1; i<=4; i++) document.getElementById(`t-log${i}`).style.color = '#444';
    
    document.getElementById('in-progress').style.width = '0%';
    document.getElementById('scan-line').style.animation = 'none';
    document.getElementById('bar-1').style.width = '0%'; document.getElementById('bar-2').style.width = '0%'; document.getElementById('bar-3').style.width = '0%';
    document.getElementById('final-image-container').style.animation = 'none'; 
    document.getElementById('final-image-container').style.opacity = '0';
    
    packet.style.transition = 'none'; packet.style.left = '0%'; packet.style.opacity = '1';
    await sleep(50); packet.style.transition = 'left 1s linear, opacity 0.3s';

    // --- STEP 1: Input Visual ---
    explainer.innerText = "Step 1: Fetching Raw Image Data into Memory...";
    nodes.input.classList.add('active'); 
    panels.input.classList.add('active');
    
    await sleep(200);
    document.getElementById('in-progress').style.width = '100%'; 
    document.getElementById('scan-line').style.animation = 'scan 1.2s linear forwards';
    await sleep(1200);

    panels.input.classList.remove('active'); nodes.input.classList.remove('active');
    await sleep(400); 

    // --- STEP 2: Memory Tiling ---
    explainer.innerText = "Step 2: Memory Tiling - Optimizing bandwidth via SRAM caching";
    packet.style.left = '16%'; nodes.tile.classList.add('active'); 
    panels.tile.classList.add('active');

    document.getElementById('t-log1').style.color = '#fff';
    const initialTile = [0,1,2, 4,5,6, 8,9,10];
    initialTile.forEach(idx => document.getElementById(`gc-${idx}`).classList.add('fetch'));
    
    await sleep(1200);
    document.getElementById('t-log2').style.color = '#fff';
    await sleep(800);

    document.getElementById('t-log3').style.color = '#fff';
    document.getElementById('t-log4').style.color = '#fff';
    initialTile.forEach(idx => document.getElementById(`gc-${idx}`).classList.remove('fetch'));
    
    const reused = [1,2, 5,6, 9,10];
    reused.forEach(idx => document.getElementById(`gc-${idx}`).classList.add('reuse'));
    const newFetches = [3, 7, 11];
    newFetches.forEach(idx => document.getElementById(`gc-${idx}`).classList.add('fetch'));

    await sleep(2000);
    panels.tile.classList.remove('active'); nodes.tile.classList.remove('active');
    await sleep(400);

    // --- STEP 3: Convolution ---
    explainer.innerText = "Step 3: Convolution PE (Radix-4 + 4:2 Compressors)";
    packet.style.left = '33%'; nodes.conv.classList.add('active'); 
    panels.conv.classList.add('active');
    
    let p1 = 120; let p2 = 60; let p3 = 0; let p4 = 60;
    await sleep(400);
    ['m1','m2','m3','m4'].forEach((id, i) => { 
        document.getElementById(id).innerText = [p1,p2,p3,p4][i]; 
        document.getElementById(id).classList.add('pulse'); 
    });

    await sleep(700);
    document.getElementById('a1').innerText = p1+p2; document.getElementById('a1').classList.add('pulse');
    document.getElementById('a2').innerText = p3+p4; document.getElementById('a2').classList.add('pulse');

    await sleep(700);
    document.getElementById('final-sum').innerText = p1 + p2 + p3 + p4; 
    document.getElementById('final-sum').classList.add('pulse');

    await sleep(1000); 
    panels.conv.classList.remove('active'); nodes.conv.classList.remove('active');
    await sleep(400); 

    // --- STEP 4: Pooling ---
    explainer.innerText = "Step 4: Max Pooling - Hardware comparators scanning feature map";
    packet.style.left = '50%'; nodes.pool.classList.add('active'); 
    panels.pool.classList.add('active');

    let plVals = [45, 180, 22, 90];
    await sleep(400);
    for(let i=0; i<4; i++) {
        let pNode = document.getElementById(`pl${i+1}`);
        pNode.innerText = plVals[i]; pNode.classList.add('pulse');
    }
    await sleep(700);
    document.getElementById('pl-comp').classList.add('pulse');
    await sleep(500);
    document.getElementById('pl2').classList.replace('pulse', 'pulse-win');
    document.getElementById('pl-out').innerText = 180;
    document.getElementById('pl-out').classList.add('pulse-win');

    await sleep(1000);
    panels.pool.classList.remove('active'); nodes.pool.classList.remove('active');
    await sleep(400); 

    // --- STEP 5: FC Layer ---
    explainer.innerText = "Step 5: Dense Fully Connected Layer (Bipartite Graph)";
    packet.style.left = '66%'; nodes.fc.classList.add('active'); 
    panels.fc.classList.add('active');

    await sleep(400);
    for(let i=0; i<4; i++) {
        document.getElementById(`fc-in${i+1}`).innerText = rand(1,9);
        document.getElementById(`fc-in${i+1}`).classList.add('pulse');
    }

    await sleep(500);
    for(let i=0; i<4; i++) {
        for(let j=0; j<3; j++) {
            document.getElementById(`line-${i}-${j}`).classList.add('active');
        }
    }
    
    await sleep(800);
    let outScores = [2, 1, 98];
    for(let j=0; j<3; j++) {
        document.getElementById(`fc-out${j+1}`).innerText = outScores[j];
        document.getElementById(`fc-out${j+1}`).classList.add('pulse');
    }

    await sleep(1000);
    panels.fc.classList.remove('active'); nodes.fc.classList.remove('active');
    await sleep(400); 

    // --- STEP 6: Result / Output ---
    explainer.innerText = "Step 6: Softmax Classification & Object Detection";
    packet.style.left = '83%'; nodes.out.classList.add('active'); 
    panels.out.classList.add('active');

    await sleep(500);
    document.getElementById('bar-1').style.width = '1%';
    document.getElementById('bar-2').style.width = '1%';
    document.getElementById('bar-3').style.width = '98%';

    await sleep(800);
    const finalImg = document.getElementById('final-image-container');
    finalImg.style.opacity = '1';
    finalImg.style.animation = 'pop-image 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';

    await sleep(3000);
    panels.out.classList.remove('active'); nodes.out.classList.remove('active');
    packet.style.opacity = '0';
    
    await sleep(1000);
    runSimulation();
}

// Initialize everything on load
window.onload = () => {
    initDOM();
    initChart();
    runSimulation();
};