// Local design states only; no publication, persistence, or network requests.
const mode = document.querySelector('#review-mode');
const reasonField = document.querySelector('#reason-field');
const reason = document.querySelector('#reason');
const submit = document.querySelector('#review-submit');
const feedback = document.querySelector('#review-feedback');
let stale = true;
const decisions = {
  review: ['Review submission', 'Inspect the submitted revision before choosing a decision.'],
  changes: [
    'Request changes',
    'Explain what the faculty owner needs to revise before resubmitting. The current publication remains available.',
  ],
  approve: [
    'Approve publication',
    'Approve the reviewed revision for new learners. Existing learners keep the revision they started. No reason is required.',
  ],
  reject: [
    'Reject submission',
    'Explain why this submitted revision cannot be approved. The existing published revision remains available.',
  ],
};
function updateReview() {
  const [title, help] = decisions[mode.value];
  const needsReason = mode.value === 'changes' || mode.value === 'reject';
  document.querySelector('#decision-title').textContent = title;
  document.querySelector('#decision-help').textContent = help;
  reasonField.hidden = !needsReason;
  reason.disabled = !needsReason;
  reason.required = needsReason;
  submit.hidden = mode.value === 'review';
  submit.disabled = stale;
  submit.textContent = title;
  feedback.textContent = '';
}
mode.addEventListener('change', updateReview);
document.querySelector('#refresh-submission').addEventListener('click', () => {
  stale = false;
  document.querySelector('#stale-submission').hidden = true;
  updateReview();
  feedback.textContent = 'Current example loaded. Choose a review action to explore its fields.';
  mode.focus();
});
document.querySelector('#review-details').addEventListener('submit', (event) => {
  event.preventDefault();
  if (stale || mode.value === 'review') return;
  feedback.textContent = `Preview only: ${decisions[mode.value][0]} selected. No decision was saved.`;
});
updateReview();
