// src/utils/status.js
// Single source of truth mapping a complaint/item/demand state -> label + colors.
export function statusMeta(raw, colors) {
  const k = String(raw || '').toLowerCase().replace(/[\s_-]+/g, '');
  const map = {
    notassigned: { label: 'Not Assigned', color: colors.textSecondary, tint: colors.surfaceAlt },
    unassigned: { label: 'Not Assigned', color: colors.textSecondary, tint: colors.surfaceAlt },
    booked: { label: 'Booked', color: colors.info, tint: colors.infoTint },
    assigned: { label: 'Assigned', color: colors.info, tint: colors.infoTint },
    ongoing: { label: 'Ongoing', color: colors.warning, tint: colors.warningTint },
    inprogress: { label: 'Ongoing', color: colors.warning, tint: colors.warningTint },
    delayed: { label: 'Delayed', color: colors.danger, tint: colors.dangerTint },
    pending: { label: 'Pending', color: colors.warning, tint: colors.warningTint },
    resolved: { label: 'Resolved', color: colors.success, tint: colors.successTint },
    completed: { label: 'Completed', color: colors.success, tint: colors.successTint },
    closed: { label: 'Closed', color: colors.success, tint: colors.successTint },
    rejected: { label: 'Rejected', color: colors.danger, tint: colors.dangerTint },
    returned: { label: 'Returned', color: colors.textSecondary, tint: colors.surfaceAlt },
    approved: { label: 'Approved', color: colors.success, tint: colors.successTint },
  };
  return map[k] || { label: raw ? String(raw) : '—', color: colors.textSecondary, tint: colors.surfaceAlt };
}
