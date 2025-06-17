window.loadHeaderFooter = async function () {
  async function load(id, url) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const html = await res.text();
        const container = document.getElementById(id);
        if (container) container.innerHTML = html;
      } else {
        console.error('Failed to fetch', url, res.status);
      }
    } catch (err) {
      console.error('Failed to load', url, err);
    }
  }
  await Promise.all([
    load('header-placeholder', 'partials/header.html'),
    load('footer-placeholder', 'partials/footer.html')
  ]);
};
