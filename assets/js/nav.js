document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav__toggle');
    const navMenu = document.querySelector('.nav__menu');
    const navOverlay = document.querySelector('.nav__overlay');

    if (!navToggle || !navMenu || !navOverlay) return;

    function toggleMenu() {
        const isOpen = navMenu.classList.contains('nav__menu--open');
        
        if (isOpen) {
            navMenu.classList.remove('nav__menu--open');
            navOverlay.classList.remove('nav__overlay--visible');
            navToggle.setAttribute('aria-expanded', 'false');
        } else {
            navMenu.classList.add('nav__menu--open');
            navOverlay.classList.add('nav__overlay--visible');
            navToggle.setAttribute('aria-expanded', 'true');
        }
    }

    navToggle.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);
});
