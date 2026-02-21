const fileInput = document.getElementById('fileInput');
const pasteBtn = document.getElementById('pasteBtn');
const cameraBtn = document.getElementById('cameraBtn');
const imageSection = document.getElementById('imageSection');
const imageCanvas = document.getElementById('imageCanvas');
const cursorInfo = document.getElementById('cursorInfo');
const cursorColor = document.getElementById('cursorColor');
const eyedropperBtn = document.getElementById('eyedropperBtn');
const autoDetectBtn = document.getElementById('autoDetectBtn');
const resetBtn = document.getElementById('resetBtn');
const colorsSection = document.getElementById('colorsSection');
const colorsGrid = document.getElementById('colorsGrid');
const toast = document.getElementById('toast');

let ctx = null;
let imageData = null;
let isEyedropperActive = false;
let colors = [];

// Initialize canvas context
function initCanvas() {
    ctx = imageCanvas.getContext('2d');
}

// Show toast notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-24');
    toast.classList.add('opacity-100', 'translate-y-0');
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-24');
    }, 2000);
}

// Load image to canvas
function loadImageToCanvas(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            imageCanvas.width = img.width;
            imageCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            imageData = ctx.getImageData(0, 0, img.width, img.height);
            imageSection.classList.remove('hidden');
            colors = [];
            updateColorsGrid();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Load image from URL
function loadImageFromURL(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        imageCanvas.width = img.width;
        imageCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        imageData = ctx.getImageData(0, 0, img.width, img.height);
        imageSection.classList.remove('hidden');
        colors = [];
        updateColorsGrid();
    };
    img.onerror = () => {
        showToast('Failed to load image');
    };
    img.src = url;
}

// Get color at specific coordinates
function getColorAt(x, y) {
    if (!imageData) return null;
    
    const data = imageData.data;
    const index = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
    
    if (index < 0 || index >= data.length) return null;
    
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const a = data[index + 3] / 255;
    
    return { r, g, b, a };
}

// Convert RGB to HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Convert RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

// Add color to list
function addColor(r, g, b) {
    const hex = rgbToHex(r, g, b);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);
    const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    
    // Check if color already exists
    if (colors.some(c => c.hex === hex)) {
        showToast('Color already exists');
        return;
    }
    
    colors.push({ r, g, b, hex, rgb, hsl, hslStr });
    updateColorsGrid();
    showToast('Color added');
}

// Update colors grid
function updateColorsGrid() {
    if (colors.length === 0) {
        colorsGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">No colors extracted yet</p>';
        return;
    }
    
    colorsGrid.innerHTML = colors.map((color, index) => `
        <div class="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105">
            <div class="w-full h-32" style="background-color: ${color.hex}"></div>
            <div class="p-4">
                <div class="font-mono font-bold text-lg mb-2 text-gray-800">${color.hex}</div>
                <div class="text-xs text-gray-600 mb-1">RGB: ${color.rgb}</div>
                <div class="text-xs text-gray-600 mb-3">HSL: ${color.hslStr}</div>
                <button class="w-full px-4 py-2 bg-gray-100 hover:bg-purple-600 hover:text-white text-gray-700 rounded-lg text-sm font-semibold transition-all duration-200 copy-btn" data-index="${index}">
                    Copy HEX
                </button>
            </div>
        </div>
    `).join('');
    
    // Bind copy button events
    colorsGrid.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(e.target.dataset.index);
            copyColor(colors[index].hex);
        });
    });
    
    // Click color card to copy
    colorsGrid.querySelectorAll('.bg-white.rounded-xl').forEach((card, index) => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) return;
            copyColor(colors[index].hex);
        });
    });
}

// Copy color to clipboard
function copyColor(color) {
    navigator.clipboard.writeText(color).then(() => {
        showToast(`Copied: ${color}`);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = color;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`Copied: ${color}`);
    });
}

// Handle eyedropper tool
function handleEyedropper(e) {
    if (!isEyedropperActive || !imageData) return;
    
    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const color = getColorAt(x, y);
    if (color) {
        const hex = rgbToHex(color.r, color.g, color.b);
        cursorInfo.classList.remove('hidden');
        cursorInfo.style.left = (e.clientX - rect.left + 20) + 'px';
        cursorInfo.style.top = (e.clientY - rect.top + 20) + 'px';
        
        const colorPreview = cursorInfo.querySelector('div');
        colorPreview.style.backgroundColor = hex;
        cursorColor.textContent = hex;
    }
}

// Handle canvas click
function handleCanvasClick(e) {
    if (!isEyedropperActive || !imageData) return;
    
    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const color = getColorAt(x, y);
    if (color) {
        addColor(color.r, color.g, color.b);
    }
}

// Auto detect dominant colors (simplified K-means)
function autoDetectColors() {
    if (!imageData) return;
    
    const data = imageData.data;
    const sampleSize = 10000;
    const pixels = [];
    
    // Random sample pixels
    for (let i = 0; i < sampleSize; i++) {
        const index = Math.floor(Math.random() * (data.length / 4)) * 4;
        pixels.push({
            r: data[index],
            g: data[index + 1],
            b: data[index + 2]
        });
    }
    
    // Simplified K-means, extract 5 dominant colors
    const k = 5;
    const clusters = [];
    
    // Initialize cluster centers (random selection)
    for (let i = 0; i < k; i++) {
        const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
        clusters.push({
            r: randomPixel.r,
            g: randomPixel.g,
            b: randomPixel.b,
            pixels: []
        });
    }
    
    // Iterate 5 times
    for (let iter = 0; iter < 5; iter++) {
        // Clear clusters
        clusters.forEach(c => c.pixels = []);
        
        // Assign pixels to nearest cluster
        pixels.forEach(pixel => {
            let minDist = Infinity;
            let nearestCluster = 0;
            
            clusters.forEach((cluster, idx) => {
                const dist = Math.sqrt(
                    Math.pow(pixel.r - cluster.r, 2) +
                    Math.pow(pixel.g - cluster.g, 2) +
                    Math.pow(pixel.b - cluster.b, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestCluster = idx;
                }
            });
            
            clusters[nearestCluster].pixels.push(pixel);
        });
        
        // Update cluster centers
        clusters.forEach(cluster => {
            if (cluster.pixels.length > 0) {
                const avg = cluster.pixels.reduce((acc, p) => ({
                    r: acc.r + p.r,
                    g: acc.g + p.g,
                    b: acc.b + p.b
                }), { r: 0, g: 0, b: 0 });
                
                cluster.r = Math.round(avg.r / cluster.pixels.length);
                cluster.g = Math.round(avg.g / cluster.pixels.length);
                cluster.b = Math.round(avg.b / cluster.pixels.length);
            }
        });
    }
    
    // Sort by pixel count, take top 5
    clusters.sort((a, b) => b.pixels.length - a.pixels.length);
    
    // Clear existing colors and add new ones
    colors = [];
    clusters.slice(0, 5).forEach(cluster => {
        if (cluster.pixels.length > 0) {
            addColor(cluster.r, cluster.g, cluster.b);
        }
    });
    
    showToast('Dominant colors detected');
}

// Event listeners
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        loadImageToCanvas(e.target.files[0]);
    }
});

pasteBtn.addEventListener('click', async () => {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
            if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                const blob = await item.getType(item.types.find(t => t.startsWith('image/')));
                loadImageToCanvas(blob);
                showToast('Image pasted');
                return;
            }
        }
        showToast('No image in clipboard');
    } catch (err) {
        showToast('Press Ctrl+V (Cmd+V) to paste image');
    }
});

// Listen for global paste event
document.addEventListener('paste', (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            loadImageToCanvas(blob);
            showToast('Image pasted');
            break;
        }
    }
});

cameraBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            loadImageToCanvas(e.target.files[0]);
        }
    };
    input.click();
});

eyedropperBtn.addEventListener('click', () => {
    isEyedropperActive = !isEyedropperActive;
    if (isEyedropperActive) {
        eyedropperBtn.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300');
        eyedropperBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600');
        imageCanvas.style.cursor = 'crosshair';
        showToast('Eyedropper tool activated - Click on image to pick colors');
    } else {
        eyedropperBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
        eyedropperBtn.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300');
        imageCanvas.style.cursor = 'default';
        cursorInfo.classList.add('hidden');
    }
});

autoDetectBtn.addEventListener('click', () => {
    autoDetectColors();
});

resetBtn.addEventListener('click', () => {
    imageSection.classList.add('hidden');
    colors = [];
    updateColorsGrid();
    isEyedropperActive = false;
    eyedropperBtn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600');
    eyedropperBtn.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300');
    imageCanvas.style.cursor = 'default';
    showToast('Reset');
});

imageCanvas.addEventListener('mousemove', handleEyedropper);
imageCanvas.addEventListener('click', handleCanvasClick);
imageCanvas.addEventListener('mouseleave', () => {
    cursorInfo.classList.add('hidden');
});

// Initialize
initCanvas();
