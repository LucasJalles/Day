// === CONTROLE DO PRELOADER E EXIBIÇÃO INICIAL ===
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const timelineContainer = document.querySelector('.timeline-container');
    
    if (preloader) {
        preloader.style.opacity = '0';
        preloader.addEventListener('transitionend', () => {
            preloader.style.display = 'none';
        });
    }

    if (timelineContainer) {
        timelineContainer.style.opacity = '1';
    }
});


// === LÓGICA PRINCIPAL DA PÁGINA (SCROLL, ANIMAÇÕES, ETC.) ===
(() => {
    // Espera o documento carregar para iniciar tudo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const sections = Array.from(document.querySelectorAll('section'));
        if (sections.length === 0) return;

        // --- FUNÇÃO DA MÁQUINA DE ESCREVER ---
        function typeWriter(element, speed = 85) {
            const textToType = element.getAttribute('data-text');
            if (!textToType || element.hasAttribute('data-typed')) return;
            element.setAttribute('data-typed', 'true');
            element.classList.add('typing-cursor');
            let i = 0;
            element.innerHTML = '';
            function type() {
                if (i < textToType.length) {
                    element.innerHTML += textToType.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.classList.remove('typing-cursor');
                    element.classList.add('finished-typing');
                }
            }
            type();
        }

        // --- OBSERVADOR PARA ATIVAR ANIMAÇÕES QUANDO VISÍVEIS ---
        const animationObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    section.classList.add('active');
                    const typewriterElements = section.querySelectorAll('.typewriter-text');
                    typewriterElements.forEach((el, index) => {
                        setTimeout(() => {
                            typeWriter(el);
                        }, 300 * (index + 1));
                    });
                    observer.unobserve(section);
                }
            });
        }, { threshold: 0.4 });

        sections.forEach(section => {
            animationObserver.observe(section);
        });

        // ========================================================================
        // === LÓGICA DE SCROLL POR SEÇÃO E AUTO-SCROLL (LÓGICA REFINADA) ===
        // ========================================================================
        let isScrolling = false;
        let autoScrollTimer = null; // Único timer para controlar o auto-scroll

        function getCurrentSectionIndex() {
            let closestIndex = 0;
            sections.forEach((section, index) => {
                const { top } = section.getBoundingClientRect();
                if (Math.abs(top) < Math.abs(sections[closestIndex].getBoundingClientRect().top)) {
                    closestIndex = index;
                }
            });
            return closestIndex;
        }
        
        function scrollToSection(index) {
            if (isScrolling || index < 0 || index >= sections.length) return;
            isScrolling = true;
            sections[index].scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                isScrolling = false;
            }, 800); 
        }

        // --- LÓGICA DE AUTO-SCROLL REFINADA ---
        function stopAutoScroll() {
            clearTimeout(autoScrollTimer);
            autoScrollTimer = null;
        }
        
        function scheduleNextAutoScroll() {
            stopAutoScroll(); // Sempre cancela o timer anterior antes de agendar um novo
            const intervalTime = 9000; // 12 segundos

            autoScrollTimer = setTimeout(() => {
                const currentIndex = getCurrentSectionIndex();
                if (currentIndex < sections.length - 1) {
                    scrollToSection(currentIndex + 1);
                    scheduleNextAutoScroll(); // Agenda o próximo avanço
                }
            }, intervalTime);
        }

        // --- Listeners para o scroll manual (agora mais simples) ---
        let wheelTimeout;
        window.addEventListener('wheel', (e) => {
            e.preventDefault(); 
            if (isScrolling) return;
            
            clearTimeout(wheelTimeout);
            wheelTimeout = setTimeout(() => {
                const currentSectionIdx = getCurrentSectionIndex();
                if (e.deltaY > 0 && currentSectionIdx < sections.length - 1) {
                    scrollToSection(currentSectionIdx + 1);
                } 
                else if (e.deltaY < 0 && currentSectionIdx > 0) {
                    scrollToSection(currentSectionIdx - 1);
                }
                scheduleNextAutoScroll(); // Cancela e reinicia o timer do auto-scroll
            }, 50);
        }, { passive: false });

        let touchStartY = 0;
        let touchTimeout;
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            if (isScrolling) return;
            
            clearTimeout(touchTimeout);
            touchTimeout = setTimeout(() => {
                const touchEndY = e.changedTouches[0].screenY;
                const deltaY = touchEndY - touchStartY;
                const currentSectionIdx = getCurrentSectionIndex();

                if (Math.abs(deltaY) > 50) { // Apenas se for um swipe significativo
                    if (deltaY < 0 && currentSectionIdx < sections.length - 1) {
                        scrollToSection(currentSectionIdx + 1);
                    }
                    else if (deltaY > 0 && currentSectionIdx > 0) {
                        scrollToSection(currentSectionIdx - 1);
                    }
                    scheduleNextAutoScroll(); // Cancela e reinicia o timer do auto-scroll
                }
            }, 100);
        }, { passive: true });

        // --- Lógica dos Botões ---
        const startButton = document.getElementById('start-button');
        if (startButton) {
            startButton.addEventListener('click', () => {
                scrollToSection(1);
                scheduleNextAutoScroll();
            });
        }

        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                scrollToSection(0);
                scheduleNextAutoScroll();
            });
        }

        // --- Lógica do Contador ---
        function startCounter() {
            const startDate = new Date('2023-02-14T00:00:00'); 
            const daysEl = document.getElementById('days');
            const hoursEl = document.getElementById('hours');
            const minutesEl = document.getElementById('minutes');
            if (!daysEl) return;
            function updateCounter() {
                const now = new Date();
                const diff = now - startDate;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                daysEl.textContent = String(days).padStart(2, '0');
                hoursEl.textContent = String(hours).padStart(2, '0');
                minutesEl.textContent = String(minutes).padStart(2, '0');
            }
            setInterval(updateCounter, 1000);
            updateCounter();
        }
        startCounter();

        // --- Lógica do Carrossel (COM AUTO-PLAY) ---
        const carouselTrack = document.querySelector('.carousel-track');
        if (carouselTrack) {
            const items = Array.from(carouselTrack.children);
            const nextButton = document.querySelector('.carousel-button.next');
            const prevButton = document.querySelector('.carousel-button.prev');
            let currentSlide = 0;
            let carouselInterval = null;

            const moveToSlide = (targetIndex) => {
                if(!carouselTrack) return;
                carouselTrack.style.transform = 'translateX(-' + 100 * targetIndex + '%)';
                currentSlide = targetIndex;
            }

            const startCarouselAutoPlay = () => {
                clearInterval(carouselInterval);
                carouselInterval = setInterval(() => {
                    let newIndex = currentSlide + 1;
                    if (newIndex >= items.length) newIndex = 0;
                    moveToSlide(newIndex);
                }, 5000);
            };
            
            nextButton.addEventListener('click', () => {
                let newIndex = currentSlide + 1;
                if (newIndex >= items.length) newIndex = 0;
                moveToSlide(newIndex);
                startCarouselAutoPlay();
            });

            prevButton.addEventListener('click', () => {
                let newIndex = currentSlide - 1;
                if (newIndex < 0) newIndex = items.length - 1;
                moveToSlide(newIndex);
                startCarouselAutoPlay();
            });
            
            startCarouselAutoPlay();
        }
        
        // Inicia o auto-scroll da página pela primeira vez
        scheduleNextAutoScroll();
    }
})();
