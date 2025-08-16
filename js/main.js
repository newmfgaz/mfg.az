(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();


    // Initiate the wowjs
    new WOW().init();


    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').css('top', '0px');
        } else {
            $('.sticky-top').css('top', '-100px');
        }
    });


    // Dropdown on mouse hover
    const $dropdown = $(".dropdown");
    const $dropdownToggle = $(".dropdown-toggle");
    const $dropdownMenu = $(".dropdown-menu");
    const showClass = "show";

    $(window).on("load resize", function () {
        if (this.matchMedia("(min-width: 992px)").matches) {
            $dropdown.hover(
                function () {
                    const $this = $(this);
                    $this.addClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "true");
                    $this.find($dropdownMenu).addClass(showClass);
                },
                function () {
                    const $this = $(this);
                    $this.removeClass(showClass);
                    $this.find($dropdownToggle).attr("aria-expanded", "false");
                    $this.find($dropdownMenu).removeClass(showClass);
                }
            );
        } else {
            $dropdown.off("mouseenter mouseleave");
        }
    });


    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Header carousel
    $(".header-carousel").owlCarousel({
        autoplay: false,
        smartSpeed: 1500,
        items: 1,
        dots: false,
        loop: true,
        nav: true,
        navText: [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: false,
        smartSpeed: 1000,
        center: true,
        dots: true,
        loop: true,
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        }
    });

})(jQuery);

(function () {
    const SUPPORTED = ['az', 'ru', 'en'];
    const DEFAULT = 'az';

    let current = DEFAULT;
    let dict = {};

    const clamp = l => (l || '').slice(0, 2).toLowerCase();
    const ok = l => SUPPORTED.includes(l);
    const get = (o, p) => p.split('.').reduce((a, k) => (a && a[k] != null) ? a[k] : null, o);

    // Build candidate URLs so it works whether your site is at / or /MFG.AZ/
    function langUrls(lang) {
        const pagePath = window.location.pathname;                 // e.g. /MFG.AZ/index.html
        const pageDir = pagePath.replace(/[^/]*$/, '');           // e.g. /MFG.AZ/
        return [
            `${pageDir}lang/${lang}.json`,   // preferred (same folder level as your HTML)
            `./lang/${lang}.json`,
            `/lang/${lang}.json`,
            `../lang/${lang}.json`
        ];
    }

    async function fetchDict(lang) {
        const tried = [];
        for (const url of langUrls(lang)) {
            try {
                const res = await fetch(url, { cache: 'no-cache' });
                if (res.ok) {
                    console.log('[i18n] loaded', lang, 'from', url);
                    return res.json();
                }
                tried.push(`${url} (HTTP ${res.status})`);
            } catch (e) {
                tried.push(`${url} (${e.message})`);
            }
        }
        throw new Error('Failed to load ' + lang + ':\n' + tried.join('\n'));
    }

    function apply() {
        // <html lang>
        document.documentElement.lang = current;

        // <title>
        const t = get(dict, 'meta.title');
        if (t) document.title = t;

        // Texts & attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = get(dict, key);
            if (val == null) return;
            const attrs = (el.getAttribute('data-i18n-attr') || '')
                .split(',').map(s => s.trim()).filter(Boolean);
            if (attrs.length) attrs.forEach(a => el.setAttribute(a, val));
            else el.textContent = val;
        });

        // Update labels on both language buttons
        document.querySelectorAll('[data-langbtn]').forEach(btn => {
            btn.textContent = dict.langCode || current.toUpperCase();
        });
    }

    async function setLang(lang) {
        const l = ok(lang) ? lang : DEFAULT;
        try {
            dict = await fetchDict(l);
            current = l;
            localStorage.setItem('lang', l);
            apply();

            // Close any open dropdown (Bootstrap 5)
            document.querySelectorAll('.dropdown-toggle[aria-expanded="true"]').forEach(tgl => {
                const inst = bootstrap.Dropdown.getInstance(tgl) || new bootstrap.Dropdown(tgl);
                inst.hide();
            });

            console.log('[i18n] applied ->', l);
        } catch (err) {
            console.error('[i18n] load failed:', err.message);
            // still reflect choice on button so user sees a reaction
            document.querySelectorAll('[data-langbtn]').forEach(btn => btn.textContent = l.toUpperCase());
        }
    }

    function bindClicks() {
        document.addEventListener('click', (e) => {
            const item = e.target.closest('[data-setlang]');
            if (!item) return;
            e.preventDefault();
            e.stopPropagation();
            setLang(clamp(item.getAttribute('data-setlang')));
        });
    }

    function observeLateNodes() {
        let pending = null;
        const mo = new MutationObserver(() => {
            // throttle re-apply while DOM updates (e.g., if you inject navbar.html)
            clearTimeout(pending);
            pending = setTimeout(apply, 50);
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        bindClicks();
        observeLateNodes();

        const saved = clamp(localStorage.getItem('lang'));
        const guess = clamp(navigator.language || navigator.userLanguage);
        setLang(ok(saved) ? saved : (ok(guess) ? guess : DEFAULT));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    // helpers for quick testing
    window.i18nSetLang = setLang;
    window.i18nGetLang = () => current;

    document.addEventListener('DOMContentLoaded', async () => {
        const container = document.getElementById('nav');   // <div id="nav"></div> placeholder
        const res = await fetch('navbar.html');
        const html = await res.text();
        container.innerHTML = html;

        highlightActive(container);
    });



    function highlightActive(root) {
        const current = normalize(location.pathname);  // e.g. "about.html" or "index.html"

        // find all navbar links inside the injected markup
        root.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
            const hrefPath = normalize(new URL(link.getAttribute('href'), location.href).pathname);

            // treat "/", "" as "index.html"
            const isMatch =
                hrefPath === current ||
                (hrefPath === 'index.html' && (current === '' || current === '/'));

            link.classList.toggle('active', isMatch);
            if (isMatch) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    }

    // "about.html" from "/folder/about.html", default to "index.html"
    function normalize(pathname) {
        const p = (pathname || '').replace(/\/+$/, '');       // trim trailing slash
        const last = p.split('/').pop();                     // last segment
        return last && last !== '/' ? last : 'index.html';
    }

    emailjs.init("R-_7IAKgaj3Wl0f2Q");
    document.getElementById('quoteForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;

        const templateParams = {
            subject: subject,
            name: name,
            email: email,
            message: message
        };
        // Send the form data using EmailJS
        emailjs.send('service_3zoina6', 'template_63m0ilw', templateParams)
            .then(function (response) {
                console.log("Success:", response);
                alert("Your message has been sent!");
            }, function (error) {
                console.error("Error:", error);
                alert("Sorry, there was an issue sending your message. Please try again later.");
            });
    });
})();