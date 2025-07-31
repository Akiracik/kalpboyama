class HeartDrawer {
    constructor() {
        this.canvas = document.getElementById('heartCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.instruction = document.getElementById('instruction');
        this.loveMessage = document.getElementById('loveMessage');
        this.heartRain = document.getElementById('heartRain');
        
        this.isDrawing = false;
        this.filledPixels = new Set();
        this.heartPixels = new Set();
        this.fillPercentage = 0;
        this.isCompleted = false;
        
        this.setupCanvas();
        this.drawHeart();
        this.setupEventListeners();
        this.calculateHeartPixels();
    }
    
    setupCanvas() {
        // Sabit canvas boyutu
        this.canvas.width = 400;
        this.canvas.height = 350;
        
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2 + 20;
        this.scale = 1;
    }
    
    drawHeart() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Önce kalp alanını açık pembe ile doldur (kazınacak alan)
        this.ctx.fillStyle = 'rgba(255, 182, 193, 0.8)'; // Açık pembe
        this.ctx.beginPath();
        
        const size = 6;
        
        for (let t = 0; t <= 2 * Math.PI; t += 0.01) {
            const x = this.centerX + size * (16 * Math.pow(Math.sin(t), 3));
            const y = this.centerY - size * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
            
            if (t === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Sonra beyaz çerçeve çiz
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        this.ctx.stroke();
        
        // Shadow'u temizle
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    calculateHeartPixels() {
        this.heartPixels.clear();
        
        // Kalp alanındaki tüm pikselleri hesapla
        for (let x = 0; x < this.canvas.width; x++) {
            for (let y = 0; y < this.canvas.height; y++) {
                if (this.isInsideHeart(x, y)) {
                    this.heartPixels.add(`${x},${y}`);
                }
            }
        }
    }
    
    isInsideHeart(x, y) {
        const size = 6;
        
        // Kalp merkezinden olan mesafe
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        
        // Daha sıkı kontrol: kalp şeklinin içinde mi?
        const relX = dx / (size * 16);
        const relY = -dy / (size * 13);
        
        // Kalp denklemi: ((x^2 + y^2 - 1)^3) - x^2*y^3 <= 0
        const equation = Math.pow((relX*relX + relY*relY - 1), 3) - relX*relX*Math.pow(relY, 3);
        return equation <= -0.05; // Daha sıkı sınır
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawHeart();
            this.calculateHeartPixels();
            this.redrawFilledAreas();
        });
    }
    
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    startDrawing(e) {
        if (this.isCompleted) return;
        this.isDrawing = true;
        this.draw(e);
    }
    
    draw(e) {
        if (!this.isDrawing || this.isCompleted) return;
        
        const pos = this.getEventPos(e);
        
        // Önce tıklanan noktanın kalp içinde olup olmadığını kontrol et
        if (!this.isInsideHeart(pos.x, pos.y)) return;
        
        const brushSize = 10; // Daha büyük fırça - hızlı boyama
        
        // Hızlı boyama için daha büyük fırça
        for (let dx = -brushSize; dx <= brushSize; dx++) {
            for (let dy = -brushSize; dy <= brushSize; dy++) {
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance <= brushSize) {
                    const x = Math.round(pos.x + dx);
                    const y = Math.round(pos.y + dy);
                    
                    // Sadece kalp içindeki pikselleri boyayabilir
                    if (this.isInsideHeart(x, y) && x >= 0 && y >= 0 && x < this.canvas.width && y < this.canvas.height) {
                        const key = `${x},${y}`;
                        if (!this.filledPixels.has(key)) {
                            this.filledPixels.add(key);
                            this.fillPixel(x, y);
                        }
                    }
                }
            }
        }
        
        this.updateFillPercentage();
    }
    
    fillPixel(x, y) {
        this.ctx.fillStyle = '#ff1744'; // Kırmızı kalp rengi
        this.ctx.fillRect(x - 1, y - 1, 3, 3); // Daha büyük piksel - hızlı boyama
    }
    
    updateFillPercentage() {
        this.fillPercentage = (this.filledPixels.size / this.heartPixels.size) * 100;
        
        // %50 dolduğunda tamamla - daha hızlı
        if (this.fillPercentage >= 50 && !this.isCompleted) {
            this.completeHeart();
        }
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    redrawFilledAreas() {
        this.filledPixels.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            this.fillPixel(x, y);
        });
    }
    
    completeHeart() {
        this.isCompleted = true;
        this.instruction.style.display = 'none';
        
        // Kalbi tamamen doldur - kalp şeklinde
        this.fillCompleteHeart();
        
        // Animasyonları başlat
        setTimeout(() => this.startShaking(), 500);
        setTimeout(() => this.explodeHeart(), 2000);
        setTimeout(() => this.showLoveMessage(), 3000);
        setTimeout(() => this.startHeartRain(), 3500);
    }
    
    fillCompleteHeart() {
        // Kalp şeklini tamamen doldur - piksel piksel
        for (let x = 0; x < this.canvas.width; x++) {
            for (let y = 0; y < this.canvas.height; y++) {
                if (this.isInsideHeart(x, y)) {
                    this.ctx.fillStyle = '#ff1744';
                    this.ctx.fillRect(x, y, 1, 1);
                }
            }
        }
        
        // Beyaz çerçeveyi tekrar çiz
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        this.ctx.beginPath();
        const size = 6;
        
        for (let t = 0; t <= 2 * Math.PI; t += 0.01) {
            const x = this.centerX + size * (16 * Math.pow(Math.sin(t), 3));
            const y = this.centerY - size * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
            
            if (t === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Shadow'u temizle
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }
    
    startShaking() {
        this.canvas.classList.add('heart-shake');
    }
    
    explodeHeart() {
        this.canvas.classList.remove('heart-shake');
        
        // Kalp şeklinde patlama efekti
        let scale = 1;
        let opacity = 1;
        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.translate(this.centerX, this.centerY);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-this.centerX, -this.centerY);
            
            // Kalp şeklini çiz - patlama sırasında da kalp şeklinde
            this.ctx.fillStyle = '#ff1744';
            this.ctx.beginPath();
            
            const size = 6;
            
            for (let t = 0; t <= 2 * Math.PI; t += 0.01) {
                const x = this.centerX + size * (16 * Math.pow(Math.sin(t), 3));
                const y = this.centerY - size * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
                
                if (t === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.restore();
            
            scale += 0.08;
            opacity -= 0.03;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    showLoveMessage() {
        this.loveMessage.classList.add('show');
    }
    
    startHeartRain() {
        const hearts = ['💖', '💕', '💗', '💓', '💝', '💘', '💞', '💟'];
        
        setInterval(() => {
            const heart = document.createElement('div');
            heart.className = 'falling-heart';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = Math.random() * 100 + '%';
            heart.style.animationDuration = (Math.random() * 3 + 2) + 's';
            heart.style.fontSize = (Math.random() * 10 + 15) + 'px';
            
            this.heartRain.appendChild(heart);
            
            // Kalbi 5 saniye sonra kaldır
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 5000);
        }, 200);
    }
}

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new HeartDrawer();
});