// Fixture navigation only. No authentication, persistence, email, or provider calls.
const screens = [...document.querySelectorAll('.screen')];
const picker = document.querySelector('#screen-picker');
let opener;
let decision;

function showScreen(moveFocus = false) {
  const id = location.hash.slice(1) || 'sign-in';
  const screen = screens.find((item) => item.id === id);
  if (!screen) {
    document.getElementById(id)?.focus();
    return;
  }
  screens.forEach((item) => {
    item.hidden = item !== screen;
  });
  picker.value = id;
  document.title = `${screen.dataset.title} | CS-GAMUERS reference`;
  document.querySelector('#skip').href = `#${id}-main`;
  document.querySelectorAll('[data-password]').forEach((button) => {
    const input = document.getElementById(button.dataset.password);
    input.value = '';
    input.type = 'password';
    button.textContent = 'Show';
    button.setAttribute('aria-label', 'Show password');
    button.setAttribute('aria-pressed', 'false');
  });
  if (moveFocus) {
    screen.querySelector('h1').focus();
    window.scrollTo(0, 0);
  }
}

picker.addEventListener('change', () => {
  location.hash = picker.value;
});
window.addEventListener('hashchange', () => showScreen(true));
showScreen();

document.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.password) {
    const input = document.getElementById(button.dataset.password);
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    button.textContent = reveal ? 'Hide' : 'Show';
    button.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
    button.setAttribute('aria-pressed', String(reveal));
  }
  if (button.hasAttribute('data-close')) button.closest('dialog').close();
  if (button.hasAttribute('data-save'))
    button.closest('form').querySelector('[data-save-result]').textContent =
      'Changes saved. Your application still needs correction until you resubmit.';
  if (button.hasAttribute('data-home'))
    document.querySelector('[data-home-result]').textContent =
      'Reference endpoint: the existing Student workspace. Its design is outside this reference.';
  if (button.dataset.menu) {
    opener = button;
    const nav = document.querySelector(`#${button.dataset.menu} .sidebar nav`).cloneNode(true);
    const links = document.querySelector('#menu-links');
    links.replaceChildren(...nav.childNodes);
    links
      .querySelectorAll('a')
      .forEach((link) =>
        link.addEventListener('click', () => document.querySelector('#menu-dialog').close())
      );
    document.querySelector('#menu-dialog').showModal();
  }
  if (button.hasAttribute('data-reset-filter')) {
    const queue = button.closest('section');
    queue.querySelectorAll('[data-filter]').forEach((select) => {
      select.selectedIndex = 0;
    });
    queue.querySelectorAll('.applicant').forEach((row) => {
      row.hidden = false;
    });
    queue.querySelector('[data-queue]').hidden = false;
    queue.querySelector('[data-filter-message]').hidden = true;
  }
});

document
  .querySelectorAll('dialog')
  .forEach((dialog) => dialog.addEventListener('close', () => opener?.focus()));
document.addEventListener('change', (event) => {
  if (event.target.matches('input[type=radio]')) {
    const form = event.target.closest('form');
    const needsReason = event.target.value !== 'approve';
    form.querySelector('[data-reason-field]').hidden = !needsReason;
    form.querySelector('[data-reason]').required = needsReason;
  }
  if (event.target.hasAttribute('data-filter')) {
    const queue = event.target.closest('section');
    // shortcut: only Pending fixtures exist; use real query results when implementing the queue.
    const status = queue.querySelector('select');
    const role = queue.querySelectorAll('select')[1];
    const rows = [...queue.querySelectorAll('.applicant')];
    rows.forEach((row) => {
      row.hidden =
        status.selectedIndex !== 0 ||
        (role?.selectedIndex > 0 && !row.textContent.includes(role.value));
    });
    const empty = rows.every((row) => row.hidden);
    queue.querySelector('[data-queue]').hidden = empty;
    queue.querySelector('[data-filter-message]').hidden = !empty;
  }
});

document.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.hasAttribute('data-review') || form.hasAttribute('data-reopen')) {
    const choice = form.hasAttribute('data-reopen')
      ? 'reopen'
      : form.querySelector('input[type=radio]:checked').value;
    const reason = form.querySelector('[data-reason]').value;
    const error = form.querySelector('[data-review-error]');
    error.textContent =
      choice === 'approve' &&
      [...form.querySelectorAll('[data-check]')].some((check) => !check.checked)
        ? 'Complete the school-record checks before approving.'
        : choice !== 'approve' && (!reason.trim() || [...reason].length > 2000)
          ? 'Enter a reason of 2,000 characters or fewer.'
          : '';
    error.hidden = !error.textContent;
    if (!error.hidden) {
      error.focus();
      return;
    }
    decision = {
      choice,
      reason,
      name: form.dataset.applicant,
      role: form.dataset.role,
      screen: choice === 'reopen' ? 'review' : form.closest('.screen').id,
    };
    const labels = {
      approve: 'Approve application',
      correction: 'Send correction request',
      reject: 'Reject application',
      reopen: 'Reopen for review',
    };
    const copy = {
      approve: 'An active account will receive the permissions of this role.',
      correction: 'The applicant can correct this application and resubmit.',
      reject: 'The applicant cannot resubmit unless an Administrator reopens it.',
      reopen:
        'Return this application to Pending review. This does not approve or reactivate the account.',
    };
    document.querySelector('#decision-title').textContent = `${labels[choice]}?`;
    document.querySelector('#decision-copy').textContent =
      `${decision.name} · ${decision.role}. ${copy[choice]}`;
    const reasonNode = document.querySelector('#decision-reason');
    reasonNode.hidden = choice === 'approve';
    reasonNode.textContent = choice === 'approve' ? '' : reason;
    const confirm = document.querySelector('#decision-confirm');
    confirm.textContent = labels[choice];
    confirm.className = choice === 'reject' ? 'danger' : 'primary';
    opener = form.querySelector('button[type=submit]');
    document.querySelector('#decision-dialog').showModal();
  } else if (form.hasAttribute('data-resend')) {
    form.querySelector('[data-resend-result]').textContent =
      'If this address can be verified, a new link will be queued. Please wait at least 60 seconds before requesting another.';
  } else if (form.dataset.next) {
    location.hash = form.dataset.next;
  }
});

document.querySelector('#decision-confirm').addEventListener('click', () => {
  const saved = document.querySelector('#review-saved');
  saved.querySelector('header p').textContent = `${decision.name} · ${decision.role}`;
  const outcome = saved.querySelector('#saved-outcome');
  outcome.className = `notice ${decision.choice === 'approve' ? 'success' : decision.choice === 'reject' ? 'error' : 'warning'}`;
  outcome.textContent = {
    approve: 'Application approved.',
    correction: 'Correction request saved. The application needs correction.',
    reject: 'Application rejected.',
    reopen: 'Application reopened for review. The status is Pending review.',
  }[decision.choice];
  saved.querySelector('#saved-reason').textContent = decision.reason;
  saved.querySelector('#saved-reason').hidden = decision.choice === 'approve';
  saved.querySelector('#saved-delivery').textContent =
    'Decision saved. Email delivery failed. Delivery is retried separately; do not repeat the decision.';
  saved.querySelector('#saved-delivery').hidden = decision.screen === 'faculty-review';
  saved.querySelector('.small').hidden = decision.screen === 'faculty-review';
  saved.querySelectorAll('a').forEach((link) => {
    link.href = `#${decision.screen}`;
  });
  document.querySelector('#decision-dialog').close();
  location.hash = 'review-saved';
});
