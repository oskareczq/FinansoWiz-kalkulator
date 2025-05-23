// Główny plik JavaScript - obsługa nawigacji i podstawowych funkcji

// Zmienne globalne
let isMenuOpen = false;
let currentActiveCalculatorTab = 'compound'; // Domyślna zakładka kalkulatora

// Inicjalizacja po załadowaniu DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM załadowany - inicjalizacja main.js');
    initializeMainApp();
});

// Główna funkcja inicjalizacji
function initializeMainApp() {
    console.log('Inicjalizacja głównej aplikacji...');

    setupNavigationHandlers();
    setupMobileMenu();
    setupScrollHandlers(); // Dla animacji scroll i ew. sticky header
    setupTabHandlers(); // Dla kalkulatorów
    setupSliderHandlers(); // Dla suwaków w kalkulatorach
    updateActiveLinkBasedOnPage(); // Ustawia aktywny link na podstawie URL

    // Jeśli jesteśmy na stronie głównej, wykonaj pierwsze obliczenie dla domyślnej zakładki
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        // Sprawdź, czy funkcje kalkulatorów są dostępne
        if (typeof calculateCompound === 'function') {
            setTimeout(() => {
                console.log('Pierwsze obliczenie dla domyślnej zakładki (compound)...');
                calculateCompound();
            }, 700); // Małe opóźnienie, aby dać czas na załadowanie Chart.js
        } else {
            console.warn('calculateCompound nie jest jeszcze dostępne przy inicjalizacji.');
        }
    }

    console.log('Główna aplikacja zainicjalizowana.');
}

// NOWA FUNKCJA: Ustawia aktywny link nawigacyjny na podstawie aktualnej strony
function updateActiveLinkBasedOnPage() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPath = window.location.pathname.split("/").pop(); // np. "index.html", "about.html"

    navLinks.forEach(link => {
        link.classList.remove('active');
        const linkPath = link.getAttribute('href').split("#")[0]; // np. "index.html", "about.html"

        if (linkPath === currentPath) {
            // Jeśli link kieruje do aktualnej strony (np. about.html)
            link.classList.add('active');
        } else if ((currentPath === 'index.html' || currentPath === '' || currentPath === '/') && link.getAttribute('href').startsWith('#')) {
            // Jeśli jesteśmy na index.html i link jest kotwicą (np. #home)
            // Obsługa tego jest w updateActiveNavOnScroll, ale można ustawić domyślny
            if (link.getAttribute('href') === '#home') {
                link.classList.add('active');
            }
        }
    });
    console.log(`Aktywny link ustawiony dla strony: ${currentPath}`);
}

// Konfiguracja nawigacji
function setupNavigationHandlers() {
    console.log('Konfiguracja nawigacji...');

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            const href = link.getAttribute('href');

            if (href.startsWith('#')) { // Link wewnętrzny (kotwica)
                e.preventDefault();
                const targetId = href.substring(1);
                console.log('Kliknięto link wewnętrzny:', targetId);

                // Jeśli jesteśmy na stronie głównej, przewiń
                if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
                    scrollToSection(targetId);
                } else {
                    // Jeśli jesteśmy na innej stronie (np. about.html) i klikamy na kotwicę, przekieruj do index.html#targetId
                    window.location.href = 'index.html' + href;
                    return; // Zakończ, aby nie wykonywać dalszych działań na tej stronie
                }
                closeMobileMenu();
                // updateActiveNavLink(link); // Aktualizacja aktywnego linku jest teraz w updateActiveLinkBasedOnPage i updateActiveNavOnScroll
            } else {
                // To jest link do innej strony (np. about.html)
                // Przeglądarka obsłuży to normalnie, ale możemy chcieć zamknąć menu mobilne
                console.log('Kliknięto link zewnętrzny:', href);
                closeMobileMenu();
                // updateActiveNavLink(link); // Nie jest potrzebne, bo strona się przeładuje
            }
        });
    });

    // Obsługa kliknięcia w logo/markę
    const navBrandLink = document.querySelector('.nav-brand a');
    if (navBrandLink) {
        navBrandLink.addEventListener('click', function (e) {
            e.preventDefault(); // Zapobiegaj domyślnemu zachowaniu
            console.log('Kliknięto logo/markę, przekierowanie do index.html#home');
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
                scrollToSection('home'); // Jeśli już na index, przewiń do góry
                updateActiveLinkBasedOnPage(); // Ponownie ustawia #home jako aktywny
            } else {
                window.location.href = 'index.html#home'; // Jeśli na innej stronie, idź do index.html#home
            }
            closeMobileMenu();
        });
    }

    setupCTAButtons();
}

// Konfiguracja przycisków CTA
function setupCTAButtons() {
    console.log('Konfiguracja przycisków CTA...');

    const startButtons = document.querySelectorAll('.cta-button.primary');
    startButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Kliknięto "Rozpocznij obliczenia"');
            // Przycisk CTA zawsze na stronie głównej, więc scrollToSection zadziała
            scrollToSection('calculators');
        });
    });

    const learnButtons = document.querySelectorAll('.cta-button.secondary');
    learnButtons.forEach(function (button) {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Kliknięto "Dowiedz się więcej"');
            scrollToSection('education');
        });
    });
}

// Funkcja przewijania do sekcji (tylko na stronie głównej)
function scrollToSection(sectionId) {
    console.log('Próba przewinięcia do sekcji:', sectionId);

    const section = document.getElementById(sectionId);
    if (section) {
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 80; // Domyślna wysokość jeśli header nie znaleziony
        const targetPosition = section.offsetTop - headerHeight - 20; // Dodatkowy margines

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        console.log('Przewinięto do sekcji:', sectionId, 'na pozycję:', targetPosition);
    } else {
        console.warn('Sekcja nie znaleziona do przewinięcia:', sectionId);
    }
}

// Konfiguracja menu mobilnego
function setupMobileMenu() {
    console.log('Konfiguracja menu mobilnego...');

    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function (e) {
            e.preventDefault();
            toggleMobileMenu();
        });

        document.addEventListener('click', function (e) {
            if (isMenuOpen && navMenu.classList.contains('active') && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }
}

// Przełączanie menu mobilnego
function toggleMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        isMenuOpen = !isMenuOpen;
        hamburger.classList.toggle('active', isMenuOpen);
        navMenu.classList.toggle('active', isMenuOpen);
        console.log('Menu mobilne', isMenuOpen ? 'otwarte' : 'zamknięte');
    }
}

// Zamykanie menu mobilnego
function closeMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu && isMenuOpen) {
        isMenuOpen = false;
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        console.log('Menu mobilne zamknięte (przez closeMobileMenu)');
    }
}

// Aktualizacja aktywnego linku nawigacyjnego - używane przez updateActiveNavOnScroll
function updateActiveNavLink(activeLinkElement) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    if (activeLinkElement) activeLinkElement.classList.add('active');
}

// Konfiguracja obsługi przewijania
function setupScrollHandlers() {
    console.log('Konfiguracja obsługi przewijania...');
    let ticking = false;

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// Obsługa przewijania
function handleScroll() {
    // Tylko na stronie głównej
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        updateActiveNavOnScroll();
    }
    handleScrollAnimations(); // Animacje scroll-reveal mogą być na każdej stronie
}

// Aktualizacja nawigacji przy przewijaniu (tylko dla index.html)
function updateActiveNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    if (sections.length === 0) return; // Brak sekcji do śledzenia

    const navLinks = document.querySelectorAll('.nav-link');
    let currentSectionId = '';
    const scrollY = window.pageYOffset;
    const headerOffset = document.querySelector('.header')?.offsetHeight || 80;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerOffset - 50; // Dodatkowy offset 50px
        if (scrollY >= sectionTop) {
            currentSectionId = section.getAttribute('id');
        }
    });

    // Jeśli jesteśmy na samej górze, aktywuj #home
    if (scrollY < sections[0].offsetTop - headerOffset - 50) {
        currentSectionId = 'home';
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        // Sprawdzamy, czy href pasuje do ID sekcji, uwzględniając #
        if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
        }
    });
}

// Animacje przy przewijaniu
function handleScrollAnimations() {
    const scrollElements = document.querySelectorAll('.scroll-reveal, .education-card, .profile-card, .section-box'); // Dodane nowe selektory

    scrollElements.forEach(function (element) {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisibleThreshold = window.innerHeight - (element.offsetHeight * 0.2); // Widoczne, gdy 20% elementu jest na ekranie

        if (elementTop < elementVisibleThreshold) {
            element.classList.add('revealed'); // Klasa do animacji (zdefiniowana w animations.css)
        }
    });
}

// Konfiguracja obsługi zakładek kalkulatorów
function setupTabHandlers() {
    console.log('Konfiguracja obsługi zakładek kalkulatorów...');

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        // Atrybuty onclick są już w HTML, więc nie trzeba dodawać event listenera do przełączania
        // Można dodać efekty hover itp.
        button.addEventListener('mouseenter', () => button.style.transform = 'translateY(-2px)');
        button.addEventListener('mouseleave', () => {
            if (!button.classList.contains('active')) {
                button.style.transform = 'translateY(0)';
            }
        });
    });
}

// Funkcja przełączania zakładek (wywoływana z HTML przez onclick)
function switchTab(tabId) {
    console.log('Przełączanie na zakładkę kalkulatora:', tabId);

    const allTabs = document.querySelectorAll('.calculator-content');
    allTabs.forEach(tab => tab.classList.remove('active'));

    const allButtons = document.querySelectorAll('.tab-button');
    allButtons.forEach(button => {
        button.classList.remove('active');
        button.style.transform = 'translateY(0)';
    });

    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Znajdź przycisk po atrybucie onclick (bardziej odporne niż po ev.target, które może być ikoną)
    const targetButton = Array.from(allButtons).find(btn => btn.getAttribute('onclick') === `switchTab('${tabId}')`);
    if (targetButton) {
        targetButton.classList.add('active');
        targetButton.style.transform = 'translateY(-2px)';
    }

    currentActiveCalculatorTab = tabId;

    setTimeout(() => {
        console.log('Automatyczne obliczanie dla zakładki:', tabId);
        triggerCalculationForTab(tabId);
    }, 150); // Krótsze opóźnienie
}

// Wyzwalanie obliczeń dla konkretnej zakładki
function triggerCalculationForTab(tabId) {
    const calculationFunctions = {
        'compound': window.calculateCompound,
        'investment': window.calculateInvestment,
        'savings': window.calculateSavings,
        'loan': window.calculateLoan,
        'retirement': window.calculateRetirement,
        'car-loan': window.calculateCarLoan
    };

    if (calculationFunctions[tabId] && typeof calculationFunctions[tabId] === 'function') {
        calculationFunctions[tabId]();
    } else {
        console.warn(`Funkcja obliczeniowa dla zakładki ${tabId} nie została znaleziona lub nie jest funkcją.`);
    }
}

// Konfiguracja obsługi sliderów
function setupSliderHandlers() {
    console.log('Konfiguracja obsługi sliderów...');

    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const updateSliderBackground = () => {
            const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
            slider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, var(--gray-200) ${percentage}%, var(--gray-200) 100%)`;
        };

        slider.addEventListener('input', updateSliderBackground);
        updateSliderBackground(); // Inicjalizacja wyglądu
    });
}

// Funkcja synchronizacji slidera (wywoływana z HTML przez oninput/onchange)
function syncSlider(inputId, value) {
    const inputField = document.getElementById(inputId);
    if (inputField) {
        // Sprawdź, czy wartość jest liczbą, jeśli tak, zaokrąglij do odpowiedniej precyzji
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // Zaokrąglij na podstawie kroku inputu (jeśli jest) lub domyślnie
            const step = parseFloat(inputField.step) || 1;
            if (step < 1) { // Dla ułamków
                inputField.value = numValue.toFixed(String(step).split('.')[1]?.length || 2);
            } else {
                inputField.value = Math.round(numValue / step) * step;
            }
        } else {
            inputField.value = value; // Jeśli nie jest liczbą (np. pusty string), przypisz bezpośrednio
        }

        // console.log('Zsynchronizowano slider:', inputId, '=', inputField.value);

        // Wywołaj zdarzenie 'input' na polu input, aby uruchomić obliczenia
        // jeśli są one powiązane z 'oninput' tego pola
        const event = new Event('input', { bubbles: true, cancelable: true });
        inputField.dispatchEvent(event);

        // Dodatkowo, jeśli obliczenia są tylko na 'onchange', można je wywołać bezpośrednio
        // triggerCalculationForTab(currentActiveCalculatorTab); // Może być zbyt częste, 'oninput' z inputField powinno wystarczyć
    }
}

// Funkcje pomocnicze debounce i throttle (jeśli potrzebne dla bardziej złożonych interakcji)
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

// Globalne funkcje formatowania, jeśli nie są już w calculators.js
if (typeof window.formatCurrency !== 'function') {
    window.formatCurrency = function (amount) {
        if (isNaN(amount) || !isFinite(amount)) return 'Błąd danych';
        const limitedAmount = Math.min(Math.abs(amount), 1e15);
        const sign = amount < 0 ? "-" : "";
        return sign + new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(limitedAmount));
    };
}
if (typeof window.formatPercentage !== 'function') {
    window.formatPercentage = function (percentage) {
        if (isNaN(percentage) || !isFinite(percentage)) return 'Błąd danych';
        const limitedPercentage = Math.min(Math.abs(percentage), 10000);
        const sign = percentage < 0 ? "-" : "";
        return sign + new Intl.NumberFormat('pl-PL', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(limitedPercentage / 100);
    };
}

// Funkcje wywoływane z HTML (przeniesione tutaj dla spójności, jeśli były inline)
window.scrollToCalculators = function () {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        scrollToSection('calculators');
    } else {
        window.location.href = 'index.html#calculators';
    }
};
window.scrollToEducation = function () {
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        scrollToSection('education');
    } else {
        window.location.href = 'index.html#education';
    }
};

// Eksport funkcji potrzebnych globalnie (już zrobione przez przypisanie do window)
// window.switchTab = switchTab; // Już globalne przez definicję
// window.syncSlider = syncSlider; // Już globalne przez definicję

console.log('Main.js załadowany - wszystkie funkcje dostępne.');

