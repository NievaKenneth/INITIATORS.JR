# UIX-04 Developer Handoff

Practical implementation notes for the Next.js App Router, Tailwind CSS, and Supabase. The HTML files are visual references; use server-side authorization for every protected route and mutation.

## 1. Screen map

| Design file | Screens | Next.js route |
| --- | --- | --- |
| `design/html/UIX-04-landing-page.html` | Public landing page | `/` |
| `design/html/UIX-02-auth-wireframes.html` | Registration | `/register` |
| `design/html/UIX-02-auth-wireframes.html` | Sign in and credential/status errors | `/login` |
| `design/html/UIX-02-auth-wireframes.html` | Forgot password | `/forgot-password` |
| `design/html/UIX-02-auth-wireframes.html` | Reset password and invalid/expired link | `/reset-password` |
| `design/html/UIX-02-auth-wireframes.html` | First-login password setup | `/set-password` |
| `design/html/UIX-03-admin-wireframes.html` | Superadmin/Admin dashboard | `/dashboard` |
| `design/html/UIX-03-admin-wireframes.html` | Rights-filtered User dashboard | `/user-dashboard` |
| `design/html/UIX-03-admin-wireframes.html` | User list, add/edit, status actions, rights dialog | `/users` |
| `design/html/UIX-01-design-system.html` | Foundations and component reference; not an app screen | No route |

The UIX-04 links are relative standalone-file links to UIX-02. Point them to `/login` and `/register` after integration.

## 2. Design tokens

Core colors, font family, spacing, and radii used by UIX-01/02/03:

```css
:root {
  --hope-forest: #173F35;
  --hope-sidebar: #142D27;
  --hope-green-2: #2F6B55;
  --hope-sage: #DCE8DF;
  --hope-ivory: #F7F5EE;
  --hope-gold: #C5A45B;
  --hope-ink: #202B26;
  --hope-border: #E3E8E1;
  --hope-white: #FFFFFF;

  --font-sans: Inter, "Segoe UI", Arial, sans-serif;
  --text-h1: 700 32px/1.2 var(--font-sans);
  --text-h2: 600 24px/1.3 var(--font-sans);
  --text-h3: 600 18px/1.4 var(--font-sans);
  --text-body: 400 14px/1.55 var(--font-sans);
  --text-caption: 400 12px/1.45 var(--font-sans);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 999px;
}
```

UIX-01 also defines `--shadow-card: 0 2px 10px rgb(20 45 39 / 5%)` and `--focus-ring: 0 0 0 3px rgb(47 107 85 / 24%)`.

## 3. Reusable components

| Component | Use |
| --- | --- |
| `AuthCard` | UIX-02 login, registration, forgot/reset password, and first-login password screens |
| `TextField` | Email/name fields in UIX-02 and user add/edit forms in UIX-03 |
| `PasswordField` | Login, registration, reset, and first-login password forms in UIX-02 |
| `Button` | Public landing page, auth forms, dashboard, user list, and dialogs |
| `Dialog` | UIX-03 add/edit user and confirmation flows |
| `StatusBadge` | Active, Pending, and Blocked rows in UIX-03 |
| `RightsDialog` | UIX-03 module and action rights editor |
| `Sidebar` | UIX-03 dashboard and User Management, filtered by role and user grants |
| `ModuleTile` | UIX-03 dashboard and public module cards in UIX-04 |
| `DataTable` | UIX-03 User Management list |

Keep visible labels, focus indicators, adjacent field errors, and dialog keyboard behavior when extracting components.

## 4. Forms, field names, and error-slot IDs

### UIX-02

| Form | Field `name` | Input ID | Error-slot ID |
| --- | --- | --- | --- |
| `login-form` | `email` | `login-email` | `login-email-error` |
| `login-form` | `password` | `login-password` | `login-password-error` |
| `register-form` | `firstName` | `register-first-name` | `register-first-name-error` |
| `register-form` | `lastName` | `register-last-name` | `register-last-name-error` |
| `register-form` | `email` | `register-email` | `register-email-error` |
| `register-form` | `password` | `register-password` | `register-password-error` |
| `register-form` | `confirmPassword` | `register-confirm` | `register-confirm-error` |
| `forgot-form` | `email` | `forgot-email` | `forgot-email-error` |
| `reset-form` | `password` | `reset-password` | `reset-password-error` |
| `reset-form` | `confirmPassword` | `reset-confirm` | `reset-confirm-error` |
| `set-password-form` | `password` | `first-login-password` | `first-login-password-error` |
| `set-password-form` | `confirmPassword` | `first-login-confirm` | `first-login-confirm-error` |

Form message IDs: `login-message`, `register-message`, `forgot-message`, `reset-message`, and `set-password-message`. The invalid-link message slot is `reset-link-error`.

### UIX-03

| Form | Field `name` | Input ID | Error-slot ID |
| --- | --- | --- | --- |
| `user-form` | `firstName` | `user-first-name` | `user-first-name-error` |
| `user-form` | `lastName` | `user-last-name` | `user-last-name-error` |
| `user-form` | `email` | `user-email` | `user-email-error` |
| `user-form` | `role` | `user-role` | `user-role-error` |
| `user-form` | `status` | `user-status` | `user-status-error` |

Dialog message IDs: `user-form-message`, `rights-form-message`, and `confirm-error`. The rights checkboxes use `data-right` keys and `data-module` module toggles rather than named text fields.

## 5. Exact messages in the designs

### UIX-02 auth and validation

- `Enter your email address.`
- `Enter a valid email address.`
- `Enter your password.`
- `Enter a password.`
- `Enter your first name.`
- `Enter your last name.`
- `Use at least 8 characters, including an uppercase letter, a lowercase letter, and a number.`
- `Confirm your password.`
- `Passwords do not match.`
- `An account with this email already exists.`
- `Your account is waiting for admin approval.`
- `Email or password is incorrect.`
- `Your account is blocked. Contact an administrator.`
- `Signed in successfully.`
- `If an account exists for this email, a reset link has been sent.`
- `This reset link is invalid or has expired. Request a new link.`
- `Password set. You can now sign in.`
- `Password updated. You can now sign in.`

### UIX-03 user-management and demo feedback

- `User approved.`
- `User disapproved.`
- `User blocked.`
- `User unblocked.`
- `Rights saved.`
- `A user with this email already exists.`
- `You cannot block your own account.`
- `The last Superadmin cannot be blocked.`
- `Enter a valid email address.`
- `Enter a first name.`
- `Enter a last name.`
- `Select a valid role.`
- `Select a valid status.`
- `User updated.`
- `User added.`
- `The selected user could not be found.`
- `Signed out of the demo.`
- `No users found.`

## 6. Password rules

UIX-02 requires at least 8 characters, including at least one uppercase letter, one lowercase letter, and one digit. Confirmation must exactly match. No special-character requirement is shown.

## 7. The 36 rights

Rights keys use the UIX-03 `data-right` values.

**Customer (3)**

- `customer.add` — Add Customer
- `customer.edit` — Edit Customer
- `customer.delete` — Delete Customer

**Product (6)**

- `product.add` — Add Product
- `product.edit` — Edit Product
- `product.delete` — Delete Product
- `product.price.add` — Add Price
- `product.price.edit` — Edit Price
- `product.price.delete` — Delete Price

**Human Resources (13)**

- `humanResources.job.add` — Add Job
- `humanResources.job.edit` — Edit Job
- `humanResources.job.delete` — Delete Job
- `humanResources.department.add` — Add Department
- `humanResources.department.edit` — Edit Department
- `humanResources.department.delete` — Delete Department
- `humanResources.employee.add` — Add Employee
- `humanResources.employee.edit` — Edit Employee
- `humanResources.employee.delete` — Delete Employee
- `humanResources.jobHistory.view` — View Job History
- `humanResources.jobHistory.add` — Add Job History
- `humanResources.jobHistory.edit` — Edit Job History
- `humanResources.jobHistory.delete` — Delete Job History

**Sales (7)**

- `sales.sale.add` — Add Sale
- `sales.sale.edit` — Edit Sale
- `sales.sale.delete` — Delete Sale
- `sales.saleDetail.view` — View Sale Detail
- `sales.saleDetail.add` — Add Sale Detail
- `sales.saleDetail.edit` — Edit Sale Detail
- `sales.saleDetail.delete` — Delete Sale Detail

**Reports (7)**

- `reports.topCustomers` — Top Customers
- `reports.productMasterList` — Product Master List
- `reports.topProducts` — Top Products
- `reports.activeEmployees` — Active Employees
- `reports.allEmployees` — All Employees
- `reports.employeeJobHistory` — Employee Job History
- `reports.topSales` — Top Sales

## 8. Role rules shown in UIX-03

- **Superadmin:** all five rights-bearing modules, User Management, and System Settings. Can manage user roles. Cannot block their own account or the last non-blocked Superadmin.
- **Admin:** all five modules and User Management; no System Settings. Superadmin rows are hidden. Other Admin rows show `—` in Actions. Add User is limited to the User role.
- **User:** only modules granted through the Rights dialog are enabled in the sidebar and dashboard; other module entries are disabled.
- Pending users can be approved or disapproved. Active users have Block, Rights, and Edit actions; Blocked users have Unblock, Rights, and Edit actions, subject to the Admin restrictions above.

## 9. Demo-only behavior to replace

- UIX-02's sign-in accounts, account statuses, registration, password updates, and reset link are in-memory browser simulations. Replace them with Supabase Auth/server actions and real email/reset flows. Never trust a browser-supplied role or status.
- UIX-03's users, roles, statuses, CRUD, confirmations, Rights changes, and role switcher exist only in page memory. Replace with server-authorized APIs and persisted profile/rights data.
- Enforce account approval/block state and role/rights checks on the server and in Supabase RLS policies; do not rely on hidden or disabled UI controls for authorization.
- Issue and validate real password-reset tokens, protect first-login setup, and avoid returning whether an email exists where the UI message is generic.
- UIX-04's links and content are static; connect navigation to the real routes after integration.

## 10. Inconsistencies to resolve

- UIX-01 describes six modules including User Management. UIX-03's Rights dialog grants rights across five groups (Customer, Product, Human Resources, Sales, Reports) and treats User Management separately as an admin screen. UIX-04 includes User Management as a sixth public module card. Confirm whether it is a true user-grantable module or an admin-only feature.
- UIX-02's public backdrop shows four modules (Customers, Products, Human Resources, Sales), while UIX-03 and UIX-04 show Reports and UIX-04 also shows User Management. This may be intentional marketing scope, but the module list differs.
- UIX-02's demo login logic calls the successful status `approved`; UIX-03's user list calls the equivalent status `Active`. Use one status vocabulary in server data and map it to approved-login behavior.
- UIX-01 and UIX-03 define `--radius-pill: 999px`; UIX-02 omits that token. The other shared core colors, font stack, spacing values, and radii match.
