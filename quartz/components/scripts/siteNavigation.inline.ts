function setupSiteNavigation() {
  const menu = document.querySelector<HTMLDetailsElement>(".campaign-menu")
  if (!menu) return
  const compact = window.matchMedia("(max-width: 800px)")
  const outlineCompact = window.matchMedia("(max-width: 1200px)")
  const stateKey = `eupharos-navigation-v1:${document.body.dataset.basepath ?? ""}`
  let state: Record<string, boolean> = {}
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey) ?? "{}")
    if (saved && typeof saved === "object" && !Array.isArray(saved)) state = saved
  } catch {
    // Navigation still works when browser storage is unavailable.
  }

  const cleanups: (() => void)[] = []
  for (const branch of menu.querySelectorAll<HTMLDetailsElement>("details[data-nav-key]")) {
    const key = branch.dataset.navKey!
    branch.open = branch.dataset.currentBranch === "true" || state[key] === true
    const save = () => {
      state[key] = branch.open
      try {
        localStorage.setItem(stateKey, JSON.stringify(state))
      } catch {
        // Storage is optional; native details elements remain usable.
      }
    }
    branch.addEventListener("toggle", save)
    cleanups.push(() => branch.removeEventListener("toggle", save))
  }

  const adaptMenu = () => {
    menu.open = !compact.matches
  }
  const outline = document.querySelector<HTMLDetailsElement>(".page-outline-panel")
  const adaptOutline = () => {
    if (outline) outline.open = !outlineCompact.matches
  }
  adaptMenu()
  adaptOutline()
  compact.addEventListener("change", adaptMenu)
  outlineCompact.addEventListener("change", adaptOutline)

  const currentLink = menu.querySelector<HTMLElement>('[aria-current="page"]')
  const scroller = menu.closest<HTMLElement>(".campaign-nav")
  if (!compact.matches && currentLink && scroller) {
    const item = currentLink.getBoundingClientRect()
    const panel = scroller.getBoundingClientRect()
    if (item.bottom > panel.bottom) scroller.scrollTop += item.bottom - panel.bottom + 16
  }

  const searchButton = document.querySelector<HTMLButtonElement>(".search-button")
  const searchLabel = searchButton?.querySelector("p")
  if (searchButton) searchButton.setAttribute("aria-label", "Cerca nella wiki")
  if (searchLabel) searchLabel.textContent = "Cerca nella wiki"
  const searchInput = document.querySelector<HTMLInputElement>(".search-bar")
  if (searchInput) {
    searchInput.placeholder = "Cerca un luogo, un nome, una sessione…"
    searchInput.setAttribute("aria-label", "Cerca nella wiki")
  }

  const outlineLinks = Array.from(outline?.querySelectorAll<HTMLAnchorElement>("a") ?? [])
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (!visible) return
      for (const link of outlineLinks) {
        if (link.getAttribute("href") === `#${visible.target.id}`)
          link.setAttribute("aria-current", "location")
        else link.removeAttribute("aria-current")
      }
    },
    { rootMargin: "-5% 0px -65% 0px" },
  )
  for (const link of outlineLinks) {
    const id = decodeURIComponent((link.getAttribute("href") ?? "").slice(1))
    const heading = document.getElementById(id)
    if (heading) observer.observe(heading)
  }

  const closeOnNavigate = (event: MouseEvent) => {
    if (compact.matches && (event.target as Element).closest("a")) menu.open = false
  }
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && compact.matches && menu.open) {
      menu.open = false
      menu.querySelector<HTMLElement>(":scope > summary")?.focus()
    }
  }
  menu.addEventListener("click", closeOnNavigate)
  menu.addEventListener("keydown", closeOnEscape)
  window.addCleanup(() => {
    observer.disconnect()
    cleanups.forEach((cleanup) => cleanup())
    compact.removeEventListener("change", adaptMenu)
    outlineCompact.removeEventListener("change", adaptOutline)
    menu.removeEventListener("click", closeOnNavigate)
    menu.removeEventListener("keydown", closeOnEscape)
  })
}

document.addEventListener("nav", setupSiteNavigation)
