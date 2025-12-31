(async () => {
  const includeEls = Array.from(document.querySelectorAll("[data-include]"));

  for (const el of includeEls) {
    const path = el.getAttribute("data-include");
    if (!path) continue;
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
      const html = await res.text();
      el.innerHTML = html;
    } catch (err) {
      console.error(err);
      el.innerHTML = `
        <div class="card">
          <div class="card__head"><h3>Load error</h3></div>
          <p class="section-note">Could not load <strong>${path}</strong>.</p>
        </div>
      `;
    }
  }

  const script = document.createElement("script");
  script.src = "js/main.js";
  script.defer = true;
  document.body.appendChild(script);
})();
