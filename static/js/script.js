// DOM Elementleri
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const changeImageBtn = document.getElementById('changeImageBtn');
const actionSection = document.getElementById('actionSection');
const predictBtn = document.getElementById('predictBtn');
const predictBtnText = document.getElementById('predictBtnText');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const loadingOverlay = document.getElementById('loadingOverlay');
const resultIcon = document.getElementById('resultIcon');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');
const confidenceFill = document.getElementById('confidenceFill');
const confidencePercentage = document.getElementById('confidencePercentage');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Global değişkenler
let selectedFile = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());
    selectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Other buttons
    changeImageBtn.addEventListener('click', () => fileInput.click());
    predictBtn.addEventListener('click', handlePredict);
    retryBtn.addEventListener('click', resetApp);
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragOver(e) {
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    
    if (files.length > 0) {
        const file = files[0];
        if (isValidImageFile(file)) {
            selectedFile = file;
            showImagePreview(file);
        } else {
            showError('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, GIF, etc.)');
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    
    if (file) {
        if (isValidImageFile(file)) {
            selectedFile = file;
            showImagePreview(file);
        } else {
            showError('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, GIF, etc.)');
        }
    }
}

function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    return validTypes.includes(file.type);
}

function showImagePreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        
        // Bölümleri göster/gizle
        hideAllSections();
        previewSection.style.display = 'block';
        actionSection.style.display = 'block';
        
        // Smooth scroll to preview
        setTimeout(() => {
            previewSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    };
    
    reader.readAsDataURL(file);
}

async function handlePredict() {
    if (!selectedFile) {
        showError('Lütfen önce bir resim seçin');
        return;
    }
    
    // Loading durumunu göster
    showLoading();
    updatePredictButton(true);
    
    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResults(data);
        } else {
            throw new Error(data.error || 'Tahmin yapılırken bir hata oluştu');
        }
        
    } catch (error) {
        console.error('Tahmin hatası:', error);
        showError(error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
        hideLoading();
        updatePredictButton(false);
    }
}

function showResults(data) {
    const { prediction, confidence } = data;
    
    // Sonuç ikonunu güncelle
    const isKedi = prediction.toLowerCase().includes('kedi');
    const icon = isKedi ? 'fas fa-cat' : 'fas fa-dog';
    const iconClass = isKedi ? 'cat' : 'dog';
    
    resultIcon.innerHTML = `<i class="${icon}"></i>`;
    resultIcon.className = `result-icon ${iconClass}`;
    
    // Sonuç metnini güncelle
    resultTitle.textContent = `Bu bir ${prediction}!`;
    resultText.textContent = `AI modelimiz bu resmin ${prediction.toLowerCase()} olduğunu %${confidence} güvenle tespit etti.`;
    
    // Güven oranını animasyonla göster
    setTimeout(() => {
        confidenceFill.style.width = `${confidence}%`;
        confidencePercentage.textContent = `${confidence}%`;
    }, 500);
    
    // Bölümleri göster/gizle
    hideAllSections();
    previewSection.style.display = 'block';
    resultsSection.style.display = 'block';
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 100);
    
    // Başarı sesi çal (opsiyonel)
    playSuccessSound();
}

function showError(message) {
    errorMessage.textContent = message;
    
    // Bölümleri göster/gizle
    hideAllSections();
    if (selectedFile) {
        previewSection.style.display = 'block';
    }
    errorSection.style.display = 'block';
    
    // Smooth scroll to error
    setTimeout(() => {
        errorSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }, 100);
    
    // Hata sesi çal (opsiyonel)
    playErrorSound();
}

function showLoading() {
    loadingOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updatePredictButton(isLoading) {
    if (isLoading) {
        predictBtn.disabled = true;
        predictBtn.classList.add('loading');
        predictBtnText.textContent = 'Analiz Ediliyor...';
        predictBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Analiz Ediliyor...</span>';
    } else {
        predictBtn.disabled = false;
        predictBtn.classList.remove('loading');
        predictBtnText.textContent = 'Analiz Et';
        predictBtn.innerHTML = '<i class="fas fa-brain"></i> <span>Analiz Et</span>';
    }
}

function hideAllSections() {
    previewSection.style.display = 'none';
    actionSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    
    // Güven oranını sıfırla
    confidenceFill.style.width = '0%';
    confidencePercentage.textContent = '0%';
    
    // Tüm bölümleri gizle
    hideAllSections();
    
    // Upload alanına smooth scroll
    uploadArea.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
    
    // Upload area animasyonu
    uploadArea.style.transform = 'scale(1.02)';
    setTimeout(() => {
        uploadArea.style.transform = 'scale(1)';
    }, 200);
}

// Ses efektleri (opsiyonel)
function playSuccessSound() {
    try {
        // Web Audio API kullanarak basit bir başarı sesi
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        // Ses çalınamazsa sessizce devam et
        console.log('Ses çalınamadı:', e);
    }
}

function playErrorSound() {
    try {
        // Web Audio API kullanarak basit bir hata sesi
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
        // Ses çalınamazsa sessizce devam et
        console.log('Ses çalınamadı:', e);
    }
}

// Dosya boyutu kontrolü
function checkFileSize(file) {
    const maxSize = 16 * 1024 * 1024; // 16MB
    
    if (file.size > maxSize) {
        showError('Dosya boyutu çok büyük. Maksimum 16MB dosya yükleyebilirsiniz.');
        return false;
    }
    
    return true;
}

// Gelişmiş dosya validasyonu
function validateImageFile(file) {
    // Dosya tipi kontrolü
    if (!isValidImageFile(file)) {
        showError('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, GIF, BMP, WebP)');
        return false;
    }
    
    // Dosya boyutu kontrolü
    if (!checkFileSize(file)) {
        return false;
    }
    
    return true;
}

// Gelişmiş hata yakalama
window.addEventListener('error', function(e) {
    console.error('Global hata:', e.error);
    showError('Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi deneyin.');
});

// Network durumu kontrolü
window.addEventListener('online', function() {
    console.log('İnternet bağlantısı geri geldi');
});

window.addEventListener('offline', function() {
    console.log('İnternet bağlantısı kesildi');
    showError('İnternet bağlantınız kesildi. Lütfen bağlantınızı kontrol edin.');
});

// Performance optimizasyonu için debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Esc tuşu ile reset
    if (e.key === 'Escape') {
        resetApp();
    }
    
    // Enter tuşu ile tahmin
    if (e.key === 'Enter' && selectedFile && !predictBtn.disabled) {
        handlePredict();
    }
    
    // Space tuşu ile dosya seçimi
    if (e.key === ' ' && !selectedFile) {
        e.preventDefault();
        fileInput.click();
    }
});

// Paste ile resim yapıştırma
document.addEventListener('paste', function(e) {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (validateImageFile(file)) {
                selectedFile = file;
                showImagePreview(file);
            }
            break;
        }
    }
});

// Sayfa yüklenme performansı
document.addEventListener('DOMContentLoaded', function() {
    // Lazy loading simulation
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Analytics ve kullanıcı etkileşimi takibi (opsiyonel)
function trackEvent(eventName, eventData = {}) {
    console.log(`Event: ${eventName}`, eventData);
    // Burada Google Analytics veya başka bir analitik servis kullanabilirsiniz
}

// Event tracking
uploadArea.addEventListener('click', () => trackEvent('upload_area_clicked'));
predictBtn.addEventListener('click', () => trackEvent('predict_button_clicked'));

console.log('🐱🐶 Kedi-Köpek Sınıflandırıcı yüklendi!');
console.log('Geliştirici ipuçları:');
console.log('- ESC: Uygulamayı sıfırla');
console.log('- ENTER: Tahmin yap (resim seçiliyse)');
console.log('- SPACE: Dosya seç');
console.log('- Ctrl+V: Panoya kopyalanmış resmi yapıştır');