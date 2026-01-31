const stage = document.getElementById('stage');
const snapToggle = document.getElementById('snapToggle');
const colorPicker = document.getElementById('colorPicker');
const counterDisplay = document.getElementById('counter-display');

let selectedElements = []; 
let clipboard = [];

const SNAP_SIZE = 5;

// 楽器のマスターデータ
const INSTRUMENTS = {
    conductor:  { icon: '指', color: '#333', textColor: '#fff', label: ' ', btnLabel: '指揮者', shape: 'square', hasBorder: true },
    chair:      { icon: 'O', color: '#ffadad', label: ' ',       btnLabel: '椅子',   shape: 'circle', hasBorder: true },
    cello:      { icon: 'ﾋﾟｱﾉ', color: '#ffd6a5', label: ' ',     btnLabel: 'ピアノ椅子', shape: 'circle', hasBorder: true },
    cb:         { icon: 'ﾊﾞｽ', color: '#fdffb6', label: ' ',     btnLabel: 'バス椅子', shape: 'circle', hasBorder: true },
    harp:       { icon: 'Hp',  color: '#caffbf', label: ' ',     btnLabel: 'ハープ', shape: 'square', hasBorder: true },
    harp_chair: { icon: 'H席', color: '#caffbf', label: ' ',       btnLabel: 'ハープ椅子', shape: 'circle', hasBorder: true },
    percussion: { icon: '打', color: '#ffc6ff', label: '打楽器',  btnLabel: '打楽器', shape: 'square', hasBorder: true },
    stand:      { icon: 'X',   color: '#dddddd', label: ' ',       btnLabel: '譜面台', shape: 'square', hasBorder: false }
};

// --- 基本機能 ---

function changeHallBackground() {
    const hall = document.getElementById('hallSelect').value;
    stage.className = ''; 
    if (hall !== 'none') stage.classList.add(hall);
}

function updateCount() {
    const counts = {};
    stage.querySelectorAll('.item').forEach(item => {
        const iconText = item.querySelector('.icon').innerText;
        counts[iconText] = (counts[iconText] || 0) + 1;
    });
    const textParts = [];
    for (let key in INSTRUMENTS) {
        const info = INSTRUMENTS[key];
        const num = counts[info.icon] || 0;
        if (num > 0) textParts.push(`${info.btnLabel}:${num}個`);
    }
    counterDisplay.innerText = textParts.length > 0 ? `【現在の楽器数】 ${textParts.join(' / ')}` : "舞台には何もありません";
}

function addItem(type) {
    const data = INSTRUMENTS[type];
    const size = document.getElementById('sizeSelect').value;
    const div = document.createElement('div');
    div.className = 'item';
    div.style.width = size + 'px';
    div.style.height = size + 'px';
    div.style.backgroundColor = data.color;
    div.style.color = data.textColor || '#000';
    if (data.shape === 'circle') div.style.borderRadius = '50%';
    div.style.border = data.hasBorder ? "2px solid #333" : "none";
    const fontSize = Math.floor(size / 2.5);
    div.style.fontSize = fontSize + 'px';
    div.style.left = '40px'; 
    div.style.top = '40px';
    div.innerHTML = `<span class="icon">${data.icon}</span><span class="label" style="display:none;"> </span>`;
    
    setupItemEvents(div);
    stage.appendChild(div);
    updateCount();
}

// --- イベント設定（移動・選択・編集） ---

function setupItemEvents(div) {
    // クリックで選択
    div.onclick = (e) => {
        e.stopPropagation();
        if (e.shiftKey) {
            if (selectedElements.includes(div)) {
                div.classList.remove('selected');
                selectedElements = selectedElements.filter(el => el !== div);
            } else {
                div.classList.add('selected');
                selectedElements.push(div);
            }
        } else {
            clearSelection();
            selectedElements = [div];
            div.classList.add('selected');
            colorPicker.value = rgbToHex(div.style.backgroundColor);
        }
    };

    // ダブルクリックで名前
    div.ondblclick = (e) => {
        const labelEl = div.querySelector('.label');
        const newName = prompt("名前（パート・奏者）を入力してください:", labelEl.innerText);
        if (newName !== null) {
            labelEl.innerText = newName;
            labelEl.style.display = newName.trim() === "" ? "none" : "block";
        }
    };

    // ドラッグ移動
    // --- マウスと指、両方に対応した移動処理 ---
    div.onpointerdown = function(event) {
        // 左クリックまたはタッチ以外は無視
        if (event.button !== 0 && event.pointerType === 'mouse') return;

        // 選択状態の管理
        if (!selectedElements.includes(div)) {
            clearSelection();
            div.classList.add('selected');
            selectedElements = [div];
        }

        const stageRect = stage.getBoundingClientRect();
        const startPositions = selectedElements.map(el => ({
            el: el,
            startX: parseInt(el.style.left) || 0,
            startY: parseInt(el.style.top) || 0
        }));

        const mouseStartX = event.clientX;
        const mouseStartY = event.clientY;

        // 要素にポインターをキャプチャ（指が要素から外れても追従させる）
        div.setPointerCapture(event.pointerId);

        const onPointerMove = (e) => {
            const dx = e.clientX - mouseStartX;
            const dy = e.clientY - mouseStartY;

            startPositions.forEach(pos => {
                let newX = pos.startX + dx;
                let newY = pos.startY + dy;

                if (snapToggle.checked) {
                    newX = Math.round(newX / SNAP_SIZE) * SNAP_SIZE;
                    newY = Math.round(newY / SNAP_SIZE) * SNAP_SIZE;
                }

                pos.el.style.left = newX + 'px';
                pos.el.style.top = newY + 'px';
            });
        };

        const onPointerUp = (e) => {
            div.releasePointerCapture(e.pointerId);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            updateCount();
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    // ドラッグ開始の既定動作をオフ（これがないと指で長押しした時に画像保存メニュー等が出る）
    div.ondragstart = () => false;

}

// --- 操作機能 ---

function deleteSelected() {
    if (selectedElements.length > 0 && confirm(`${selectedElements.length}個を削除しますか？`)) {
        selectedElements.forEach(el => el.remove());
        selectedElements = [];
        updateCount();
    }
}

function clearAll() {
    if (confirm('舞台を空にしますか？')) {
        stage.innerHTML = '';
        selectedElements = [];
        updateCount();
    }
}

function changeColor() {
    selectedElements.forEach(el => el.style.backgroundColor = colorPicker.value);
}

// --- 保存・読み込み ---

function saveLayout() {
    const items = [];
    const hall = document.getElementById('hallSelect').value;
    const leftRatio = parseInt(div.style.left) / stage.offsetWidth;
    const topRatio = parseInt(div.style.top) / stage.offsetHeight;

    stage.querySelectorAll('.item').forEach(div => {
        items.push({
            icon: div.querySelector('.icon').innerText,
            label: div.querySelector('.label').innerText,
            isLabelVisible: div.querySelector('.label').style.display !== 'none',
            left: div.style.left,
            top: div.style.top,
            backgroundColor: div.style.backgroundColor,
            textColor: div.style.color,
            borderRadius: div.style.borderRadius,
            border: div.style.border,
            width: div.style.width,
            height: div.style.height,
            fontSize: div.style.fontSize
        });
    });
    const data = JSON.stringify({ hall: hall, items: items });
    localStorage.setItem('stageLayout_quick', data);
    alert('現在の配置を保存しました！');
}

function loadLayout() {
    const data = localStorage.getItem('stageLayout_quick');
    if (!data) return;
    const parsed = JSON.parse(data);
    const items = parsed.items || [];
    if (parsed.hall) {
        document.getElementById('hallSelect').value = parsed.hall;
        changeHallBackground();
    }
    stage.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.style.left = item.left; div.style.top = item.top;
        div.style.backgroundColor = item.backgroundColor;
        div.style.color = item.textColor;
        div.style.borderRadius = item.borderRadius;
        div.style.border = item.border;
        div.style.width = item.width; div.style.height = item.height;
        div.style.fontSize = item.fontSize;
        div.innerHTML = `<span class="icon">${item.icon}</span><span class="label" style="display:${item.isLabelVisible?'block':'none'}">${item.label}</span>`;
        setupItemEvents(div);
        stage.appendChild(div);
    });
    updateCount();
}

// --- PNG書き出し ---
function exportImage() {
    clearSelection();
    const stageClone = stage.cloneNode(true);
    stageClone.style.border = "none";
    const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${stage.offsetWidth}" height="${stage.offsetHeight}">
            <foreignObject width="100%" height="100%">
                <div xmlns="http://www.w3.org/1999/xhtml">${new XMLSerializer().serializeToString(stageClone)}</div>
            </foreignObject>
        </svg>`;
    const canvas = document.createElement('canvas');
    canvas.width = stage.offsetWidth; canvas.height = stage.offsetHeight;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = 'orchestra_layout.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
}

// --- ヘルパー ---

function clearSelection() {
    selectedElements.forEach(el => el.classList.remove('selected'));
    selectedElements = [];
}

function rgbToHex(rgb) {
    if (!rgb || !rgb.startsWith('rgb')) return rgb || '#ffffff';
    const vals = rgb.match(/\d+/g);
    return "#" + vals.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

// --- 初期化 ---
Object.keys(INSTRUMENTS).forEach(key => {
    const btn = document.createElement('button');
    const info = INSTRUMENTS[key];
    
    // アイコンとラベルを両方入れる
    btn.innerHTML = `
        <span class="btn-icon">${info.icon}</span>
        <span>${info.btnLabel}</span>
    `;
    
    btn.onclick = () => addItem(key);
    document.getElementById('button-container').appendChild(btn);
});

stage.onclick = () => clearSelection();
window.onload = loadLayout;

// コピー＆ペースト
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'c' && selectedElements.length > 0) {
        clipboard = selectedElements.map(el => ({
            icon: el.querySelector('.icon').innerText,
            label: el.querySelector('.label').innerText,
            isLabelVisible: el.querySelector('.label').style.display !== 'none',
            backgroundColor: el.style.backgroundColor,
            textColor: el.style.color,
            borderRadius: el.style.borderRadius,
            border: el.style.border,
            width: el.style.width, height: el.style.height, fontSize: el.style.fontSize
        }));
    }
    if (e.ctrlKey && e.key === 'v' && clipboard.length > 0) {
        clearSelection();
        clipboard.forEach(data => {
            const div = document.createElement('div');
            div.className = 'item';
            Object.assign(div.style, {
                backgroundColor: data.backgroundColor, color: data.textColor,
                borderRadius: data.borderRadius, border: data.border,
                width: data.width, height: data.height, fontSize: data.fontSize,
                left: '60px', top: '60px', position: 'absolute'
            });
            div.innerHTML = `<span class="icon">${data.icon}</span><span class="label" style="display:${data.isLabelVisible?'block':'none'}">${data.label}</span>`;
            setupItemEvents(div);
            stage.appendChild(div);
            div.classList.add('selected');
            selectedElements.push(div);
        });
        updateCount();
    }
});