document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const backgroundMusic = document.getElementById('background-music');
    const musicToggleButton = document.getElementById('music-toggle');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const startButton = document.getElementById('start-button');
    const sections = document.querySelectorAll('.timeline-section');
    const restartButton = document.getElementById('restart-button');

    let isMusicPlaying = false;
    let activeTypewriterIntervals = new Map(); // Mapa para armazenar intervalos por elemento
    let counterInterval;
    let carouselInterval;

    // --- Preloader ---
    window.addEventListener('load', () => {
        backgroundMusic.volume = 0.5;
        backgroundMusic.pause();

        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                document.querySelector('.timeline-container').style.opacity = '1';
                checkSectionVisibility(); // Inicia a observação das seções
            }, 1000);
        }, 1000);
    });

    // --- Controle de Música ---
    musicToggleButton.addEventListener('click', () => {
        if (isMusicPlaying) {
            backgroundMusic.pause();
            playIcon.style.display = 'inline-block';
            pauseIcon.style.display = 'none';
        } else {
            backgroundMusic.play().catch(e => console.error("Erro ao tocar música:", e));
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
        }
        isMusicPlaying = !isMusicPlaying;
    });

    // --- Navegação (Scroll e Animação de Entrada) ---

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!entry.target.classList.contains('active')) {
                    entry.target.classList.add('active');
                    // Aplica o efeito de digitação para o título e outros textos da seção
                    initTypewriterEffect(entry.target); 
                    
                    if (entry.target.classList.contains('gallery-section')) {
                        updateCarousel(true); // Ativa o carrossel e sua legenda
                    }

                    if (entry.target.classList.contains('counter-section')) {
                        startRelationshipCounter();
                    } else if (entry.target.classList.contains('gallery-section')) {
                        startCarouselAutoSlide();
                    }
                }
            } else {
                if (entry.target.classList.contains('active')) {
                    entry.target.classList.remove('active');
                    clearTypewriterIntervalsForSection(entry.target); // Limpar intervalos e mostrar texto completo

                    if (entry.target.classList.contains('counter-section')) {
                        stopRelationshipCounter();
                    } else if (entry.target.classList.contains('gallery-section')) {
                        clearInterval(carouselInterval);
                    }
                }
            }
        });
    }, observerOptions);

    function checkSectionVisibility() {
        sections.forEach(section => {
            sectionObserver.observe(section);
        });
    }

    startButton.addEventListener('click', () => {
        if (!isMusicPlaying) {
            backgroundMusic.play().catch(e => console.error("Erro ao tocar música:", e));
            isMusicPlaying = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline-block';
        }
        document.getElementById('section-1').scrollIntoView({ behavior: 'smooth' });
    });

    if (restartButton) {
        restartButton.addEventListener('click', () => {
            document.getElementById('section-0').scrollIntoView({ behavior: 'smooth' });

            if (isMusicPlaying) {
                backgroundMusic.currentTime = 0;
                backgroundMusic.play().catch(e => console.error("Erro ao retomar música de fundo:", e));
            }

            // Garante que todos os typewriters sejam resetados para iniciar do zero
            sections.forEach(section => {
                const elements = section.querySelectorAll('.typewriter-text');
                elements.forEach(el => {
                    if (activeTypewriterIntervals.has(el)) {
                        clearInterval(activeTypewriterIntervals.get(el));
                        activeTypewriterIntervals.delete(el);
                    }
                    el.textContent = ''; // Limpa o texto
                    el.classList.remove('finished-typing');
                    el.classList.remove('typing-cursor'); // Remove qualquer cursor remanescente
                });
            });
        });
    }

    // --- Efeito de Digitação (Typewriter) ---

    // Esta função agora aceita um 'targetElement' que pode ser um container (seção) ou um único elemento
    function initTypewriterEffect(targetElement) {
        let elementsToType;
        if (targetElement.classList.contains('typewriter-text')) {
            // Se o targetElement já é um typewriter-text, trate-o como o único elemento a digitar
            elementsToType = [targetElement];
        } else {
            // Caso contrário, procure todos os typewriter-text dentro do container
            elementsToType = targetElement.querySelectorAll('.typewriter-text');
        }

        let currentTypingElementIndex = 0;
        const typingSpeed = 50;
        const pauseAfterTyping = 500;

        // Resetar todos os elementos de digitação antes de começar uma nova sequência
        elementsToType.forEach(element => {
            if (activeTypewriterIntervals.has(element)) {
                clearInterval(activeTypewriterIntervals.get(element));
                activeTypewriterIntervals.delete(element);
            }
            element.textContent = '';
            element.classList.remove('finished-typing');
            element.classList.remove('typing-cursor'); // Garante que nenhum cursor esteja ativo inicialmente
        });
        
        function typeNextElement() {
            // Primeiro, limpa todos os cursores *antes* de adicionar ao elemento atual
            // Isso previne que cursores de elementos anteriores permaneçam na tela
            document.querySelectorAll('.typewriter-text.typing-cursor').forEach(el => {
                el.classList.remove('typing-cursor');
            });

            if (currentTypingElementIndex < elementsToType.length) {
                const element = elementsToType[currentTypingElementIndex];
                const originalText = element.dataset.text;
                let charIndex = 0;

                element.classList.add('typing-cursor'); // Adiciona o cursor APENAS ao elemento atual
                element.classList.remove('finished-typing'); // Garante que a classe finished-typing seja removida

                const interval = setInterval(() => {
                    if (charIndex < originalText.length) {
                        element.textContent += originalText.charAt(charIndex);
                        charIndex++;
                    } else {
                        clearInterval(interval);
                        element.classList.add('finished-typing');
                        element.classList.remove('typing-cursor'); // Remove o cursor após terminar a digitação
                        activeTypewriterIntervals.delete(element);
                        
                        currentTypingElementIndex++;
                        setTimeout(typeNextElement, pauseAfterTyping);
                    }
                }, typingSpeed);

                activeTypewriterIntervals.set(element, interval);
            }
        }
        typeNextElement();
    }

    function clearTypewriterIntervalsForSection(sectionElement) {
        const elementsInSection = sectionElement.querySelectorAll('.typewriter-text');
        elementsInSection.forEach(element => {
            if (activeTypewriterIntervals.has(element)) {
                clearInterval(activeTypewriterIntervals.get(element));
                activeTypewriterIntervals.delete(element);
            }
            // Garante que o texto completo seja exibido e o cursor removido
            element.textContent = element.dataset.text;
            element.classList.add('finished-typing');
            element.classList.remove('typing-cursor'); // Remove o cursor ao sair da seção
        });
    }

    // --- Carrossel de Imagens ---
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselItems = document.querySelectorAll('.carousel-item');
    const carouselPrevButton = document.querySelector('.carousel-button.prev');
    const carouselNextButton = document.querySelector('.carousel-button.next');
    let carouselIndex = 0;
    const totalCarouselItems = carouselItems.length;

    function updateCarousel() {
        if (carouselTrack) {
            carouselTrack.style.transform = `translateX(-${carouselIndex * 100}%)`;

            // Resetar todos os cursores e textos de legendas antes de ativar a atual
            carouselItems.forEach(item => {
                const legendElement = item.querySelector('p.typewriter-text');
                if (legendElement) {
                    if (activeTypewriterIntervals.has(legendElement)) {
                        clearInterval(activeTypewriterIntervals.get(legendElement));
                        activeTypewriterIntervals.delete(legendElement);
                    }
                    legendElement.textContent = legendElement.dataset.text; // Mostra texto completo
                    legendElement.classList.add('finished-typing');
                    legendElement.classList.remove('typing-cursor'); // Garante que o cursor seja removido
                }
            });

            // Ativa o typewriter apenas na legenda do item visível
            const currentItem = carouselItems[carouselIndex];
            const currentLegend = currentItem.querySelector('p.typewriter-text');
            if (currentLegend) {
                // Chame initTypewriterEffect diretamente no elemento da legenda
                // O initTypewriterEffect já foi ajustado para lidar com um único elemento
                initTypewriterEffect(currentLegend);
            }
        }
    }

    function startCarouselAutoSlide() {
        if (carouselInterval) clearInterval(carouselInterval);
        carouselInterval = setInterval(() => {
            carouselIndex = (carouselIndex + 1) % totalCarouselItems;
            updateCarousel();
        }, 5000);
        updateCarousel(); // Chamada inicial para a primeira legenda
    }

    if (carouselNextButton) {
        carouselNextButton.addEventListener('click', () => {
            clearInterval(carouselInterval);
            carouselIndex = (carouselIndex + 1) % totalCarouselItems;
            updateCarousel();
            startCarouselAutoSlide();
        });
    }

    if (carouselPrevButton) {
        carouselPrevButton.addEventListener('click', () => {
            clearInterval(carouselInterval);
            carouselIndex = (carouselIndex - 1 + totalCarouselItems) % totalCarouselItems;
            updateCarousel();
            startCarouselAutoSlide();
        });
    }

    // --- Contador de Relacionamento ---
    const startDate = new Date('2025-06-10T18:47:48'); // **AJUSTE ESTA DATA PARA A SUA DATA REAL!**

    function calculateTime() {
        const now = new Date();
        const diff = now - startDate;

        if (diff < 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            return;
        }

        const minutes = Math.floor(diff / (1000 * 60)) % 60;
        const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
    }

    function startRelationshipCounter() {
        if (!counterInterval) {
            calculateTime();
            counterInterval = setInterval(calculateTime, 1000);
        }
    }

    function stopRelationshipCounter() {
        if (counterInterval) {
            clearInterval(counterInterval);
            counterInterval = null;
        }
    }
});