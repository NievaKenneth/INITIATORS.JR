# UIX-05 Usability Review

## Scope

Reviewed UIX-02, UIX-03, UIX-04, the UIX-04 developer handoff, and the requested landing, auth, dashboard, user-management, shell, module, settings, and design-token source files by code reading. No app or browser was run; live database behavior, rendered breakpoints, keyboard/screen-reader behavior, and runtime error states were not observed.

## Summary

- The built screens broadly follow the approved Hope design system and preserve the main role-based routes.
- The landing page copy, module cards, and account links match UIX-04.
- The top concerns are ambiguous disapproval status, pending users being easy to miss, and incomplete keyboard behavior.
- Rights grouping and module controls follow the design in code; persistence and the rendered dialog still need browser verification.
- Auth forms include field-level errors and password guidance, but one empty-email message differs from the handoff.
- No visual, responsive, or assistive-technology behavior is claimed as browser-verified.

## Findings

| ID | Screen | Problem | Severity | Recommendation | Suggested owner | Verified how |
|---|---|---|---|---|---|---|
| U5-01 | User list and sign in | Disapproving a pending user sets the displayed status to `Inactive`, while login says “Your account is blocked. Contact an administrator.” UIX-03 shows Active, Pending, and Blocked; the current labels can make a disapproval look like a block. | Medium | Align the displayed status and login explanation for disapproved accounts with the approved status vocabulary. | DEV + UIX | Compared UIX-03/handoff with user action and login code. |
| U5-02 | User list | There is no Pending filter or pending count. Pending users appear in the full list and can be missed among other accounts. | Medium | Add a visible pending count or status filter so approvals are easy to find. | DEV | Code reading; no data/browser test. |
| U5-03 | User-management dialogs | The add/edit and Rights dialogs set initial focus, but the custom dialogs do not trap focus or restore it on close. The confirmation dialog has no initial focus target. | Medium | Use a dialog pattern that manages initial focus, tab containment, Escape, and focus return for every dialog. | DEV | Code reading; keyboard behavior not tested. |
| U5-04 | Mobile navigation | The closed sidebar is moved off-screen with a transform but remains in the document and its links are not hidden from keyboard navigation. Escape is not handled to close the mobile menu. | Medium | Make the closed sidebar inert/hidden to keyboard users, close it on Escape, and manage focus when opening and closing. | DEV | Code reading; mobile keyboard behavior not tested. |
| U5-05 | User list actions | Pending User rows show Rights and Edit in addition to Approve and Disapprove. UIX-03 and its handoff show only Approve and Disapprove for pending users. | Medium | Confirm the intended pending-row actions and align the design and implementation. | UIX + DEV | Compared built action conditions with UIX-03/handoff. |
| U5-06 | Make Admin / Remove Admin | Both actions report “User updated.” This matches the handoff, but does not tell the operator which role change succeeded. | Low | Consider action-specific success copy in the approved design, then use it consistently in the UI. | UIX | Compared the handoff message with the action result code. |
| U5-07 | Forgot password | Submitting an empty email shows “Enter a valid email address.” rather than the handoff’s “Enter your email address.” | Low | Handle an empty value separately and use the exact handoff message. | DEV | Code reading against the handoff. |
| U5-08 | Logout | Successful logout redirects to `/login`; if the logout API fails, the native form displays its JSON error response as a page. | Low | Handle the failure in the shell and show a readable message instead of rendering raw JSON. | DEV | Read the form and API response code; neither path was run. |
| U5-09 | User Management | The page says “Manage account access and user details.” UIX-03 says “Manage account access and module rights.” | Low | Use the approved UIX-03 wording. | DEV | Compared the page copy with UIX-03. |

## Passed checks

- The landing page is static in source, includes the UIX-04 hero, all six module cards, and Sign In/Register links to `/login` and `/register`.
- Dashboard source keeps `/dashboard` and `/user-dashboard`; role-specific navigation includes User Management for Admin/Superadmin and System Settings only for Superadmin.
- User dashboard source shows granted modules as links and ungranted modules as disabled tiles with an explanatory message.
- User list source includes loading and error feedback, a no-results state, labelled search/role controls, and a horizontally scrollable table.
- Rights source loads the catalogue/current selections, groups actions by module, implements All/None and module toggles, and disables rights while a module is off.
- Auth source includes adjacent field-error slots, required inputs, password guidance, and invalid-reset-link messaging.
- Risky user actions have confirmation dialogs; the expected action buttons and status announcements are present in source.

## Suggested follow-up tasks

1. Align disapproved-user status and sign-in messaging with the approved status vocabulary.
2. Add a Pending count or filter to User Management.
3. Make the mobile sidebar keyboard-safe and add Escape/focus handling.
4. Complete focus management for add/edit, Rights, and confirmation dialogs.
5. Confirm whether Pending users should have Rights/Edit actions, then align the design and build.
6. Correct empty-email validation and handle logout failures without exposing raw JSON.
7. Review action-specific copy for Make Admin and Remove Admin; update the design source before changing the approved wording.
8. Restore the UIX-03 User Management description copy.

## Items for human browser check

- At 375px, 768px, and 1280px: landing layout, user-list scrolling, dialog sizing, and mobile sidebar behavior.
- Landing Sign In/Register buttons navigate to the correct routes.
- Superadmin, Admin, and User see the intended menu; also check a User with no modules and one with selected modules.
- A User who types a URL for an ungranted module is redirected; logged-out access redirects to sign in.
- Rights dialog module toggles, individual rights, All/None, Save, Cancel, and persistence after reopening.
- Admin attempts a role-restricted action and receives a refusal; Rights is absent on Admin and Superadmin rows.
- Disapprove a pending user and confirm the status/list and login explanation are clear.
- Logout success ends at `/login`; exercise an API failure and confirm no raw JSON is shown.
- Keyboard tab order, Escape, focus entering/returning from dialogs, visible focus, and screen-reader announcements.
