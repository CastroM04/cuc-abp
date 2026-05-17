/* ========================================================================
   SonrIA Odontología — script.js
   Maneja: menú móvil, filtros de servicios, validación + envío del form
   ======================================================================== */

(function () {
  'use strict';

  // ----- Menú móvil -----
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // ----- Filtros de servicios -----
  const filters = document.querySelectorAll('.filter');
  const grid = document.getElementById('serviciosGrid');
  if (filters.length && grid) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        grid.querySelectorAll('.card').forEach((card) => {
          const show = cat === 'todos' || card.dataset.cat === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // ----- Formulario de contacto -----
  const form = document.getElementById('contactForm');
  if (!form) return;

  const submitBtn = document.getElementById('submitBtn');
  const status = document.getElementById('formStatus');

  // Validadores
  const validators = {
    required: (v) => v.trim().length > 0,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: (v) => v.trim() === '' || /^[0-9+\s()-]{7,18}$/.test(v),
    min: (v, n) => v.trim().length >= Number(n),
  };

  function validateField(field) {
    const input = field.querySelector('input, select, textarea');
    if (!input) return true;
    const rules = (field.dataset.validate || '').split('|').filter(Boolean);
    const value = input.value;
    let valid = true;
    for (const rule of rules) {
      const [name, arg] = rule.split(':');
      const fn = validators[name];
      if (fn && !fn(value, arg)) {
        valid = false;
        break;
      }
    }
    field.classList.toggle('has-error', !valid);
    return valid;
  }

  // Validación en vivo (blur)
  form.querySelectorAll('.field').forEach((field) => {
    const input = field.querySelector('input, select, textarea');
    if (input) {
      input.addEventListener('blur', () => validateField(field));
      input.addEventListener('input', () => {
        if (field.classList.contains('has-error')) validateField(field);
      });
    }
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Honeypot: si está lleno, es bot
    const honey = form.querySelector('input[name="website"]');
    if (honey && honey.value.trim() !== '') {
      showStatus('error', 'Detección anti-spam activada.');
      return;
    }

    // 2. Validar todos los campos
    let allValid = true;
    form.querySelectorAll('.field').forEach((field) => {
      if (!validateField(field)) allValid = false;
    });

    // 3. Checkbox habeas data
    const habeas = form.querySelector('input[name="habeas_data"]');
    if (!habeas.checked) {
      allValid = false;
      showStatus('error', 'Debes aceptar el aviso de tratamiento de datos para continuar.');
      habeas.focus();
      return;
    }

    if (!allValid) {
      showStatus('error', 'Por favor revisa los campos marcados en rojo.');
      form.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
      return;
    }

    // 4. Enviar a Web3Forms
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Enviando...';
    status.className = 'form-status';
    status.textContent = '';

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      const data = await response.json();

      if (response.ok && data.success) {
        showStatus('success', '✓ ¡Mensaje enviado! Te contactaremos en menos de 24 horas.');
        form.reset();
      } else {
        showStatus('error', data.message || 'Hubo un problema al enviar. Intenta de nuevo o escríbenos por WhatsApp.');
      }
    } catch (err) {
      showStatus('error', 'No pudimos enviar el mensaje. Verifica tu conexión o usa WhatsApp.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Enviar mensaje →';
    }
  });

  function showStatus(type, msg) {
    status.className = `form-status is-${type}`;
    status.textContent = msg;
    status.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
