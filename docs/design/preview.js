// Design-only drawer interaction; no account, storage, or network operations.
const drawer = document.querySelector('dialog');
const trigger = document.querySelector('[data-menu]');
trigger.addEventListener('click', () => {
  drawer.showModal();
  trigger.setAttribute('aria-expanded', 'true');
});
document.querySelector('[data-close]').addEventListener('click', () => drawer.close());
drawer.addEventListener('close', () => {
  trigger.setAttribute('aria-expanded', 'false');
  trigger.focus();
});
