async function loadLanguage(lang) {
  const res = await fetch(`locales/${lang}.json`);
  const dict = await res.json();
  document.querySelectorAll('[data-i18n-key]').forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.documentElement.lang = lang;
}

function setupI18n() {
  const selector = document.getElementById('language-selector');
  const mobileSelector = document.getElementById('mobile-language');
  const initialLang = selector ? selector.value : 'ja';
  loadLanguage(initialLang);
  function change(lang) {
    if (selector) selector.value = lang;
    if (mobileSelector) mobileSelector.value = lang;
    loadLanguage(lang);
  }
  if (selector) selector.addEventListener('change', e => change(e.target.value));
  if (mobileSelector) mobileSelector.addEventListener('change', e => change(e.target.value));
}

window.initI18n = setupI18n;
window.addEventListener('DOMContentLoaded', setupI18n);
