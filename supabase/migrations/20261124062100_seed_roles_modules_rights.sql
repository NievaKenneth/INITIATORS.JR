
-- S1-DBA-05: Seed default roles, modules, and 36 individual rights.
-- Idempotent: safe to run more than once.

BEGIN;

-- 1. Default roles
INSERT INTO public.role (role_code, role_name)
VALUES
    ('superadmin', 'Superadmin'),
    ('admin', 'Admin'),
    ('user', 'User')
ON CONFLICT (role_code) DO UPDATE
SET role_name = EXCLUDED.role_name;

-- 2. Five application modules
INSERT INTO public.module (module_code, module_name, sort_order)
VALUES
    ('customers', 'Customer', 1),
    ('products', 'Product', 2),
    ('hr', 'Human Resources', 3),
    ('sales', 'Sales', 4),
    ('reports', 'Reports', 5)
ON CONFLICT (module_code) DO UPDATE
SET
    module_name = EXCLUDED.module_name,
    sort_order = EXCLUDED.sort_order;

-- 3. Customer rights (3)
INSERT INTO public.rights (right_code, module_code, description)
VALUES
    ('customers.add', 'customers', 'Add Customer'),
    ('customers.edit', 'customers', 'Edit Customer'),
    ('customers.delete', 'customers', 'Delete Customer'),

    -- 4. Product rights (6)
    ('products.add', 'products', 'Add Product'),
    ('products.edit', 'products', 'Edit Product'),
    ('products.delete', 'products', 'Delete Product'),
    ('products.priceAdd', 'products', 'Add Price'),
    ('products.priceEdit', 'products', 'Edit Price'),
    ('products.priceDelete', 'products', 'Delete Price'),

    -- 5. Human Resources rights (13)
    ('hr.jobAdd', 'hr', 'Add Job'),
    ('hr.jobEdit', 'hr', 'Edit Job'),
    ('hr.jobDelete', 'hr', 'Delete Job'),
    ('hr.deptAdd', 'hr', 'Add Department'),
    ('hr.deptEdit', 'hr', 'Edit Department'),
    ('hr.deptDelete', 'hr', 'Delete Department'),
    ('hr.empAdd', 'hr', 'Add Employee'),
    ('hr.empEdit', 'hr', 'Edit Employee'),
    ('hr.empDelete', 'hr', 'Delete Employee'),
    ('hr.jhView', 'hr', 'View Job History'),
    ('hr.jhAdd', 'hr', 'Add Job History'),
    ('hr.jhEdit', 'hr', 'Edit Job History'),
    ('hr.jhDelete', 'hr', 'Delete Job History'),

    -- 6. Sales rights (7)
    ('sales.add', 'sales', 'Add Sale'),
    ('sales.edit', 'sales', 'Edit Sale'),
    ('sales.delete', 'sales', 'Delete Sale'),
    ('sales.detailView', 'sales', 'View Sale Detail'),
    ('sales.detailAdd', 'sales', 'Add Sale Detail'),
    ('sales.detailEdit', 'sales', 'Edit Sale Detail'),
    ('sales.detailDelete', 'sales', 'Delete Sale Detail'),

    -- 7. Reports rights (7)
    ('reports.topCustomers', 'reports', 'Top Customers'),
    ('reports.productMaster', 'reports', 'Product Master List'),
    ('reports.topProducts', 'reports', 'Top Products'),
    ('reports.activeEmployees', 'reports', 'Active Employees'),
    ('reports.allEmployees', 'reports', 'All Employees'),
    ('reports.empJobHistory', 'reports', 'Employee Job History'),
    ('reports.topSales', 'reports', 'Top Sales')
ON CONFLICT (right_code) DO UPDATE
SET
    module_code = EXCLUDED.module_code,
    description = EXCLUDED.description;

COMMIT;
