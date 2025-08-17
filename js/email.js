emailjs.init("kAYDDABlfygf4YBJV");

// Localized runtime messages
const MSG = {
    az: { sending: "Göndərilir…", sent: "Mesajınız göndərildi!", error: "Üzr istəyirik, göndərmək alınmadı. Bir az sonra yenidən cəhd edin." },
    ru: { sending: "Отправляем…", sent: "Ваше сообщение отправлено!", error: "К сожалению, отправка не удалась. Попробуйте позже." },
    en: { sending: "Sending…", sent: "Your message has been sent!", error: "Sorry, sending failed. Please try again later." }
};
const curLang = () => (document.documentElement.lang || "az").slice(0, 2);
const t = (k) => (MSG[curLang()]?.[k]) ?? MSG.en[k] ?? k;

// Toast helper (with fallback to alert)
function showToast(type, textKey, opts = {}) {
    const message = t(textKey);
    if (!window.bootstrap || !bootstrap.Toast) {
        // Fallback if Bootstrap Toast not available
        alert(message);
        return;
    }
    let wrap = document.getElementById('toast-placer');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'toast-placer';
        wrap.className = 'toast-container position-fixed top-0 end-0 p-3';
        wrap.style.zIndex = '1200';
        document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = `toast align-items-center text-white border-0 ${type === 'success' ? 'bg-success' : 'bg-danger'}`;
    el.setAttribute('role', 'alert'); el.setAttribute('aria-live', 'assertive'); el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `<div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    wrap.appendChild(el);
    new bootstrap.Toast(el, {
        autohide: opts.autohide ?? (type === 'success'),
        delay: typeof opts.delay === 'number' ? opts.delay : 10000
    }).show();
}

// Button spinner + form disable
function setLoading(btn, on) {
    if (!btn) return;
    // ensure spinner exists (auto-create if missing)
    let spinnerWrap = btn.querySelector('[data-role="btn-spinner"]');
    if (!spinnerWrap) {
        spinnerWrap = document.createElement('span');
        spinnerWrap.setAttribute('data-role', 'btn-spinner');
        spinnerWrap.className = 'ms-2 align-middle';
        spinnerWrap.style.display = 'none';
        spinnerWrap.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;
        btn.appendChild(spinnerWrap);
    }
    btn.disabled = !!on;
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
    spinnerWrap.style.display = on ? 'inline-flex' : 'none';
}
function disableFields(form, on) {
    form.querySelectorAll('input, textarea, select, button:not([type="submit"])')
        .forEach(el => el.disabled = !!on);
}

// Submit
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('quoteForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = form.querySelector('#submitBtn') || form.querySelector('button[type="submit"]');

        const templateParams = {
            subject: form.subject?.value ?? document.getElementById('subject')?.value ?? '',
            name: form.name?.value ?? document.getElementById('name')?.value ?? '',
            email: form.email?.value ?? document.getElementById('email')?.value ?? '',
            message: form.message?.value ?? document.getElementById('message')?.value ?? ''
        };

        try {
            setLoading(btn, true);
            disableFields(form, true);

            await emailjs.send('service_43ek07p', 'template_rvblndp', templateParams);

            form.reset();
            showToast('success', 'sent', { delay: 10000 });
        } catch (err) {
            console.error('EmailJS error:', err);
            showToast('error', 'error', { autohide: false });
        } finally {
            setLoading(btn, false);
            disableFields(form, false);
        }
    });
});