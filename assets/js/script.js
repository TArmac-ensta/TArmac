/*
GESTION DE LA NAVIGATION ET DES COMPOSANTS
*/

function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    const menuIcon = document.getElementById('menu-icon');

    if (menuToggle && mainNav && menuIcon) {
        menuToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            if (mainNav.classList.contains('active')) {
                closeMobileMenu(); 
            } else {
                mainNav.classList.add('active');
                document.body.classList.add('no-scroll');
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-xmark');
                menuToggle.setAttribute('aria-expanded', 'true');
            }
            applyClickFeedback(menuToggle);
        });
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    let currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
    
    const navLinks = document.querySelectorAll('#main-nav ul li a');

    navLinks.forEach(link => {
        link.classList.remove('active-page');
        const linkFile = link.getAttribute('href'); 
        if (linkFile === currentPageFile) {
            link.classList.add('active-page');
        }
    });
}

let lastScrollY = 0;
let mainHeader = null; 

function handleScrollHeader() {
    if (!mainHeader) {
        const placeholder = document.getElementById('header-placeholder');
        mainHeader = placeholder ? placeholder.querySelector('#main-header') : null;
        if (!mainHeader) return;
    }

    const currentScrollY = window.scrollY;
    const threshold = 10;
    const diff = currentScrollY - lastScrollY;

    if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentScrollY > 100) { 
            mainHeader.classList.add('header-hidden');
        } else {
            mainHeader.classList.remove('header-hidden');
        }
        lastScrollY = currentScrollY;
    }
}

function initHeaderInteractivity() {
    const btnConnexion = document.querySelector('.btn-connexion');
    if (btnConnexion) {
        btnConnexion.addEventListener('click', function() {
            applyClickFeedback(this);
        });
    }

    initMobileMenu(); 

    const logoLink = document.querySelector('.header-left a'); 
    if (logoLink) {
        logoLink.addEventListener('click', function(event) {
            event.preventDefault();
            applyClickFeedback(this.querySelector('.logo') || this);
            navigateTo(logoLink.getAttribute('href'));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Chargement du header
    loadComponent('header-placeholder', 'assets/components/header.html', () => {
        initHeaderInteractivity();
        highlightActiveLink();

        document.querySelectorAll('#main-nav a').forEach(link => {
            link.addEventListener('click', (event) => {
                const url = link.getAttribute('href');
                if (url && !url.startsWith('#') && !url.startsWith('http')) { 
                    event.preventDefault();
                    navigateTo(url);
                    closeMobileMenu();
                }
            });
        });
    });
    
    loadComponent('footer-placeholder', 'assets/components/footer.html');
    
    // Initialisation au premier chargement
    if (window.location.pathname.includes('membres.html')) loadMembers();
    if (window.location.pathname.includes('jeu.html')) initGame();

    // Fermeture du menu déroulant au clic extérieur
    document.addEventListener('click', (event) => {
        const menuToggle = document.getElementById('menu-toggle');
        const mainNav = document.getElementById('main-nav');
        if (mainNav && mainNav.classList.contains('active')) {
            if (!mainNav.contains(event.target) && !menuToggle.contains(event.target)) {
                closeMobileMenu();
            }
        }
    });
    
    window.addEventListener('scroll', handleScrollHeader);
});

function applyClickFeedback(element) {
    const feedbackColor = 'rgba(0, 0, 0, 0.2)';
    const originalTransition = element.style.transition;
    element.style.backgroundColor = feedbackColor;
    element.style.transition = 'background-color 0.3s ease-out';

    setTimeout(() => {
        element.style.backgroundColor = ''; 
        setTimeout(() => {
            element.style.transition = originalTransition;
        }, 300);
    }, 300);
}

function closeMobileMenu() {
    const mainNav = document.getElementById('main-nav');
    const menuToggle = document.getElementById('menu-toggle');
    const menuIcon = document.getElementById('menu-icon');

    if (mainNav && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        document.body.classList.remove('no-scroll');
        if (menuIcon) {
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        }
        if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
}

async function navigateTo(url) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        window.location.href = url;
        return;
    }
    
    try {
        const response = await fetch(url);
        const html = await response.text();
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const newMainContent = tempDiv.querySelector('#main-content');

        if (newMainContent) {
            mainContent.innerHTML = newMainContent.innerHTML;
            
            // Forcer le recalcul du layout (fixe les bugs de rendu)
            void mainContent.offsetHeight;

            history.pushState(null, '', url);
            
            if (url.includes('membres.html')) loadMembers(); 
            if (url.includes('jeu.html')) initGame();

            highlightActiveLink();
            window.scrollTo(0, 0); 
        } else {
             window.location.href = url;
        }
    } catch (error) {
        console.error('Erreur de navigation fluide :', error);
        window.location.href = url;
    }
}

function initGame() {    
    if (typeof window.startGameEngine === 'function') {
        window.startGameEngine();
    } else {
        import('./game.js').then(module => {
            if (module.startGameEngine) module.startGameEngine();
        }).catch(err => console.error("Erreur chargement moteur jeu:", err));
    }
}